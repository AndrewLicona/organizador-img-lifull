@echo off
setlocal enabledelayedexpansion
title Organizador de Imagenes - Lienzo 1980x980

cd /d "%~dp0"

:: 1. Si existe el entorno virtual con pythonw, abrir directamente sin consola
if exist "venv\Scripts\pythonw.exe" (
    start "" "venv\Scripts\pythonw.exe" "app.py"
    exit /b
)

if exist "venv\Scripts\python.exe" (
    start "" "venv\Scripts\python.exe" "app.py"
    exit /b
)

:: 2. Si no hay venv, buscar Python en el sistema para crearlo o ejecutarlo
set "SYS_PY="
where python >nul 2>nul
if %errorlevel% equ 0 set "SYS_PY=python"

if "%SYS_PY%"=="" (
    where py >nul 2>nul
    if %errorlevel% equ 0 set "SYS_PY=py"
)

if "%SYS_PY%"=="" (
    for %%P in (
        "%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
        "%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
        "%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
        "%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
        "%ProgramFiles%\Python313\python.exe"
        "%ProgramFiles%\Python312\python.exe"
        "%ProgramFiles%\Python311\python.exe"
        "%ProgramFiles%\Python310\python.exe"
        "C:\Python312\python.exe"
        "C:\Python311\python.exe"
    ) do (
        if exist "%%~P" (
            set "SYS_PY=%%~P"
        )
    )
)

:: 3. Si se encuentra Python en el sistema, instalar dependencias y abrir
if not "%SYS_PY%"=="" (
    echo [*] Iniciando Organizador de Imagenes...
    %SYS_PY% -m pip install -r requirements.txt >nul 2>&1
    start "" %SYS_PY% app.py
    exit /b
)

:: 4. Si NO hay Python en el PC, abrir directamente la aplicacion Web en el navegador
echo [*] Abriendo version interactiva en tu navegador...
start "" "index.html"
exit /b
