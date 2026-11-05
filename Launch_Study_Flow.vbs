' Study Flow Organizer - Silent Windows Launcher
' Launches the standalone desktop app with zero command prompt windows.
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run Chr(34) & currentDir & "\Study_Flow_Organizer.exe" & Chr(34), 0, False
Set WshShell = Nothing
Set fso = Nothing
