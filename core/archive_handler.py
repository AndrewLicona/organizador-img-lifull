import os
import shutil
import tempfile
import zipfile
from .image_processor import SUPPORTED_EXTENSIONS, ImageItem


class ImageItemWithFolder(ImageItem):
    """ImageItem extendido con información de carpeta relativa."""
    def __init__(self, file_path, original_filename=None, relative_folder=''):
        super().__init__(file_path, original_filename)
        self.relative_folder = relative_folder  # ej. "subfolder/sub2"


class ArchiveHandler:
    """Gestiona la descompresión y lectura de archivos preservando la estructura de carpetas."""

    def __init__(self):
        self.temp_dir = tempfile.mkdtemp(prefix="canvas_organizer_")

    def extract_archive(self, archive_path):
        """
        Extrae un archivo comprimido y devuelve una lista de ImageItemWithFolder.
        Preserva la estructura de subcarpetas del ZIP para agruparlas en la UI.
        Las imágenes se ordenan: primero por carpeta, luego por nombre de archivo.
        """
        extract_folder = os.path.join(self.temp_dir, "extracted")
        if os.path.exists(extract_folder):
            shutil.rmtree(extract_folder, ignore_errors=True)
        os.makedirs(extract_folder, exist_ok=True)

        if zipfile.is_zipfile(archive_path):
            with zipfile.ZipFile(archive_path, 'r') as zf:
                zf.extractall(extract_folder)
        else:
            shutil.unpack_archive(archive_path, extract_folder)

        found_items = []
        for root, _, files in os.walk(extract_folder):
            for f in sorted(files):
                ext = os.path.splitext(f)[1].lower()
                if ext not in SUPPORTED_EXTENSIONS:
                    continue
                full_p = os.path.join(root, f)
                # Calcular la carpeta relativa respecto a extract_folder
                rel_dir = os.path.relpath(root, extract_folder)
                rel_dir = '' if rel_dir == '.' else rel_dir.replace('\\', '/')
                item = ImageItemWithFolder(full_p, original_filename=f, relative_folder=rel_dir)
                found_items.append(item)

        # Ordenar por carpeta relativa y luego por nombre
        found_items.sort(key=lambda it: (it.relative_folder, it.filename))
        return found_items

    def cleanup(self):
        """Elimina los archivos temporales."""
        try:
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir, ignore_errors=True)
        except Exception:
            pass
