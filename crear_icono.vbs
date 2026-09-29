Set WshShell = CreateObject("WScript.Shell")
Set FSO      = CreateObject("Scripting.FileSystemObject")

strDesktop    = WshShell.SpecialFolders("Desktop")
strCurrentDir = FSO.GetParentFolderName(WScript.ScriptFullName)

' ── 1. Acceso directo a la APP PYTHON (iniciar.bat) ─────────────────────────
strAppLnk = strDesktop & "\Organizador de Imagenes.lnk"
Set oApp  = WshShell.CreateShortcut(strAppLnk)
oApp.TargetPath      = strCurrentDir & "\iniciar.bat"
oApp.WorkingDirectory = strCurrentDir
oApp.WindowStyle     = 7
oApp.Description     = "Organizador de Imagenes - App Python (Lienzo 1980x980 px)"
oApp.IconLocation    = "shell32.dll,301"
oApp.Save

' ── 2. Acceso directo al HTML (version web en navegador) ─────────────────────
strWebLnk = strDesktop & "\Organizador de Imagenes (Web).lnk"
Set oWeb  = WshShell.CreateShortcut(strWebLnk)
oWeb.TargetPath      = strCurrentDir & "\index.html"
oWeb.WorkingDirectory = strCurrentDir
oWeb.WindowStyle     = 1
oWeb.Description     = "Organizador de Imagenes - Version Web (Chrome/Edge)"
' Icono de navegador (iexplore como fallback universal en Windows)
oWeb.IconLocation    = "shell32.dll,14"
oWeb.Save

WScript.Echo "Accesos directos creados en el Escritorio:" & vbCrLf & _
             "  -> Organizador de Imagenes.lnk  (App Python)" & vbCrLf & _
             "  -> Organizador de Imagenes (Web).lnk  (Version Web)"
