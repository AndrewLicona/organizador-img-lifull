# 🖼️ Organizador de Imágenes (Lienzo 1980x980 px)

Software modular, escalable y mantenible para organizar imágenes con lienzo de **1980 x 980 px**, fondo blanco, límite de **1.5 MB por foto** y exportación dual (Carpeta y ZIP).

---

## 🏛️ Arquitectura Modular del Proyecto (`ui/` y `core/`)

Para facilitar el mantenimiento a futuro, la interfaz y la lógica de negocio han sido divididas en módulos independientes:

```
OrganizadorImagenes/
├── app.py                      # Punto de entrada Python
├── index.html                  # Punto de entrada Web
├── requirements.txt            # Dependencias Python (Pillow >= 10.0.0)
│
├── assets/                     # Recursos de la versión Web
│   ├── app.js                  # Entry point de la Web
│   ├── styles.css              # Estilos
│   └── modules/                # Módulos ESM
│
├── core/                       # Núcleo de lógica y procesamiento (Python)
│   ├── image_processor.py
│   ├── archive_handler.py
│   └── exporter.py
│
├── ui/                         # Componentes de la Interfaz Gráfica (Tkinter)
│   ├── styles.py
│   ├── header_bar.py
│   ├── sidebar.py
│   ├── canvas_view.py
│   ├── progress_dialog.py
│   └── main_window.py
│
└── scripts/                    # ★ Lanzadores, iconos y helpers
    ├── README.md               # Documentación de esta carpeta
    ├── iniciar.bat             # Lanza versión Python
    ├── iniciar_web.bat         # Lanza versión Web (servidor + navegador)
    ├── actualizar.bat          # git pull + relanza
    ├── Crear_Acceso_Directo.bat # Crea iconos en el Escritorio
    ├── crear_icono.vbs         # Helper para los iconos
    ├── ico.ico                 # Icono Web
    ├── python_ico.ico          # Icono Python
    └── python_icon.svg
```

---

## 🖥️ Características de la Interfaz:
1. **Apertura en Pantalla Completa / Maximizado**: 
   - La aplicación se abre automáticamente ocupando toda la pantalla para trabajar con la máxima comodidad visual.
   - Presiona **`F11`** en cualquier momento para alternar el modo pantalla completa.
2. **Límite de peso garantizado ($\le$ 1.5 MB)**: 
   - Cada imagen exportada mantiene máxima nitidez y se comprime automáticamente para no superar 1.5 MB.
3. **Mantenibilidad Total**: 
   - Si en el futuro deseas cambiar los colores, solo editas `ui/styles.py`.
   - Si deseas cambiar la barra superior, editas `ui/header_bar.py`.
   - Si deseas cambiar la lista lateral, editas `ui/sidebar.py`.
   - Si deseas cambiar el visor del canvas, editas `ui/canvas_view.py`.
#
