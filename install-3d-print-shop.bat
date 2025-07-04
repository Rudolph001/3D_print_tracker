@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo 3D Print Shop Management App Installer
echo ==========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click on install-3d-print-shop.bat and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js not found. Installing Node.js...
    echo Downloading Node.js installer...

    :: Download Node.js installer
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'nodejs_installer.msi'}"

    if exist nodejs_installer.msi (
        echo Installing Node.js...
        msiexec /i nodejs_installer.msi /quiet /norestart

        :: Wait for installation
        timeout /t 30 /nobreak >nul

        :: Clean up
        del nodejs_installer.msi

        echo Node.js installation completed.
        echo Please restart your command prompt and run this installer again.
        pause
        exit /b 0
    ) else (
        echo ERROR: Failed to download Node.js installer
        echo Please manually install Node.js from https://nodejs.org
        pause
        exit /b 1
    )
) else (
    echo Node.js found: 
    node --version
)

echo.
echo [2/6] Checking for existing processes on port 5000...
netstat -ano | findstr :5000 >nul 2>&1
if %errorLevel% equ 0 (
    echo Warning: Port 5000 is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 3 /nobreak >nul
)

echo.
echo [3/6] Installing application dependencies...
if not exist package.json (
    echo ERROR: package.json not found. Make sure you're in the correct directory.
    pause
    exit /b 1
)

call npm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Trying with --force flag...
    call npm install --force
    if %errorLevel% neq 0 (
        echo ERROR: Still failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo [4/6] Setting up environment...
if not exist .env (
    echo Creating .env file...
    echo NODE_ENV=development > .env
    echo BASE_URL=http://localhost:5000 >> .env
)

echo.
echo [5/6] Creating shortcuts...
call create-shortcut.bat >nul 2>&1

echo.
echo [6/6] Starting the application...
echo.
echo ==========================================
echo Installation completed successfully!
echo ==========================================
echo.
echo The app will start automatically.
echo Keep this window open while using the app.
echo Close this window to stop the app.
echo.

:: Start the application
call npm run dev

pause