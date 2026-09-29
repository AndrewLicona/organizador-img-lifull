import tkinter as tk
from tkinter import ttk

# Paleta de colores moderna y armónica (Tokyo Night / Catppuccin Mocha)
THEME = {
    "bg_main": "#0f0f17",        # Fondo ultra oscuro y limpio
    "bg_sidebar": "#161622",     # Panel lateral
    "bg_card": "#1e1e2e",        # Tarjeta de imagen
    "bg_card_hover": "#25273a",  # Tarjeta al pasar el ratón
    "bg_card_active": "#2b2e4a", # Tarjeta activa seleccionada
    "bg_header": "#11111b",      # Barra superior
    "accent": "#89b4fa",         # Azul pastel / Cian
    "accent_hover": "#b4befe",   # Azul claro interactivo
    "success": "#a6e3a1",        # Verde menta
    "warning": "#fab387",        # Naranja suave
    "danger": "#f38ba8",         # Rosa rojizo
    "text": "#cdd6f4",           # Texto principal nítido
    "text_muted": "#9399b2",     # Texto secundario
    "border": "#282a3e",         # Bordes sutiles
    "border_active": "#89b4fa",  # Borde activo iluminado
    "drop_line": "#fab387",      # Línea guía de inserción al arrastrar
}


def apply_theme_styles(root):
    """Configura los estilos globales de ttk para toda la aplicación con diseño moderno"""
    style = ttk.Style(root)
    style.theme_use("clam")

    # Configuración Base
    style.configure(".", background=THEME["bg_main"], foreground=THEME["text"], font=("Segoe UI", 10))
    style.configure("TFrame", background=THEME["bg_main"])
    style.configure("Sidebar.TFrame", background=THEME["bg_sidebar"])
    style.configure("Header.TFrame", background=THEME["bg_header"])
    style.configure("CanvasView.TFrame", background=THEME["bg_main"])

    # Tipografía y Etiquetas
    style.configure("TLabel", background=THEME["bg_main"], foreground=THEME["text"])
    style.configure("HeaderTitle.TLabel", font=("Segoe UI", 13, "bold"), foreground=THEME["accent"], background=THEME["bg_header"])
    style.configure("HeaderSub.TLabel", font=("Segoe UI", 9), foreground=THEME["text_muted"], background=THEME["bg_header"])

    # Botones con diseño plano y bordes suaves
    style.configure("Accent.TButton", font=("Segoe UI", 9, "bold"), background=THEME["accent"], foreground="#0c0c14", padding=(12, 7))
    style.map("Accent.TButton", background=[("active", THEME["accent_hover"]), ("pressed", "#74c7ec")])

    style.configure("Folder.TButton", font=("Segoe UI", 9, "bold"), background=THEME["success"], foreground="#0c0c14", padding=(12, 7))
    style.map("Folder.TButton", background=[("active", "#94e2d5"), ("pressed", THEME["success"])])

    style.configure("Zip.TButton", font=("Segoe UI", 9, "bold"), background=THEME["warning"], foreground="#0c0c14", padding=(12, 7))
    style.map("Zip.TButton", background=[("active", "#f9e2af"), ("pressed", THEME["warning"])])

    style.configure("Secondary.TButton", font=("Segoe UI", 9), background=THEME["border"], foreground=THEME["text"], padding=(10, 6))
    style.map("Secondary.TButton", background=[("active", "#3b3e5b")])

    style.configure("Danger.TButton", font=("Segoe UI", 8, "bold"), background=THEME["danger"], foreground="#0c0c14", padding=(8, 4))
    style.map("Danger.TButton", background=[("active", "#eba0ac")])

    # Scrollbar estilizada
    style.configure("Vertical.TScrollbar", background=THEME["bg_sidebar"], troughcolor=THEME["bg_main"], bordercolor=THEME["border"], arrowcolor=THEME["text_muted"])
    
    # Spinbox estilizado
    style.configure("TSpinbox", background=THEME["bg_card"], foreground=THEME["text"], fieldbackground=THEME["bg_card"], arrowcolor=THEME["accent"], bordercolor=THEME["border"])

    return style
