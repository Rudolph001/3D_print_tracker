@echo off
echo ==========================================
echo 3D Print Shop Installation Check
echo ==========================================
echo.

:: Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ Node.js is installed: 
    node --version
) else (
    echo ✗ Node.js is NOT installed
    echo Please run install-3d-print-shop.bat first
    goto :error
)

:: Check npm
echo.
echo [2/5] Checking npm...
npm --version >nul 2>&1
if %errorLevel% equ 0 (
    echo ✓ npm is available: 
    npm --version
) else (
    echo ✗ npm is NOT available
    goto :error
)

:: Check package.json
echo.
echo [3/5] Checking project files...
if exist package.json (
    echo ✓ package.json found
) else (
    echo ✗ package.json NOT found
    echo Make sure you're in the correct directory
    goto :error
)

:: Check node_modules
echo.
echo [4/5] Checking dependencies...
if exist node_modules (
    echo ✓ Dependencies installed
) else (
    echo ✗ Dependencies NOT installed
    echo Run: npm install
    goto :error
)

:: Check port 5000
echo.
echo [5/5] Checking port 5000...
netstat -ano | findstr :5000 >nul 2>&1
if %errorLevel% equ 0 (
    echo ⚠ Port 5000 is in use by another process
    echo You may need to stop other applications using this port
) else (
    echo ✓ Port 5000 is available
)

echo.
echo ==========================================
echo ✓ Installation check completed successfully!
echo ==========================================
echo.
echo You can start the app by running: start-3d-print-shop.bat
goto :end

:error
echo.
echo ==========================================
echo ✗ Installation check failed!
echo ==========================================
echo.
echo Please fix the issues above and try again.

:end
pause