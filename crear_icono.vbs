Set WshShell = CreateObject("WScript.Shell")
Set FSO      = CreateObject("Scripting.FileSystemObject")

strDesktop    = WshShell.SpecialFolders("Desktop")
strCurrentDir = FSO.GetParentFolderName(WScript.ScriptFullName)

' ── 1. Acceso directo a la APP PYTHON (iniciar.bat con python_ico.ico) ───────────
strAppLnk = strDesktop & "\Organizador de Imagenes.lnk"
Set oApp  = WshShell.CreateShortcut(strAppLnk)
oApp.TargetPath       = strCurrentDir & "\iniciar.bat"
oApp.WorkingDirectory = strCurrentDir
oApp.WindowStyle      = 7
oApp.Description      = "Organizador de Imagenes - App Python (Lienzo 1980x980 px)"
If FSO.FileExists(strCurrentDir & "\python_ico.ico") Then
    oApp.IconLocation = strCurrentDir & "\python_ico.ico,0"
Else
    oApp.IconLocation = "shell32.dll,301"
End If
oApp.Save

' ── 2. Acceso directo al SERVIDOR WEB LOCAL (iniciar_web.bat con ico.ico) ────────
strWebLnk = strDesktop & "\Organizador de Imagenes (Web).lnk"
Set oWeb  = WshShell.CreateShortcut(strWebLnk)
oWeb.TargetPath       = strCurrentDir & "\iniciar_web.bat"
oWeb.WorkingDirectory = strCurrentDir
oWeb.WindowStyle      = 7
oWeb.Description      = "Organizador de Imagenes - Version Web (Servidor Local 8080)"
If FSO.FileExists(strCurrentDir & "\ico.ico") Then
    oWeb.IconLocation = strCurrentDir & "\ico.ico,0"
Else
    oWeb.IconLocation = "shell32.dll,14"
End If
oWeb.Save

WScript.Echo "Accesos directos creados en el Escritorio con sus iconos personalizados:" & vbCrLf & _
             "  [PY] Organizador de Imagenes.lnk  -> App Python (python_ico.ico)" & vbCrLf & _
             "  [WEB] Organizador de Imagenes (Web).lnk -> Servidor Web Local (ico.ico)"
