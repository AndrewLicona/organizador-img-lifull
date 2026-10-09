@echo off
title Actualizar Organizador de Imagenes

:: Cambiamos a la raiz del proyecto
cd /d "%~dp0\.."

echo ====================================================
echo  Actualizador - Organizador de Imagenes
echo  1) Descarga los ultimos cambios de GitHub
echo  2) Abre el servidor web en localhost:8080
echo ====================================================
echo.

:: Detectar git
where git >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Git no esta instalado.
    echo  Descargalo desde https://git-scm.com/downloads
    pause
    exit /b 1
)

:: git pull
echo  [1/3] Descargando ultimos cambios de GitHub...
git pull origin main
if errorlevel 1 (
    echo.
    echo  Hubo un error en git pull. Revisa tu conexion o permisos.
    pause
    exit /b 1
)
echo.

:: Detectar Python
set "PYEXE="
where python  >nul 2>&1 && set "PYEXE=python"
if not defined PYEXE where py  >nul 2>&1 && set "PYEXE=py"
if not defined PYEXE where python3 >nul 2>&1 && set "PYEXE=python3"

if not defined PYEXE (
    echo  ERROR: Python no encontrado. Instala Python para usar la web.
    echo  O usa la version de escritorio (doble clic en el icono).
    pause
    exit /b 1
)

echo  [2/3] Iniciando servidor web con %PYEXE%...

:: Cerrar servidores anteriores en puerto 8080 (si los hay)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Iniciar servidor
start /min "" "%PYEXE%" -m http.server 8080
timeout /t 2 /nobreak >nul

echo  [3/3] Abriendo navegador en http://localhost:8080
start "" "http://localhost:8080/?v=%RANDOM%"

echo.
echo  ====================================================
echo   Listo! La app esta abierta en tu navegador.
echo.
echo   IMPORTANTE: Si no carga, presiona Ctrl+Shift+R
echo   (recarga forzada que ignora la cache).
echo  ====================================================
echo.
pause
