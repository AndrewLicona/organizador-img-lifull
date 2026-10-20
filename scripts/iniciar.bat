@echo off
setlocal enabledelayedexpansion
title Organizador de Imagenes - Lienzo 1980x980

:: Cambiamos a la raiz del proyecto (un nivel arriba de scripts/)
cd /d "%~dp0\.."

:: ═══════════════════════════════════════════════════════════════
:: 1. Entorno virtual local (si se creo en este PC)
:: ═══════════════════════════════════════════════════════════════
if exist "venv\Scripts\pythonw.exe" (
    start "" "venv\Scripts\pythonw.exe" "app.py"
    exit /b 0
)
if exist "venv\Scripts\python.exe" (
    start "" "venv\Scripts\python.exe" "app.py"
    exit /b 0
)

:: ═══════════════════════════════════════════════════════════════
:: 2. Buscar Python instalado en el sistema
:: ═══════════════════════════════════════════════════════════════
set "PYEXE="

:: 2a. Python 3.14+ (nueva ruta estandar del instalador oficial)
if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    set "PYEXE=%LOCALAPPDATA%\Python\bin\python.exe"
    goto :found
)
for /d %%D in ("%LOCALAPPDATA%\Python\pythoncore-*") do (
    if exist "%%D\python.exe" (
        set "PYEXE=%%D\python.exe"
        goto :found
    )
)

:: 2b. Launcher 'py' (Windows Python Launcher)
where py >nul 2>&1
if !errorlevel! equ 0 (
    py -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYEXE=py"
        goto :found
    )
)

:: 2c. Probar 'python' en PATH (validando que funcione y no sea el alias vacio de WindowsApps)
where python >nul 2>&1
if !errorlevel! equ 0 (
    python -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYEXE=python"
        goto :found
    )
)

:: 2d. Probar 'python3' en PATH
where python3 >nul 2>&1
if !errorlevel! equ 0 (
    python3 -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYEXE=python3"
        goto :found
    )
)

:: 2e. Buscar en rutas tipicas de instalacion usuario y sistema
for %%V in (314 313 312 311 310 39 38) do (
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

:: 2f. Busqueda generica en Program Files y LocalAppData
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

:: ═══════════════════════════════════════════════════════════════
:: 3. No se encontro Python
:: ═══════════════════════════════════════════════════════════════
echo.
echo  ===================================================
echo   Python no fue encontrado en este PC.
echo  ===================================================
echo.
echo  Instala Python desde https://www.python.org/downloads/
echo  (Asegurate de marcar "Add Python to PATH")
echo.
pause
exit /b 1

:: ═══════════════════════════════════════════════════════════════
:: 4. Python encontrado -> instalar dependencias y ejecutar
:: ═══════════════════════════════════════════════════════════════
:found
echo.
echo  Python encontrado: !PYEXE!
echo  Instalando dependencias (Pillow)...
"!PYEXE!" -m pip install --quiet -r requirements.txt 2>nul

echo  Iniciando Organizador de Imagenes...
set "PYEXE_W=!PYEXE!"
if /i "!PYEXE:~-10!" == "python.exe" (
    set "PYEXE_W=!PYEXE:python.exe=pythonw.exe!"
    if not exist "!PYEXE_W!" set "PYEXE_W=!PYEXE!"
) else if /i "!PYEXE!" == "python" (
    where pythonw >nul 2>&1 && set "PYEXE_W=pythonw"
)

:: Lanzar la app Python. El cwd ya es la raiz del proyecto.
start "" "!PYEXE_W!" "app.py"
exit /b 0
