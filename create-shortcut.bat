@echo off
echo Creating desktop shortcut...

set CURRENT_DIR=%~dp0
set SHORTCUT_NAME=3D Print Shop
set DESKTOP=%USERPROFILE%\Desktop

echo Set WshShell = WScript.CreateObject("WScript.Shell") > temp_shortcut.vbs
echo Set Shortcut = WshShell.CreateShortcut("%DESKTOP%\%SHORTCUT_NAME%.lnk") >> temp_shortcut.vbs
echo Shortcut.TargetPath = "%CURRENT_DIR%run-3d-print-shop.bat" >> temp_shortcut.vbs
echo Shortcut.WorkingDirectory = "%CURRENT_DIR%" >> temp_shortcut.vbs
echo Shortcut.Description = "3D Print Shop Management System" >> temp_shortcut.vbs
echo Shortcut.Save >> temp_shortcut.vbs

cscript temp_shortcut.vbs
del temp_shortcut.vbs

echo Desktop shortcut created successfully!
echo You can now double-click "3D Print Shop" on your desktop to start the app.
pause