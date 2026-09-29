import tkinter as tk
from tkinter import ttk
from .styles import THEME


class ProgressDialog(tk.Toplevel):
    """Ventana modal moderna con barra de progreso y retroalimentación en tiempo real"""

    def __init__(self, parent, title="Procesando imágenes...", subtitle="Por favor espera un momento"):
        super().__init__(parent)
        self.title(title)
        self.geometry("480x200")
        self.resizable(False, False)
        self.configure(bg=THEME["bg_header"])
        
        # Centrar sobre la ventana padre
        self.transient(parent)
        self.grab_set()

        self.update_idletasks()
        pw = parent.winfo_width()
        ph = parent.winfo_height()
        px = parent.winfo_rootx()
        py = parent.winfo_rooty()
        x = px + (pw - 480) // 2
        y = py + (ph - 200) // 2
        self.geometry(f"+{max(0, x)}+{max(0, y)}")

        # Widgets
        container = tk.Frame(self, bg=THEME["bg_header"], padx=25, pady=20)
        container.pack(fill=tk.BOTH, expand=True)

        self.title_lbl = tk.Label(container, text=title, font=("Segoe UI", 12, "bold"), fg=THEME["accent"], bg=THEME["bg_header"])
        self.title_lbl.pack(anchor=tk.W, pady=(0, 4))

        self.subtitle_lbl = tk.Label(container, text=subtitle, font=("Segoe UI", 9), fg=THEME["text_muted"], bg=THEME["bg_header"])
        self.subtitle_lbl.pack(anchor=tk.W, pady=(0, 15))

        self.progress_bar = ttk.Progressbar(container, orient="horizontal", length=430, mode="determinate")
        self.progress_bar.pack(fill=tk.X, pady=(0, 10))

        self.status_lbl = tk.Label(container, text="Iniciando...", font=("Segoe UI", 9, "italic"), fg=THEME["text"], bg=THEME["bg_header"])
        self.status_lbl.pack(anchor=tk.W)

        self.update()

    def update_progress(self, current, total, text=""):
        percentage = int((current / max(1, total)) * 100)
        self.progress_bar["value"] = percentage
        status_text = f"Procesando {current} de {total} ({percentage}%) - {text}"
        self.status_lbl.config(text=status_text)
        self.update()

    def close(self):
        try:
            self.grab_release()
            self.destroy()
        except Exception:
            pass


class ToastNotification(tk.Frame):
    """Banner flotante no bloqueante de retroalimentación en la esquina inferior"""

    def __init__(self, parent):
        super().__init__(parent, bg=THEME["bg_card_active"], highlightbackground=THEME["accent"], highlightthickness=1, padx=15, pady=10)
        self.icon_lbl = tk.Label(self, text="ℹ️", font=("Segoe UI", 12), bg=THEME["bg_card_active"], fg=THEME["accent"])
        self.icon_lbl.pack(side=tk.LEFT, padx=(0, 10))

        self.msg_lbl = tk.Label(self, text="", font=("Segoe UI", 9, "bold"), bg=THEME["bg_card_active"], fg=THEME["text"])
        self.msg_lbl.pack(side=tk.LEFT)

        self._hide_timer = None

    def show(self, message, icon="✅", duration_ms=3000, is_error=False):
        if self._hide_timer:
            self.after_cancel(self._hide_timer)

        border_color = THEME["danger"] if is_error else THEME["success"]
        self.configure(highlightbackground=border_color)
        self.icon_lbl.config(text=icon, fg=border_color)
        self.msg_lbl.config(text=message)

        # Posicionar en la esquina inferior derecha
        self.place(relx=0.98, rely=0.95, anchor="se")
        self.lift()

        self._hide_timer = self.after(duration_ms, self.hide)

    def hide(self):
        self.place_forget()
