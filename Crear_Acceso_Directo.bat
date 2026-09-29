@echo off
title Crear Acceso Directo en el Escritorio
cd /d "%~dp0"

echo ========================================================
echo    Creando Acceso Directo en tu Escritorio...
echo ========================================================
echo.

cscript //nologo crear_icono.vbs

echo.
pause
