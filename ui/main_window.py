import os
import sys
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog

from core.image_processor import ImageItem, MAX_FILE_SIZE_MB
from core.archive_handler import ArchiveHandler
from core.exporter import Exporter

from .styles import apply_theme_styles, THEME
from .header_bar import HeaderBar
from .sidebar import Sidebar
from .canvas_view import CanvasView
from .progress_dialog import ProgressDialog, ToastNotification


class MainWindow(tk.Tk):
    """
    Ventana principal de la aplicación.
    Estructura modular limpia que coordina HeaderBar, Sidebar, CanvasView y Retroalimentación visual.
    Apertura automática en Pantalla Completa / Maximizado.
    """

    def __init__(self):
        super().__init__()
        self.title("Organizador de Imágenes - Lienzo Individual 1980x980 px")
        
        # 1. Configurar apertura en PANTALLA COMPLETA / MAXIMIZADA
        self.geometry("1400x860")
        self.minsize(1050, 680)
        try:
            self.state('zoomed')
        except Exception:
            self.attributes('-zoomed', True)

        # Establecer icono de ventana
        icon_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "python_ico.ico")
        if os.path.exists(icon_path):
            try:
                self.iconbitmap(icon_path)
            except Exception:
                pass

        self.bind("<F11>", self.toggle_fullscreen)
        self.is_fullscreen = False

        self.configure(bg=THEME["bg_main"])

        # Estado y Gestores del Core
        self.archive_handler = ArchiveHandler()
        self.images_list = []  # Lista de ImageItem
        self.selected_index = 0
        self.margin_px = tk.IntVar(value=50)
        self.current_archive_name = "Imagenes_Organizadas"
        self._render_after_id = None  # Para debounce del canvas

        # Aplicar estilos centralizados
        apply_theme_styles(self)

        # Construir Interfaz Modular
        self.build_ui()

        # Toast notification system
        self.toast = ToastNotification(self)

        # Teclas de flecha globales
        self.bind_all("<Left>",  self._key_prev)
        self.bind_all("<Right>", self._key_next)
        self.bind_all("<Up>",    self._key_move_up)
        self.bind_all("<Down>",  self._key_move_down)

        # Protocolo de Cierre
        self.protocol("WM_DELETE_WINDOW", self.on_close)

    # ─── Navegación por teclado ────────────────────────────
    def _key_prev(self, event=None):
        """Flecha izquierda: imagen anterior"""
        if str(self.focus_get()) not in ('', str(self)):
            return  # No interferir con inputs activos
        self.select_prev()

    def _key_next(self, event=None):
        """Flecha derecha: imagen siguiente"""
        if str(self.focus_get()) not in ('', str(self)):
            return
        self.select_next()

    def _key_move_up(self, event=None):
        """Flecha arriba: mover imagen seleccionada hacia arriba en la lista"""
        if str(self.focus_get()) not in ('', str(self)):
            return
        if self.images_list and self.selected_index > 0:
            self.reorder_item(self.selected_index, self.selected_index - 1)

    def _key_move_down(self, event=None):
        """Flecha abajo: mover imagen seleccionada hacia abajo en la lista"""
        if str(self.focus_get()) not in ('', str(self)):
            return
        if self.images_list and self.selected_index < len(self.images_list) - 1:
            self.reorder_item(self.selected_index, self.selected_index + 1)



    def toggle_fullscreen(self, event=None):
        self.is_fullscreen = not self.is_fullscreen
        self.attributes("-fullscreen", self.is_fullscreen)

    def build_ui(self):
        # 1. Componente: Barra Superior
        self.header_bar = HeaderBar(
            parent=self,
            on_load_files=self.load_files_dialog,
            on_export_folder=self.export_folder_action,
            on_export_zip=self.export_zip_action
        )

        # 2. Contenedor Divisor Principal (PanedWindow)
        main_paned = tk.PanedWindow(self, orient=tk.HORIZONTAL, bg=THEME["border"], sashwidth=4, bd=0)
        main_paned.pack(fill=tk.BOTH, expand=True)

        # 3. Componente: Panel Lateral Izquierdo (Drag & Drop fluido)
        self.sidebar = Sidebar(
            parent=main_paned,
            on_select=self.select_item,
            on_reorder=self.reorder_item,
            on_delete=self.delete_item,
            on_clear=self.clear_all
        )
        main_paned.add(self.sidebar, minsize=350, width=420)

        # 4. Componente: Visor Central del Canvas 1980x980 px
        self.canvas_view = CanvasView(
            parent=main_paned,
            margin_var=self.margin_px,
            on_margin_change=self.refresh_preview,
            on_prev=self.select_prev,
            on_next=self.select_next
        )
        main_paned.add(self.canvas_view, minsize=550)

        # 5. Barra de Estado Inferior (Status Bar)
        self.status_bar = tk.Frame(self, bg=THEME["bg_header"], height=28, padx=15, pady=4)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)

        self.status_lbl = tk.Label(self.status_bar, text="[ OK ] Listo para cargar imágenes", font=("Segoe UI", 9), fg=THEME["text_muted"], bg=THEME["bg_header"])
        self.status_lbl.pack(side=tk.LEFT)

        specs_lbl = tk.Label(self.status_bar, text="Lienzo: 1980 x 980 px  |  Fondo Blanco  |  Peso max: 1.5 MB por foto", font=("Segoe UI", 9), fg=THEME["accent"], bg=THEME["bg_header"])
        specs_lbl.pack(side=tk.RIGHT)

        self.refresh_all()

    # --- CONTROLADORES DE EVENTOS Y ESTADO ---

    def refresh_all(self):
        """Sincroniza la lista lateral y el visor del canvas"""
        self.sidebar.render(self.images_list, self.selected_index)
        self.refresh_preview()
        count = len(self.images_list)
        if count > 0:
            self.status_lbl.config(text=f"[ OK ] {count} imagenes listas  |  Activa: #{self.selected_index + 1:02d} ({self.images_list[self.selected_index].filename})")
        else:
            self.status_lbl.config(text="[ OK ] Listo para cargar imagenes")

    def refresh_preview(self):
        """Actualiza el lienzo 1980x980 — con debounce de 60ms para fluidez."""
        if self._render_after_id is not None:
            self.after_cancel(self._render_after_id)
        self._render_after_id = self.after(60, self._do_render_preview)

    def _do_render_preview(self):
        """Renderizado real del canvas (llamado por el debounce)."""
        self._render_after_id = None
        count = len(self.images_list)
        if count == 0 or self.selected_index >= count:
            self.canvas_view.render_preview(None, 0, 0)
        else:
            current = self.images_list[self.selected_index]
            self.canvas_view.render_preview(current, self.selected_index, count)

    def select_item(self, index):
        """Llamado por el sidebar cuando el usuario hace CLIC en una tarjeta (no drag)."""
        if 0 <= index < len(self.images_list):
            self.selected_index = index
            self.refresh_all()

    def select_prev(self):
        if self.images_list and self.selected_index > 0:
            self.select_item(self.selected_index - 1)

    def select_next(self):
        if self.images_list and self.selected_index < len(self.images_list) - 1:
            self.select_item(self.selected_index + 1)

    def reorder_item(self, from_idx, to_idx):
        if 0 <= from_idx < len(self.images_list) and 0 <= to_idx < len(self.images_list):
            item = self.images_list.pop(from_idx)
            self.images_list.insert(to_idx, item)
            self.selected_index = to_idx
            self.refresh_all()
            self.toast.show(f"Reordenado: '{item.filename}' -> posicion #{to_idx + 1:02d}", icon="[->]", duration_ms=2000)

    def delete_item(self, idx):
        if 0 <= idx < len(self.images_list):
            removed = self.images_list.pop(idx)
            if self.selected_index >= len(self.images_list):
                self.selected_index = max(0, len(self.images_list) - 1)
            self.refresh_all()
            self.toast.show(f"Eliminada: '{removed.filename}'", icon="[x]", duration_ms=2000)

    def clear_all(self):
        if not self.images_list:
            return
        if messagebox.askyesno("Confirmar", "¿Deseas vaciar todas las imágenes de la lista?"):
            self.images_list.clear()
            self.selected_index = 0
            self.refresh_all()
            self.toast.show("Lista de imágenes vaciada", icon="[-]")

    def load_files_dialog(self):
        paths = filedialog.askopenfilenames(
            title="Seleccionar archivo comprimido (ZIP) o imágenes",
            filetypes=[("Archivos soportados", "*.zip;*.tar;*.gz;*.png;*.jpg;*.jpeg;*.webp;*.bmp"), ("Todos los archivos", "*.*")]
        )
        if not paths:
            return

        # Retroalimentación visual de carga
        prog = ProgressDialog(self, title="Cargando y procesando imágenes...", subtitle="Descomprimiendo y generando miniaturas")
        total_paths = len(paths)
        loaded_items = []

        try:
            for idx, path in enumerate(paths):
                prog.update_progress(idx + 1, total_paths, f"Cargando {os.path.basename(path)}")
                if path.lower().endswith(('.zip', '.tar', '.gz')):
                    self.current_archive_name = os.path.splitext(os.path.basename(path))[0]
                    items = self.archive_handler.extract_archive(path)
                    loaded_items.extend(items)
                else:
                    loaded_items.append(ImageItem(path, os.path.basename(path)))

            self.images_list.extend(loaded_items)

            if self.images_list:
                self.selected_index = 0
                self.refresh_all()
                self.toast.show(f"Se cargaron {len(loaded_items)} imagenes exitosamente", icon="[OK]", duration_ms=3500)
        finally:
            prog.close()

    # --- ACCIONES DE EXPORTACIÓN DUAL CON RETROALIMENTACIÓN DE PROGRESO EN VIVO ---

    def export_folder_action(self):
        """Crea directamente la carpeta física en disco con barra de progreso en vivo"""
        if not self.images_list:
            messagebox.showwarning("Sin imágenes", "No hay imágenes cargadas para exportar.")
            return

        default_folder = self.current_archive_name or "Imagenes_Organizadas"
        folder_name = simpledialog.askstring("Nombre de Carpeta", "Ingresa el nombre para la carpeta de destino:", initialvalue=default_folder, parent=self)
        if not folder_name or not folder_name.strip():
            return
        folder_name = folder_name.strip()

        target_parent = filedialog.askdirectory(title="Selecciona la ubicación donde guardar la carpeta")
        if not target_parent:
            return

        export_dir = os.path.join(target_parent, folder_name)

        # Diálogo de progreso en vivo
        prog = ProgressDialog(self, title="Exportando a Carpeta Descomprimida...", subtitle=f"Guardando en: {folder_name}")
        total = len(self.images_list)

        try:
            def on_progress(current, total_count):
                prog.update_progress(current, total_count, f"Renderizando {current:02d}.png (<= 1.5 MB)")

            Exporter.export_to_directory(
                images_list=self.images_list,
                target_folder_path=export_dir,
                margin_px=self.margin_px.get(),
                max_size_mb=MAX_FILE_SIZE_MB,
                progress_callback=on_progress
            )

            prog.close()
            self.toast.show(f"Carpeta exportada: {total} imagenes guardadas", icon="[OK]", duration_ms=4000)

            msg = (
                f"[OK] Carpeta exportada exitosamente\n\n"
                f"Ubicacion: {export_dir}\n"
                f"Total: {total} imagenes (01.png, 02.png... en lienzo 1980x980 px)\n"
                f"Peso: Maximo 1.5 MB por imagen\n\n"
                f"¿Deseas abrir la carpeta en el Explorador de Windows?"
            )
            if messagebox.askyesno("Exportacion Exitosa", msg):
                if sys.platform == "win32":
                    os.startfile(export_dir)
                else:
                    os.system(f'open "{export_dir}"')

        except Exception as e:
            prog.close()
            messagebox.showerror("Error al exportar", f"Error guardando carpeta: {str(e)}")

    def export_zip_action(self):
        """Exporta directamente como un archivo .ZIP comprimido con barra de progreso en vivo"""
        if not self.images_list:
            messagebox.showwarning("Sin imagenes", "No hay imagenes cargadas para exportar.")
            return

        default_zip = f"{self.current_archive_name or 'Imagenes_Organizadas'}.zip"
        zip_path = filedialog.asksaveasfilename(
            title="Guardar como archivo ZIP",
            defaultextension=".zip",
            initialfile=default_zip,
            filetypes=[("Archivo ZIP", "*.zip")]
        )
        if not zip_path:
            return

        folder_inside = os.path.splitext(os.path.basename(zip_path))[0]
        prog = ProgressDialog(self, title="Generando archivo ZIP...", subtitle=f"Empaquetando en: {os.path.basename(zip_path)}")
        total = len(self.images_list)

        try:
            def on_progress(current, total_count):
                prog.update_progress(current, total_count, f"Comprimiendo {current:02d}.png")

            Exporter.export_to_zip(
                images_list=self.images_list,
                zip_file_path=zip_path,
                folder_inside_name=folder_inside,
                margin_px=self.margin_px.get(),
                max_size_mb=MAX_FILE_SIZE_MB,
                progress_callback=on_progress
            )

            prog.close()
            self.toast.show(f"ZIP generado: {total} imagenes", icon="[ZIP]", duration_ms=4000)

            messagebox.showinfo(
                "Exportacion Exitosa",
                f"[OK] Archivo ZIP generado exitosamente\n\n"
                f"Archivo: {zip_path}\n"
                f"Total: {total} imagenes (peso max: 1.5 MB cada una)"
            )
        except Exception as e:
            prog.close()
            messagebox.showerror("Error al exportar ZIP", f"Error generando archivo ZIP: {str(e)}")

    def on_close(self):
        self.archive_handler.cleanup()
        self.destroy()
