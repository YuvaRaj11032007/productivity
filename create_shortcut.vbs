' Create a desktop shortcut for the Preparation Tracker app
Option Explicit

Dim WshShell, fso, appPath, shortcut, batPath

' Create objects
Set WshShell = WScript.CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the current script directory
appPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Use the simple launch_app.bat file
batPath = appPath & "\launch_app.bat"

' Create the shortcut
Set shortcut = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\Preparation Tracker.lnk")
shortcut.TargetPath = batPath
shortcut.IconLocation = appPath & "\public\favicon.ico,0"
shortcut.WindowStyle = 1  ' Normal window
shortcut.Description = "Launch Preparation Tracker App"
shortcut.WorkingDirectory = appPath
shortcut.Save

WScript.Echo "Shortcut created successfully on your desktop!"

' Clean up
Set shortcut = Nothing
Set fso = Nothing
Set WshShell = Nothing