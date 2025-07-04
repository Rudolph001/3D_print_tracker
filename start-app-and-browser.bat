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

REM Start the server in background
start /B .\node_modules\.bin\tsx server/index.ts

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo Opening browser at http://localhost:5000
start http://localhost:5000

echo.
echo The app is now running!
echo Browser should open automatically.
echo.
echo Press any key to stop the server...
pause >nul

REM Kill the server process
taskkill /f /im node.exe 2>nul
taskkill /f /im tsx.exe 2>nul

echo Server stopped.
pause