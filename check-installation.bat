@echo off
title 3D Print Shop - Installation Check

echo =========================================
echo   3D Print Shop Installation Check
echo =========================================
echo.

echo Checking system requirements...
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js is NOT installed
    echo    Please install Node.js from https://nodejs.org
    echo.
    set "NODE_OK=false"
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js is installed: !NODE_VERSION!
    set "NODE_OK=true"
)

:: Check npm
echo [2/5] Checking npm...
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ npm is NOT available
    echo    npm should come with Node.js
    echo.
    set "NPM_OK=false"
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm is available: !NPM_VERSION!
    set "NPM_OK=true"
)

:: Check project files
echo [3/5] Checking project files...
if exist "package.json" (
    echo ✅ package.json found
    set "PKG_OK=true"
) else (
    echo ❌ package.json NOT found
    echo    Make sure you're in the correct directory
    set "PKG_OK=false"
)

if exist "server" (
    echo ✅ server folder found
) else (
    echo ❌ server folder NOT found
)

if exist "client" (
    echo ✅ client folder found
) else (
    echo ❌ client folder NOT found
)

:: Check dependencies
echo [4/5] Checking dependencies...
if exist "node_modules" (
    echo ✅ node_modules folder exists
    set "DEPS_OK=true"
) else (
    echo ❌ node_modules folder NOT found
    echo    Run 'npm install' or use the installer
    set "DEPS_OK=false"
)

:: Check port availability
echo [5/5] Checking port 5000...
netstat -an | findstr :5000 >nul 2>&1
if %errorLevel% equ 0 (
    echo ⚠️  Port 5000 is already in use
    echo    Another application might be using this port
    echo    Try closing other applications or restart your computer
    set "PORT_OK=false"
) else (
    echo ✅ Port 5000 is available
    set "PORT_OK=true"
)

echo.
echo =========================================
echo   Installation Summary
echo =========================================
echo.

if "%NODE_OK%"=="true" if "%NPM_OK%"=="true" if "%PKG_OK%"=="true" if "%DEPS_OK%"=="true" if "%PORT_OK%"=="true" (
    echo ✅ All checks passed! Your installation looks good.
    echo.
    echo You can now start the app with:
    echo   - Double-click "start-3d-print-shop.bat"
    echo   - Or use the desktop shortcut if you installed it
    echo.
) else (
    echo ❌ Some issues were found. Please fix them and try again.
    echo.
    echo Common solutions:
    echo   - Install Node.js from https://nodejs.org
    echo   - Run "install-3d-print-shop.bat" as administrator
    echo   - Make sure you're in the correct project folder
    echo   - Restart your computer if port 5000 is busy
    echo.
)

pause