@echo off
title 3D Print Shop Management App

echo =========================================
echo   3D Print Shop Management App
echo =========================================
echo.

:: Change to the directory where the script is located
cd /d "%~dp0"

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please run "install-3d-print-shop.bat" first to install dependencies.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorLevel% neq 0 (
        echo Failed to install dependencies.
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
)

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo NODE_ENV=production> .env
    echo PORT=5000>> .env
    echo DATABASE_URL=sqlite:./data.db>> .env
)

echo Starting 3D Print Shop Management App...
echo.
echo App will be available at: http://localhost:5000
echo.
echo Opening your web browser...
echo.
echo IMPORTANT: Keep this window open while using the app.
echo           Close this window to stop the server.
echo.

:: Wait 3 seconds then open browser
timeout /t 3 >nul
start "" "http://localhost:5000"

:: Start the application
npm run dev

echo.
echo App has been stopped.
pause