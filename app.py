"""
Organizador de Imágenes - Punto de entrada principal
Canvas: 1980 x 980 px | Fondo Blanco | Drag & Drop | Exportación Dual (Carpeta y ZIP)
"""
import sys
import subprocess

# Asegurar que Pillow esté disponible
try:
    import PIL
except ImportError:
    print("[*] Instalando dependencia Pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])

from ui.main_window import MainWindow

if __name__ == "__main__":
    app = MainWindow()
    app.mainloop()
