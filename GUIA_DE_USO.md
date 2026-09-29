# 📖 Guía de Uso Oficial: Organizador de Imágenes

Bienvenido a la guía completa del **Organizador de Imágenes (Lienzo Individual 1980x980 px)**. Esta herramienta permite procesar lotes de fotos, ordenarlas mediante arrastrar y soltar (Drag & Drop), adaptarlas a un lienzo con fondo blanco de **1980 x 980 px** y exportarlas garantizando que cada foto pese **máximo 1.5 MB**.

---

## 🗂️ 1. Resumen de Archivos Ejecutables

En la carpeta del proyecto dispones de los siguientes ejecutables según tu necesidad:

| Archivo | ¿Para qué sirve? | ¿Cuándo usarlo? |
| :--- | :--- | :--- |
| **`Crear_Acceso_Directo.bat`** | Crea el icono **"Organizador de Imagenes"** en tu Escritorio de Windows. | Ejecútalo una vez para tener acceso rápido en el Escritorio. |
| **`iniciar.bat`** | Lanzador inteligente universal. | Úsalo para abrir la app (si tienes Python abre la versión de escritorio; si no, abre la versión Web). |
| **`instalar.bat`** | Crea el entorno virtual aislado (`venv`) e instala librerías. | Úsalo si tienes Python y quieres aislar las dependencias para tus compañeros. |
| **`index.html`** | Aplicación Web interactiva directa (funciona sin instalar nada). | Haz doble clic para abrirla en Google Chrome, Microsoft Edge o cualquier navegador. |
| **`app.py`** | Código principal de la aplicación de escritorio en Python. | Ejecutado automáticamente por `iniciar.bat`. |

---

## 🚀 2. Cómo empezar a usar el programa

### Opción A (Recomendada y Más Fácil): Usar el Icono del Escritorio
1. Entra en la carpeta del proyecto: `C:\Users\Andrew_Licona\Desktop\OrganizadorImagenes`.
2. Haz doble clic en **`Crear_Acceso_Directo.bat`**.
3. Verás que en tu Escritorio aparece el icono **`Organizador de Imagenes`**.
4. ¡Listo! A partir de ahora, tú y tus compañeros solo deben hacer doble clic en ese icono del Escritorio.

### Opción B: Uso Directo en el Navegador (Sin Instalar Nada)
1. Haz doble clic en el archivo **`index.html`**.
2. Se abrirá de inmediato en tu navegador favorito con pantalla completa y todas las herramientas listas.

---

## 🖼️ 3. Paso a Paso: Flujo de Trabajo

### Paso 1: Cargar Imágenes o Archivo Comprimido (ZIP)
- Haz clic en el botón superior azul: **`📂 Cargar ZIP / Imágenes`**.
- Selecciona un archivo `.zip` que contenga fotos o selecciona múltiples imágenes de tu ordenador (`PNG`, `JPG`, `WEBP`, etc.).
- El programa extraerá y listará todas las imágenes automáticamente en el panel lateral izquierdo.

### Paso 2: Organizar las Imágenes (Drag & Drop)
- En el panel izquierdo verás cada foto con su miniatura, nombre y su **número de posición** (`#01`, `#02`, `#03`...).
- **Para cambiar el orden**:
  - Arrastra cualquier tarjeta hacia arriba o abajo y suéltala en la posición deseada.
  - O usa los botones rápidos **`▲` Subir** y **`▼` Bajar** de cada tarjeta.
- **Para ver una imagen en grande**: Haz un clic sobre cualquier tarjeta de la lista.

### Paso 3: Ajustar Márgenes del Lienzo (1980 x 980 px)
- En el panel derecho verás la foto seleccionada montada y centrada sobre el lienzo blanco de **1980 x 980 px**.
- En la esquina superior derecha tienes el control: **`Márgenes Canvas (px)`** (por defecto en `50 px`).
  - Puedes subir o bajar este valor para darle más o menos aire alrededor de las imágenes.

### Paso 4: Exportar el Resultado (2 Opciones)

#### Opción 1: `📁 Exportar Carpeta Descomprimida`
1. Haz clic en el botón verde **`📁 Exportar Carpeta Descomprimida`**.
2. Escribe el nombre que deseas para la carpeta (ej. `Lote_Productos_Final`).
3. Selecciona la ubicación donde guardarla en tu disco (ej. tu Escritorio).
4. El programa creará la carpeta física con todos los lienzos procesados:
   - `01.png`
   - `02.png`
   - `03.png`
   - ...
5. **Garantía de tamaño**: Cada imagen pesará **máximo 1.5 MB**.
6. Al finalizar, la carpeta se abrirá automáticamente en tu Explorador de Windows.

#### Opción 2: `📦 Exportar como ZIP`
1. Haz clic en el botón naranja **`📦 Exportar como ZIP`**.
2. Elige el nombre y la ubicación del archivo `.zip`.
3. Guardará directamente el paquete comprimido listo para compartir por correo o subir a la nube.

---

## ⌨️ 4. Atajos y Consejos Útiles

- **`F11`**: Alternar modo pantalla completa total en cualquier momento.
- **`◀ Anterior` / `Siguiente ▶`**: Navegar rápidamente entre las fotos sin tocar el ratón.
- **`🗑️ Vaciar`**: Limpiar la lista para comenzar a trabajar con un nuevo lote.
- **Múltiples formatos**: El sistema acepta imágenes en formato `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp` y archivos comprimidos `.zip`, `.tar`, `.gz`.

---

## 👥 5. Compartir con el Equipo (Compañeros)

Si deseas compartir este proyecto con otros compañeros de trabajo:
1. Pásales la carpeta completa **`OrganizadorImagenes`**.
2. Indícales que solo deben hacer doble clic en **`Crear_Acceso_Directo.bat`**.
3. ¡Ya podrán usar el programa haciendo doble clic en el icono del Escritorio!
