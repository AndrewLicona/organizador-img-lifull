@echo off
setlocal enabledelayedexpansion
title Organizador de Imagenes - Lienzo 1980x980
cd /d "%~dp0"

:: ═══════════════════════════════════════════════════════
:: 1. Entorno virtual local (si se creó en este PC)
:: ═══════════════════════════════════════════════════════
if exist "venv\Scripts\pythonw.exe" (
    start "" "venv\Scripts\pythonw.exe" "app.py"
    exit /b 0
)
if exist "venv\Scripts\python.exe" (
    start "" "venv\Scripts\python.exe" "app.py"
    exit /b 0
)

:: ═══════════════════════════════════════════════════════
:: 2. Buscar Python instalado en el sistema
::    Orden: PATH → launcher 'py' → rutas conocidas (varios usuarios/versiones)
:: ═══════════════════════════════════════════════════════
set "PYEXE="

:: 2a. Probar 'python' en PATH
where python >nul 2>&1
if !errorlevel! equ 0 (
    set "PYEXE=python"
    goto :found
)

:: 2b. Probar launcher 'py' (Windows Python Launcher)
where py >nul 2>&1
if !errorlevel! equ 0 (
    set "PYEXE=py"
    goto :found
)

:: 2c. Buscar en rutas típicas de instalación usuario y sistema
for %%V in (313 312 311 310 39 38) do (
    for %%B in (
        "%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe"
        "%ProgramFiles%\Python%%V\python.exe"
        "%ProgramFiles(x86)%\Python%%V\python.exe"
        "C:\Python%%V\python.exe"
    ) do (
        if exist %%B (
            set "PYEXE=%%~B"
            goto :found
        )
    )
)

:: 2d. Python instalado desde Microsoft Store (WindowsApps)
for /d %%D in ("%LOCALAPPDATA%\Microsoft\WindowsApps") do (
    if exist "%%D\python.exe" (
        set "PYEXE=%%D\python.exe"
        goto :found
    )
    if exist "%%D\python3.exe" (
        set "PYEXE=%%D\python3.exe"
        goto :found
    )
)

:: 2e. Busqueda generica en Program Files
for /d %%D in ("%ProgramFiles%\Python*") do (
    if exist "%%D\python.exe" (
        set "PYEXE=%%D\python.exe"
        goto :found
    )
)
for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python*") do (
    if exist "%%D\python.exe" (
        set "PYEXE=%%D\python.exe"
        goto :found
    )
)

:: ═══════════════════════════════════════════════════════
:: 3. No se encontro Python → abrir version web
:: ═══════════════════════════════════════════════════════
echo.
echo  Python no fue encontrado en este PC.
echo  Abriendo la version Web en tu navegador...
echo.
:: Usar cmd /c start para abrir el HTML con el programa asociado
cmd /c start "" "%~dp0index.html"
exit /b 0

:: ═══════════════════════════════════════════════════════
:: 4. Python encontrado → instalar dependencias y ejecutar
:: ═══════════════════════════════════════════════════════
:found
echo.
echo  Python encontrado: !PYEXE!
echo  Instalando dependencias (Pillow)...
"!PYEXE!" -m pip install --quiet -r requirements.txt 2>nul

echo  Iniciando Organizador de Imagenes...
:: Usar pythonw si existe (sin ventana de consola negra)
set "PYEXE_W=!PYEXE!"
if /i "!PYEXE:~-10!" == "python.exe" (
    set "PYEXE_W=!PYEXE:python.exe=pythonw.exe!"
    if not exist "!PYEXE_W!" set "PYEXE_W=!PYEXE!"
)

start "" "!PYEXE_W!" "%~dp0app.py"
exit /b 0
