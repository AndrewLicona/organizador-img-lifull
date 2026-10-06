@echo off
title Servidor Local - Organizador de Imagenes
cd /d "%~dp0"

echo ====================================================
echo  Iniciando Servidor Web Local (Puerto 8080)...
echo  Esto permite guardar en cualquier carpeta sin bloqueos
echo ====================================================
echo.

start "" "http://localhost:8080"
python -m http.server 8080

pause
