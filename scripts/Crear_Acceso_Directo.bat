@echo off
setlocal
title Crear Accesos Directos en el Escritorio
cd /d "%~dp0"

if "%~1"=="--silent" goto :run_create

echo ========================================================
echo    Creando Accesos Directos en tu Escritorio...
echo ========================================================
echo.

:run_create
set "TEMP_VBS=%TEMP%\temp_crear_icono_%RANDOM%.vbs"
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo Set FSO = CreateObject^("Scripting.FileSystemObject"^)
echo strDesktop = WshShell.SpecialFolders^("Desktop"^)
echo strScriptsDir = "%~dp0"
echo If Right^(strScriptsDir, 1^) = "\" Then strScriptsDir = Left^(strScriptsDir, Len^(strScriptsDir^) - 1^)
echo strProjectDir = FSO.GetParentFolderName^(strScriptsDir^)
echo Set oApp = WshShell.CreateShortcut^(strDesktop ^& "\Organizador de Imagenes.lnk"^)
echo oApp.TargetPath = strScriptsDir ^& "\iniciar.bat"
echo oApp.WorkingDirectory = strProjectDir
echo oApp.WindowStyle = 7
echo oApp.Description = "Organizador de Imagenes - App Python"
echo If FSO.FileExists^(strScriptsDir ^& "\python_ico.ico"^) Then oApp.IconLocation = strScriptsDir ^& "\python_ico.ico,0" Else oApp.IconLocation = "shell32.dll,301"
echo oApp.Save
echo Set oWord = WshShell.CreateShortcut^(strDesktop ^& "\Organizador de Imagenes (Web).lnk"^)
echo oWord.TargetPath = strScriptsDir ^& "\iniciar_web.bat"
echo oWord.WorkingDirectory = strProjectDir
echo oWord.WindowStyle = 7
echo oWord.Description = "Organizador de Imagenes - Version Web"
echo If FSO.FileExists^(strScriptsDir ^& "\ico.ico"^) Then oWord.IconLocation = strScriptsDir ^& "\ico.ico,0" Else oWord.IconLocation = "shell32.dll,14"
echo oWord.Save
) > "%TEMP_VBS%"

cscript //nologo "%TEMP_VBS%"
del "%TEMP_VBS%" >nul 2>&1

if "%~1"=="--silent" exit /b 0

echo  Accesos directos creados correctamente en el Escritorio:
echo    [PY]  Organizador de Imagenes.lnk       -^> App de Escritorio
echo    [WEB] Organizador de Imagenes (Web).lnk -^> Servidor Web Local
echo.
pause
