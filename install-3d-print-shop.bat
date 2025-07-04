@echo off
setlocal EnableDelayedExpansion

:: 3D Print Shop Management App - Automated Installer
:: This script automatically installs all dependencies and creates desktop shortcuts

echo =========================================
echo   3D Print Shop Management App
echo   Automated Installation Script
echo =========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This installer needs administrator privileges to install Node.js.
    echo Please run as administrator or install Node.js manually.
    echo.
    pause
    exit /b 1
)

:: Set installation directory
set "INSTALL_DIR=%~dp0"
set "APP_NAME=3D Print Shop Manager"

echo Installing to: %INSTALL_DIR%
echo.

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js not found. Installing Node.js...
    
    :: Download Node.js installer
    echo Downloading Node.js installer...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'}"
    
    if exist "%TEMP%\node-installer.msi" (
        echo Installing Node.js (this may take a few minutes)...
        msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
        
        :: Add Node.js to PATH for current session
        set "PATH=%PATH%;%ProgramFiles%\nodejs"
        
        :: Clean up installer
        del "%TEMP%\node-installer.msi"
        
        echo Node.js installed successfully!
    ) else (
        echo Failed to download Node.js installer.
        echo Please install Node.js manually from https://nodejs.org
        pause
        exit /b 1
    )
) else (
    echo Node.js is already installed.
)

:: Verify Node.js installation
echo [2/6] Verifying Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js installation failed or not in PATH.
    echo Please restart your computer and try again.
    pause
    exit /b 1
)

:: Check if npm is available
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo npm is not available. Please reinstall Node.js.
    pause
    exit /b 1
)

echo Node.js and npm are ready!
echo.

:: Install project dependencies
echo [3/6] Installing project dependencies...
echo This may take several minutes...
npm install --silent

if %errorLevel% neq 0 (
    echo Failed to install dependencies.
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo Dependencies installed successfully!
echo.

:: Create environment file
echo [4/6] Setting up environment configuration...
if not exist ".env" (
    echo Creating .env file...
    echo NODE_ENV=production> .env
    echo PORT=5000>> .env
    echo DATABASE_URL=sqlite:./data.db>> .env
)

:: Create startup script
echo [5/6] Creating startup script...
(
echo @echo off
echo cd /d "%INSTALL_DIR%"
echo echo Starting 3D Print Shop Management App...
echo echo.
echo echo App will be available at: http://localhost:5000
echo echo.
echo echo Press Ctrl+C to stop the server
echo echo.
echo start "" "http://localhost:5000"
echo npm run dev
echo pause
) > "start-3d-print-shop.bat"

:: Create desktop shortcut
echo [6/6] Creating desktop shortcut...
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP%\%APP_NAME%.lnk"

:: Create VBS script to create shortcut
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo Set oShellLink = WshShell.CreateShortcut^("%SHORTCUT_PATH%"^)
echo oShellLink.TargetPath = "%INSTALL_DIR%start-3d-print-shop.bat"
echo oShellLink.WorkingDirectory = "%INSTALL_DIR%"
echo oShellLink.Description = "3D Print Shop Management Application"
echo oShellLink.IconLocation = "%SystemRoot%\System32\shell32.dll,43"
echo oShellLink.Save
) > "%TEMP%\create_shortcut.vbs"

cscript //nologo "%TEMP%\create_shortcut.vbs"
del "%TEMP%\create_shortcut.vbs"

:: Create Start Menu shortcut
echo Creating Start Menu shortcut...
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
set "STARTMENU_SHORTCUT=%STARTMENU%\%APP_NAME%.lnk"

(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo Set oShellLink = WshShell.CreateShortcut^("%STARTMENU_SHORTCUT%"^)
echo oShellLink.TargetPath = "%INSTALL_DIR%start-3d-print-shop.bat"
echo oShellLink.WorkingDirectory = "%INSTALL_DIR%"
echo oShellLink.Description = "3D Print Shop Management Application"
echo oShellLink.IconLocation = "%SystemRoot%\System32\shell32.dll,43"
echo oShellLink.Save
) > "%TEMP%\create_startmenu_shortcut.vbs"

cscript //nologo "%TEMP%\create_startmenu_shortcut.vbs"
del "%TEMP%\create_startmenu_shortcut.vbs"

echo.
echo =========================================
echo   Installation Complete!
echo =========================================
echo.
echo The 3D Print Shop Management App has been installed successfully!
echo.
echo You can now run the app in these ways:
echo   1. Double-click the "%APP_NAME%" shortcut on your desktop
echo   2. Find "%APP_NAME%" in your Start Menu
echo   3. Run "start-3d-print-shop.bat" from this folder
echo.
echo The app will open automatically in your web browser at:
echo http://localhost:5000
echo.
echo Note: Keep the command window open while using the app.
echo       Close it to stop the server.
echo.
echo Press any key to start the app now...
pause >nul

:: Start the app
echo Starting 3D Print Shop Management App...
call "start-3d-print-shop.bat"