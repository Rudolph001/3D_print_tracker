
@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo Starting 3D Print Shop Management App
echo ==========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please run install-3d-print-shop.bat first
    pause
    exit /b 1
)

:: Check if we're in the right directory
if not exist package.json (
    echo ERROR: package.json not found
    echo Make sure you're running this from the app directory
    pause
    exit /b 1
)

:: Check for existing processes on port 5000
echo Checking port 5000...
netstat -ano | findstr :5000 >nul 2>&1
if %errorLevel% equ 0 (
    echo Warning: Port 5000 is already in use
    echo Attempting to stop existing processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
        echo Stopping process %%a...
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 3 /nobreak >nul
)

:: Set environment variables
set NODE_ENV=development
set BASE_URL=http://localhost:5000

echo.
echo Starting application...
echo The app will open in your browser at http://localhost:5000
echo Keep this window open while using the app
echo Press Ctrl+C to stop the app
echo.

:: Start the application
npm run dev

echo.
echo Application stopped.
pause
