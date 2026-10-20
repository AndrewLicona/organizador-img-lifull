@echo off
setlocal enabledelayedexpansion
title Organizador de Imagenes - Web

:: Cambiamos a la raiz del proyecto (un nivel arriba de scripts/)
cd /d "%~dp0\.."

:: ═══════════════════════════════════════════════════════════════
:: LANZADOR "TODO EN UNO" DE LA VERSION WEB
::
:: Que hace este archivo:
::   1) Detecta Python instalado en el sistema
::   2) Crea los accesos directos en el Escritorio si faltan
::   3) Verifica si ya hay un servidor en :8080
::   4) Si no, lo arranca en segundo plano con python.exe
::   5) Abre el navegador en http://localhost:8080
::   6) Mantiene la consola abierta para poder apagar el servidor
:: ═══════════════════════════════════════════════════════════════

echo.
echo  ========================================
echo   Organizador de Imagenes - Lanzador Web
echo  ========================================
echo.

:: ── 1) Detectar Python ──────────────────────────────────────
set "PYEXE="

:: 1a. Entorno virtual local (si existe)
if exist "%~dp0..\venv\Scripts\python.exe" (
    set "PYEXE=%~dp0..\venv\Scripts\python.exe"
    goto :python_found
)
if exist "%~dp0venv\Scripts\python.exe" (
    set "PYEXE=%~dp0venv\Scripts\python.exe"
    goto :python_found
)

:: 1b. Python 3.14+ (nueva ruta estandar del instalador oficial)
if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    set "PYEXE=%LOCALAPPDATA%\Python\bin\python.exe"
    goto :python_found
)
for /d %%D in ("%LOCALAPPDATA%\Python\pythoncore-*") do (
    if exist "%%D\python.exe" (
        set "PYEXE=%%D\python.exe"
        goto :python_found
    )
)

:: 1c. Launcher 'py' (Windows Python Launcher)
where py >nul 2>&1
if !errorlevel! equ 0 (
    py -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYEXE=py"
        goto :python_found
    )
)

:: 1d. 'python' en PATH (validando que funcione y no sea el alias vacio de WindowsApps)
where python >nul 2>&1
if !errorlevel! equ 0 (
    python -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYEXE=python"
        goto :python_found
    )
)

:: 1e. 'python3' en PATH
where python3 >nul 2>&1
if !errorlevel! equ 0 (
    python3 -c "import sys" >nul 2>&1
    if !errorlevel! equ 0 (
        set "PYEXE=python3"
        goto :python_found
    )
)

:: 1f. Rutas conocidas de instalacion de Python
for %%V in (314 313 312 311 310 39 38) do (
    for %%B in (
        "%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe"
        "%ProgramFiles%\Python%%V\python.exe"
        "%ProgramFiles(x86)%\Python%%V\python.exe"
        "C:\Python%%V\python.exe"
    ) do (
        if exist %%B (
            set "PYEXE=%%~B"
            goto :python_found
        )
    )
)

:: 1g. Busqueda generica en Program Files y LocalAppData
for /d %%D in ("%ProgramFiles%\Python*") do (
    if exist "%%D\python.exe" (
        set "PYEXE=%%D\python.exe"
        goto :python_found
    )
)
for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python*") do (
    if exist "%%D\python.exe" (
        set "PYEXE=%%D\python.exe"
        goto :python_found
    )
)

:: Si no se encontro Python
goto :python_not_found

:python_not_found
echo.
echo  ===================================================
echo   [ERROR] Python no fue encontrado en este PC.
echo  ===================================================
echo.
echo  Descargalo desde https://www.python.org/downloads/
echo  (Asegurate de marcar la casilla "Add Python to PATH")
echo.
pause
start "" "https://www.python.org/downloads/"
exit /b 1

:python_found
echo  [python] Python detectado: !PYEXE!

:: ── 2) Crear icono de escritorio si no existe ───────────────
set "DESKTOP=%USERPROFILE%\Desktop"
if not exist "%DESKTOP%\Organizador de Imagenes (Web).lnk" (
    if exist "%~dp0Crear_Acceso_Directo.bat" (
        echo  [setup] Creando accesos directos en el Escritorio...
        call "%~dp0Crear_Acceso_Directo.bat" --silent
    )
)

:: ── 3) Verificar si el servidor ya esta corriendo ───────────
set "RUNNING=0"
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":8080" ^| findstr "LISTENING"') do (
    set "RUNNING=1"
    set "PID_EXISTING=%%P"
)

:: ── 4) Arrancar el servidor si hace falta ───────────────────
if "!RUNNING!"=="0" (
    echo  [server] Iniciando servidor local en puerto 8080...
    :: Usar python.exe con /B para mantener stderr valido (pythonw falla en http.server)
    start /B "" "!PYEXE!" -m http.server 8080
    ping 127.0.0.1 -n 3 >nul
    echo  [server] Servidor activo.
) else (
    echo  [server] Servidor ya activo en puerto 8080 [PID: !PID_EXISTING!]
)

:: ── 5) Abrir el navegador ────────────────────────────────────
echo  [browser] Abriendo http://localhost:8080 ...
start "" "http://localhost:8080"

:: ── 6) Mensaje final ─────────────────────────────────────────
echo.
echo  ========================================================
echo   La app esta abierta en tu navegador:
echo   http://localhost:8080
echo.
echo   Para APAGAR el servidor, cierra esta ventana.
echo  ========================================================
echo.

pause
