# 📁 Carpeta `scripts/`

Esta carpeta contiene todos los **lanzadores y recursos** del proyecto. Mantenerlos aislados del código fuente facilita el mantenimiento y deja clara la separación entre "código" y "utilidades de despliegue".

---

## 🚀 Lanzadores `.bat` (doble clic para usar)

| Archivo | ¿Para qué sirve? | ¿Cuándo usarlo? |
|---|---|---|
| **`iniciar.bat`** | Lanza la versión **Python** (escritorio) | Cuando quieras la app nativa con Tkinter |
| **`iniciar_web.bat`** | Lanza la versión **Web** (servidor local + navegador) | Cuando quieras usar la app desde el navegador |
| **`actualizar.bat`** | Hace `git pull` + reinicia el servidor web | Cuando hay cambios nuevos en GitHub |
| **`Crear_Acceso_Directo.bat`** | Crea los iconos del Escritorio manualmente | Solo si necesitas regenerar los `.lnk` |

### Flujo recomendado

```
1. (Una sola vez)  Doble clic en Crear_Acceso_Directo.bat
   → Crea 2 iconos en el Escritorio

2. (Cada día)       Doble clic en el icono del Escritorio que prefieras
   → "Organizador de Imagenes"          (Python)
   → "Organizador de Imagenes (Web)"    (Web)
```

Si prefieres no usar iconos de Escritorio, también puedes correr los `.bat` directamente desde esta carpeta.

---

## 🪟 Helper `.vbs`

| Archivo | ¿Para qué sirve? |
|---|---|
| **`crear_icono.vbs`** | Script auxiliar llamado por `Crear_Acceso_Directo.bat` (y por `iniciar_web.bat` la primera vez) que crea los accesos directos del Escritorio usando la API de Windows Shell. No ejecutar directamente. |

---

## 🎨 Iconos `.ico` / `.svg`

| Archivo | ¿Para qué sirve? |
|---|---|
| **`python_ico.ico`** | Icono de la app Python (Tkinter) - se ve en la barra de título y en el acceso directo del Escritorio |
| **`ico.ico`** | Icono de la versión Web (favicon del navegador + acceso directo del Escritorio) |
| **`python_icon.svg`** | Versión vectorial del icono Python (para uso en web/docs) |

---

## 🔧 Notas técnicas

- Todos los `.bat` hacen `cd /d %~dp0\..` al inicio para posicionarse en la raíz del proyecto, así el resto de rutas relativas funcionan sin importar desde dónde se invoquen.
- `iniciar_web.bat` detecta automáticamente si ya hay un servidor corriendo en :8080 para evitar duplicados.
- `iniciar_web.bat` usa `pythonw.exe` (cuando existe) para arrancar el servidor sin ventana negra de consola.
