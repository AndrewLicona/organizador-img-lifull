import os
import shutil
import tempfile
import zipfile
from .image_processor import SUPPORTED_EXTENSIONS, ImageItem


class ArchiveHandler:
    """Gestiona la descompresión y lectura de archivos de imágenes de forma segura"""

    def __init__(self):
        self.temp_dir = tempfile.mkdtemp(prefix="canvas_organizer_")

    def extract_archive(self, archive_path):
        """
        Extrae un archivo comprimido y devuelve una lista de ImageItem encontrados.
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
                if ext in SUPPORTED_EXTENSIONS:
                    full_p = os.path.join(root, f)
                    found_items.append(ImageItem(full_p, original_filename=f))

        return found_items

    def cleanup(self):
        """Elimina los archivos temporales"""
        try:
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir, ignore_errors=True)
        except Exception:
            pass
