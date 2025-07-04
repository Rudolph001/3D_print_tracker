@echo off
title 3D Print Shop Management System
echo.
echo ====================================
echo    3D Print Shop Management System
echo ====================================
echo.
echo Starting the application...
echo.

set NODE_ENV=development

REM Start the server in a new window
start "3D Print Shop Server" /MIN .\node_modules\.bin\tsx server/index.ts

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo Opening browser at http://localhost:5000
start http://localhost:5000

echo.
echo The app is now running!
echo Browser should open automatically.
echo Server is running in a minimized window.
echo.
echo Close this window when you're done using the app.
pause