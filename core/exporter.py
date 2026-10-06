import os
import zipfile
import tempfile
from collections import defaultdict
from .image_processor import ImageProcessor, MAX_FILE_SIZE_MB


class Exporter:
    """Exportador con soporte dual: Carpeta física descomprimida o Archivo ZIP.
    Preserva subcarpetas de origen si existen en los ImageItems.
    """

    @staticmethod
    def export_to_directory(images_list, target_folder_path, margin_px=50, max_size_mb=MAX_FILE_SIZE_MB, progress_callback=None):
        """
        Exporta todas las imágenes directamente a una carpeta en disco sin comprimir.
        Si las imágenes provienen de subcarpetas, preserva la estructura de carpetas.
        Numeración (01.png, 02.png, ...) por cada carpeta.
        Garantiza que cada imagen pese <= max_size_mb (1.5 MB).
        """
        os.makedirs(target_folder_path, exist_ok=True)
        total = len(images_list)

        # Contador de secuencia por subcarpeta
        folder_counters = defaultdict(int)

        for idx, item in enumerate(images_list):
            rel_folder = getattr(item, 'relative_folder', '') or ''
            dest_dir = os.path.join(target_folder_path, rel_folder) if rel_folder else target_folder_path
            os.makedirs(dest_dir, exist_ok=True)

            folder_counters[rel_folder] += 1
            pos_num = folder_counters[rel_folder]
            filename = f"{pos_num:02d}.png"
            file_path = os.path.join(dest_dir, filename)

            # Generar lienzo individual de 1980x980 px
            canvas = ImageProcessor.render_canvas(item, margin_px=margin_px)
            ImageProcessor.save_optimized(canvas, file_path, max_size_mb=max_size_mb)

            if progress_callback:
                progress_callback(idx + 1, total)

        return target_folder_path

    @staticmethod
    def export_to_zip(images_list, zip_file_path, folder_inside_name="Imagenes_Organizadas", margin_px=50, max_size_mb=MAX_FILE_SIZE_MB, progress_callback=None):
        """
        Exporta todas las imágenes dentro de un archivo comprimido .ZIP.
        Preserva subcarpetas relativas dentro del ZIP.
        Garantiza que cada imagen interna pese <= max_size_mb (1.5 MB).
        """
        total = len(images_list)
        folder_counters = defaultdict(int)

        with zipfile.ZipFile(zip_file_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            with tempfile.TemporaryDirectory() as tmpdir:
                for idx, item in enumerate(images_list):
                    rel_folder = getattr(item, 'relative_folder', '') or ''
                    folder_counters[rel_folder] += 1
                    pos_num = folder_counters[rel_folder]
                    filename = f"{pos_num:02d}.png"

                    tmp_filepath = os.path.join(tmpdir, f"tmp_{idx:04d}.png")
                    canvas = ImageProcessor.render_canvas(item, margin_px=margin_px)
                    ImageProcessor.save_optimized(canvas, tmp_filepath, max_size_mb=max_size_mb)

                    # Construir ruta dentro del zip
                    parts = []
                    if folder_inside_name:
                        parts.append(folder_inside_name)
                    if rel_folder:
                        parts.append(rel_folder)
                    parts.append(filename)
                    arcname = "/".join(p.replace('\\', '/') for p in parts)

                    zf.write(tmp_filepath, arcname=arcname)
                    try:
                        os.remove(tmp_filepath)
                    except OSError:
                        pass

                    if progress_callback:
                        progress_callback(idx + 1, total)

        return zip_file_path
