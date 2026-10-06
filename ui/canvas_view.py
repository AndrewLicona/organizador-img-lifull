import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
from core.image_processor import CANVAS_WIDTH, CANVAS_HEIGHT, ImageProcessor
from .styles import THEME


class CanvasView(ttk.Frame):
    """Componente central para la previsualización del lienzo 1980x980 px y navegación"""

    def __init__(self, parent, margin_var, on_margin_change, on_prev, on_next):
        super().__init__(parent, style="CanvasView.TFrame")

        self.margin_var = margin_var
        self.on_margin_change = on_margin_change
        self.on_prev = on_prev
        self.on_next = on_next
        self._current_tk_img = None

        self.build_ui()

    def build_ui(self):
        # 1. Barra de Controles Superior
        cp_controls = tk.Frame(self, bg=THEME["bg_main"], padx=20, pady=10)
        cp_controls.pack(fill=tk.X)

        self.info_lbl = tk.Label(cp_controls, text="Vista Previa: Ninguna imagen seleccionada", font=("Segoe UI", 11, "bold"), fg=THEME["accent"], bg=THEME["bg_main"])
        self.info_lbl.pack(side=tk.LEFT)

        margin_box = tk.Frame(cp_controls, bg=THEME["bg_main"])
        margin_box.pack(side=tk.RIGHT)

        tk.Label(margin_box, text="Márgenes Canvas (px):", bg=THEME["bg_main"], fg=THEME["text"]).pack(side=tk.LEFT, padx=(0, 6))
        margin_spin = ttk.Spinbox(margin_box, from_=0, to=400, increment=10, textvariable=self.margin_var, width=5, command=self.on_margin_change)
        margin_spin.pack(side=tk.LEFT)
        margin_spin.bind("<KeyRelease>", lambda e: self.on_margin_change())

        # 2. Área Central del Canvas Viewport
        self.preview_area = tk.Frame(self, bg=THEME["bg_card"], padx=20, pady=15)
        self.preview_area.pack(fill=tk.BOTH, expand=True)

        self.canvas_display = tk.Label(
            self.preview_area, bg=THEME["bg_card"],
            bd=2, relief="solid",
            highlightbackground=THEME["border"], highlightthickness=1
        )
        self.canvas_display.pack(expand=True)
        self.preview_area.bind("<Configure>", lambda e: self.on_margin_change())

        # 3. Barra Inferior de Navegación
        nav_bar = tk.Frame(self, bg=THEME["bg_main"], padx=20, pady=10)
        nav_bar.pack(fill=tk.X, side=tk.BOTTOM)

        self.btn_prev = ttk.Button(nav_bar, text="◀ Anterior", style="Secondary.TButton", command=self.on_prev)
        self.btn_prev.pack(side=tk.LEFT)

        self.nav_status = tk.Label(nav_bar, text="0 / 0", font=("Segoe UI", 10, "bold"), fg=THEME["text_muted"], bg=THEME["bg_main"])
        self.nav_status.pack(side=tk.LEFT, expand=True)

        self.btn_next = ttk.Button(nav_bar, text="Siguiente ▶", style="Secondary.TButton", command=self.on_next)
        self.btn_next.pack(side=tk.RIGHT)

    def render_preview(self, current_item, current_index, total_count):
        """Genera y escala el lienzo 1980x980 px según el espacio disponible en pantalla"""
        if current_item is None or total_count == 0:
            self.info_lbl.config(text="Vista Previa: Ninguna imagen seleccionada")
            self.nav_status.config(text="0 / 0")
            blank = Image.new("RGB", (600, 300), (30, 30, 46))
            tk_img = ImageTk.PhotoImage(blank)
            self.canvas_display.config(image=tk_img)
            self._current_tk_img = tk_img
            return

        self.info_lbl.config(text=f"Vista Previa: #{current_index + 1:02d} - {current_item.filename}  [1980x980 px]")
        self.nav_status.config(text=f"Imagen {current_index + 1} de {total_count}")

        # Renderizar lienzo completo de 1980x980 px
        canvas_full = ImageProcessor.render_canvas(current_item, margin_px=self.margin_var.get())

        # Escalar para el visor en pantalla completa
        avail_w = max(300, self.preview_area.winfo_width() - 40)
        avail_h = max(200, self.preview_area.winfo_height() - 40)

        scale = min(avail_w / CANVAS_WIDTH, avail_h / CANVAS_HEIGHT)
        display_w = max(10, int(CANVAS_WIDTH * scale))
        display_h = max(10, int(CANVAS_HEIGHT * scale))

        preview_resized = canvas_full.resize((display_w, display_h), Image.Resampling.BILINEAR)
        tk_img = ImageTk.PhotoImage(preview_resized)
        self.canvas_display.config(image=tk_img)
        self._current_tk_img = tk_img
