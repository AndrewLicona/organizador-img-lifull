@echo off
title Servidor Local - Organizador de Imagenes
cd /d "%~dp0"

echo ====================================================
echo  Iniciando Servidor Web Local (Puerto 8080)...
echo  Esto permite guardar en cualquier carpeta sin bloqueos
echo ====================================================
echo.

:: Detectar Python disponible (varios nombres)
set "PYEXE="
where python  >nul 2>&1 && set "PYEXE=python"
if not defined PYEXE where py  >nul 2>&1 && set "PYEXE=py"
if not defined PYEXE where python3 >nul 2>&1 && set "PYEXE=python3"

if not defined PYEXE (
    echo  ERROR: No se encontro Python en este PC.
    echo  Instala Python desde https://www.python.org/downloads/
    echo  o usa Node.js: npx http-server -p 8080 -c-1
    echo.
    pause
    exit /b 1
)

echo  Usando: %PYEXE%
echo.

start "" "http://localhost:8080"
%PYEXE% -m http.server 8080

pause
