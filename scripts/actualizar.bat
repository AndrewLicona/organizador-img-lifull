@echo off
setlocal enabledelayedexpansion
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

if exist "%~dp0venv\Scripts\python.exe" (
    set "PYEXE=%~dp0venv\Scripts\python.exe"
    goto :py_found
)
if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    set "PYEXE=%LOCALAPPDATA%\Python\bin\python.exe"
    goto :py_found
)
for /d %%D in ("%LOCALAPPDATA%\Python\pythoncore-*") do (
    if exist "%%D\python.exe" (
        set "PYEXE=%%D\python.exe"
        goto :py_found
    )
)
where py >nul 2>&1
if !errorlevel! equ 0 (
    py -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYEXE=py"
        goto :py_found
    )
)
where python >nul 2>&1
if !errorlevel! equ 0 (
    python -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYEXE=python"
        goto :py_found
    )
)
for %%V in (314 313 312 311 310 39 38) do (
    for %%B in (
        "%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe"
        "%ProgramFiles%\Python%%V\python.exe"
        "%ProgramFiles(x86)%\Python%%V\python.exe"
        "C:\Python%%V\python.exe"
    ) do (
        if exist %%B (
            set "PYEXE=%%~B"
            goto :py_found
        )
    )
)

:py_not_found
echo  ERROR: Python no encontrado. Instala Python para usar la web.
echo  O usa la version de escritorio (doble clic en el icono).
pause
exit /b 1

:py_found
echo  [2/3] Iniciando servidor web con !PYEXE!...

:: Cerrar servidores anteriores en puerto 8080 (si los hay)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Iniciar servidor
start /min "" "!PYEXE!" -m http.server 8080
ping 127.0.0.1 -n 3 >nul

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
