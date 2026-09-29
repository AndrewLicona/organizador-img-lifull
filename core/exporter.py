import os
import zipfile
import tempfile
from .image_processor import ImageProcessor, MAX_FILE_SIZE_MB


class Exporter:
    """Exportador con soporte dual: Carpeta física descomprimida o Archivo ZIP"""

    @staticmethod
    def export_to_directory(images_list, target_folder_path, margin_px=50, max_size_mb=MAX_FILE_SIZE_MB, progress_callback=None):
        """
        Exporta todas las imágenes directamente a una carpeta en disco sin comprimir.
        Cada imagen se nombra con su número de posición (01.png, 02.png, ...).
        Garantiza que cada imagen pese <= max_size_mb (1.5 MB).
        """
        os.makedirs(target_folder_path, exist_ok=True)
        total = len(images_list)

        for idx, item in enumerate(images_list):
            pos_num = idx + 1
            filename = f"{pos_num:02d}.png"
            file_path = os.path.join(target_folder_path, filename)

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
        Garantiza que cada imagen interna pese <= max_size_mb (1.5 MB).
        """
        total = len(images_list)
        
        with zipfile.ZipFile(zip_file_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            with tempfile.TemporaryDirectory() as tmpdir:
                for idx, item in enumerate(images_list):
                    pos_num = idx + 1
                    filename = f"{pos_num:02d}.png"
                    tmp_filepath = os.path.join(tmpdir, filename)

                    canvas = ImageProcessor.render_canvas(item, margin_px=margin_px)
                    ImageProcessor.save_optimized(canvas, tmp_filepath, max_size_mb=max_size_mb)

                    arcname = f"{folder_inside_name}/{filename}" if folder_inside_name else filename
                    zf.write(tmp_filepath, arcname=arcname)

                    if progress_callback:
                        progress_callback(idx + 1, total)

        return zip_file_path
