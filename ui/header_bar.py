import tkinter as tk
from tkinter import ttk
from .styles import THEME


class HeaderBar(tk.Frame):
    """Componente de barra superior con branding y botones de acción principal"""

    def __init__(self, parent, on_load_files, on_export_folder, on_export_zip):
        super().__init__(parent, bg=THEME["bg_header"], height=65, padx=20, pady=10)
        self.pack(side=tk.TOP, fill=tk.X)

        self.on_load_files = on_load_files
        self.on_export_folder = on_export_folder
        self.on_export_zip = on_export_zip

        self.build_widgets()

    def build_widgets(self):
        # 1. Branding / Información
        brand_box = tk.Frame(self, bg=THEME["bg_header"])
        brand_box.pack(side=tk.LEFT)

        ttk.Label(brand_box, text="[ IMG ] Organizador de Imagenes · Lienzo 1980x980", style="HeaderTitle.TLabel").pack(anchor=tk.W)
        ttk.Label(brand_box, text="Cada imagen en su propio lienzo blanco centrado de 1980x980 px  |  Peso max. 1.5 MB", style="HeaderSub.TLabel").pack(anchor=tk.W)

        # 2. Botones de Acción
        actions_box = tk.Frame(self, bg=THEME["bg_header"])
        actions_box.pack(side=tk.RIGHT)

        ttk.Button(actions_box, text="[+] Cargar ZIP / Imagenes", style="Accent.TButton", command=self.on_load_files).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_box, text="[Dir] Exportar Carpeta", style="Folder.TButton", command=self.on_export_folder).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_box, text="[ZIP] Exportar ZIP", style="Zip.TButton", command=self.on_export_zip).pack(side=tk.LEFT, padx=5)
