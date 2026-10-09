@echo off
title Organizador de Imagenes - Web
cd /d "%~dp0"

:: ═══════════════════════════════════════════════════════════════
:: LANZADOR "TODO EN UNO" DE LA VERSION WEB
::
:: Que hace este archivo:
::   1) Detecta Python instalado (varios nombres)
::   2) Si es la primera vez, crea los iconos en el Escritorio
::   3) Verifica si ya hay un servidor en :8080
::   4) Si no, lo arranca en segundo plano (sin ventana negra)
::   5) Abre el navegador en http://localhost:8080
::   6) Espera a que cierres esta ventana para apagar el servidor
:: ═══════════════════════════════════════════════════════════════

echo.
echo  Organizador de Imagenes - Lanzador Web
echo  ========================================
echo.

:: ── 1) Detectar Python ──────────────────────────────────────
set "PYEXE="
where python  >nul 2>&1 && set "PYEXE=python"
if not defined PYEXE where py  >nul 2>&1 && set "PYEXE=py"
if not defined PYEXE where python3 >nul 2>&1 && set "PYEXE=python3"

if not defined PYEXE (
    echo  [ERROR] Python no esta instalado.
    echo  Descargalo desde https://www.python.org/downloads/
    echo  (marcando "Add Python to PATH" al instalar)
    echo.
    pause
    start "" "https://www.python.org/downloads/"
    exit /b 1
)

:: ── 2) Crear iconos de escritorio si no existen ─────────────
set "DESKTOP=%USERPROFILE%\Desktop"
if not exist "%DESKTOP%\Organizador de Imagenes (Web).lnk" (
    if exist "crear_icono.vbs" (
        echo  [setup] Creando accesos directos en el Escritorio...
        cscript //nologo crear_icono.vbs >nul 2>&1
    )
)

:: ── 3) Verificar si el servidor ya esta corriendo ───────────
set "RUNNING=0"
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":8080" ^| findstr "LISTENING"') do (
    set "RUNNING=1"
    set "PID_EXISTING=%%P"
)

:: ── 4) Arrancar el servidor si hace falta ───────────────────
if "%RUNNING%"=="0" (
    echo  [server] Iniciando servidor local en puerto 8080...
    :: Intentar usar pythonw.exe (sin ventana negra). Si no existe, fallback a start /min
    set "PYEXE_W=%PYEXE%"
    if /i "%PYEXE%"=="python" (
        where pythonw >nul 2>&1 && set "PYEXE_W=pythonw"
    )
    :: Lanzar en background. /B = misma ventana, /MIN = minimizada
    start /B "" %PYEXE_W% -m http.server 8080
    :: Esperar 2 segundos a que arranque
    timeout /t 2 /nobreak >nul
    echo  [server] Servidor activo.
) else (
    echo  [server] Ya hay un servidor corriendo (PID !PID_EXISTING!).
)

:: ── 5) Abrir el navegador ────────────────────────────────────
echo  [browser] Abriendo http://localhost:8080 ...
start "" "http://localhost:8080"

:: ── 6) Mensaje final ─────────────────────────────────────────
echo.
echo  ========================================================
echo   La app esta abierta en tu navegador.
echo.
echo   Para APAGAR el servidor, cierra esta ventana
echo   o ejecuta:  taskkill /F /IM python.exe
echo  ========================================================
echo.

:: Mantener la ventana abierta. Si el usuario la cierra, el proceso
:: hijo de python tambien muere (gracias a /B y al job object).
pause
