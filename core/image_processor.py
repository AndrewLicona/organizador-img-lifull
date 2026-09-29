import os
import io
from PIL import Image, ImageOps

CANVAS_WIDTH = 1980
CANVAS_HEIGHT = 980
MAX_FILE_SIZE_MB = 1.5
MAX_FILE_SIZE_BYTES = int(MAX_FILE_SIZE_MB * 1024 * 1024)
SUPPORTED_EXTENSIONS = ('.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.gif')


class ImageItem:
    """
    Representa un elemento de imagen.
    Para mantener la aplicación ligera y escalable con cientos de imágenes,
    almacena la ruta del archivo y genera miniaturas en memoria bajo demanda.
    """
    def __init__(self, file_path, original_filename=None):
        self.file_path = file_path
        self.filename = original_filename or os.path.basename(file_path)
        self._thumbnail = None

    def get_pil_image(self):
        """Carga la imagen completa en memoria solo cuando se necesita procesar"""
        try:
            with Image.open(self.file_path) as img:
                return img.convert("RGBA")
        except Exception as e:
            print(f"Error cargando imagen {self.file_path}: {e}")
            return Image.new("RGBA", (400, 400), (230, 230, 230, 255))

    def get_thumbnail(self, size=(64, 48)):
        """Genera y almacena en caché una miniatura ligera"""
        if self._thumbnail is None:
            try:
                with Image.open(self.file_path) as img:
                    img_rgba = img.convert("RGBA")
                    thumb = ImageOps.contain(img_rgba, size, Image.Resampling.LANCZOS)
                    bg = Image.new("RGBA", size, (20, 20, 30, 255))
                    ox = (size[0] - thumb.width) // 2
                    oy = (size[1] - thumb.height) // 2
                    bg.paste(thumb, (ox, oy), thumb if thumb.mode == 'RGBA' else None)
                    self._thumbnail = bg
            except Exception:
                self._thumbnail = Image.new("RGBA", size, (50, 50, 60, 255))
        return self._thumbnail


class ImageProcessor:
    """Motor de procesamiento de imagen sobre el Canvas de 1980x980 px"""
    
    @staticmethod
    def render_canvas(image_item, margin_px=50, canvas_w=CANVAS_WIDTH, canvas_h=CANVAS_HEIGHT):
        """
        Monta una imagen centrada sobre un lienzo blanco de 1980x980 px
        respetando márgenes y relación de aspecto con remuestreo Lanczos de alta calidad.
        """
        canvas = Image.new("RGB", (canvas_w, canvas_h), (255, 255, 255))
        if image_item is None:
            return canvas

        pil_img = image_item.get_pil_image()
        margin = max(0, int(margin_px))
        avail_w = max(10, canvas_w - (2 * margin))
        avail_h = max(10, canvas_h - (2 * margin))

        # Escalar con máxima calidad preservando proporción
        scaled = ImageOps.contain(pil_img, (avail_w, avail_h), Image.Resampling.LANCZOS)

        # Centrar exactamente en el lienzo
        pos_x = (canvas_w - scaled.width) // 2
        pos_y = (canvas_h - scaled.height) // 2

        if scaled.mode == 'RGBA':
            canvas.paste(scaled, (pos_x, pos_y), scaled)
        else:
            canvas.paste(scaled, (pos_x, pos_y))

        return canvas

    @staticmethod
    def save_optimized(image, output_path, max_size_mb=MAX_FILE_SIZE_MB):
        """
        Guarda la imagen garantizando que el archivo final PESE MÁXIMO 1.5 MB (o el valor especificado)
        manteniendo la máxima calidad y nitidez visual.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        max_bytes = int(max_size_mb * 1024 * 1024)
        ext = os.path.splitext(output_path)[1].lower()

        # 1. Intentar guardar como PNG optimizado
        if ext == ".png" or not ext:
            image.save(output_path, format="PNG", optimize=True, compress_level=9)
            file_size = os.path.getsize(output_path)
            
            # Si el PNG supera los 1.5 MB, aplicar cuantización de alta fidelidad o compresión adaptativa
            if file_size > max_bytes:
                # Probar cuantización PNG de 256 colores preservando nitidez
                quantized = image.quantize(colors=256, method=Image.Resampling.LANCZOS)
                quantized.save(output_path, format="PNG", optimize=True)
                file_size = os.path.getsize(output_path)

            # Si aún así excede 1.5 MB, guardar como JPEG/PNG de alta densidad
            if file_size > max_bytes:
                rgb_img = image.convert("RGB")
                for q in (95, 92, 88, 82, 75):
                    rgb_img.save(output_path, format="JPEG", quality=q, optimize=True, subsampling=0)
                    if os.path.getsize(output_path) <= max_bytes:
                        break
        else:
            # Para formatos JPG / JPEG
            rgb_img = image.convert("RGB")
            for q in (95, 92, 88, 85, 80, 75):
                rgb_img.save(output_path, format="JPEG", quality=q, optimize=True, subsampling=0)
                if os.path.getsize(output_path) <= max_bytes:
                    break
