@echo off
cd /d "%~dp0"
title 3D Print Shop Management System
echo.
echo ====================================
echo    3D Print Shop Management System
echo ====================================
echo.
echo Starting the application...
echo.

set NODE_ENV=development

REM Start the server
start "3D Print Shop Server" /MIN cmd /k ".\node_modules\.bin\tsx server/index.ts"

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo Opening browser at http://localhost:5000
start http://localhost:5000

echo.
echo The app is now running!
echo Browser should open automatically.
echo Server is running in a separate window.
echo.
echo You can close this window now.
timeout /t 3 /nobreak >nul
exit