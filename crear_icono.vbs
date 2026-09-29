Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

strDesktop = WshShell.SpecialFolders("Desktop")
strCurrentDir = FSO.GetParentFolderName(WScript.ScriptFullName)

strShortcutPath = strDesktop & "\Organizador de Imagenes.lnk"
Set oShortcut = WshShell.CreateShortcut(strShortcutPath)

strIniciarBat = strCurrentDir & "\iniciar.bat"

oShortcut.TargetPath = strIniciarBat
oShortcut.WorkingDirectory = strCurrentDir
oShortcut.WindowStyle = 7 ' Minimizada para que no estorbe la consola
oShortcut.Description = "Organizador de Imagenes (Lienzo 1980x980 px)"
oShortcut.IconLocation = "shell32.dll,301"
oShortcut.Save

WScript.Echo "Acceso directo actualizado en el Escritorio con exito."
