# 3D Print Shop Management App - PowerShell Installer
# This script automatically installs all dependencies and creates desktop shortcuts

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  3D Print Shop Management App" -ForegroundColor Cyan
Write-Host "  PowerShell Installation Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This installer needs administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as administrator and try again." -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Set installation directory
$InstallDir = $PSScriptRoot
$AppName = "3D Print Shop Manager"

Write-Host "Installing to: $InstallDir" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "[1/6] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "Node.js is already installed: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "Node.js not found. Installing Node.js..." -ForegroundColor Yellow
    
    # Download Node.js installer
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    
    Write-Host "Downloading Node.js installer..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
        
        Write-Host "Installing Node.js (this may take a few minutes)..." -ForegroundColor Yellow
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait
        
        # Add Node.js to PATH for current session
        $env:PATH += ";$env:ProgramFiles\nodejs"
        
        # Clean up installer
        Remove-Item $nodeInstaller -ErrorAction SilentlyContinue
        
        Write-Host "Node.js installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download or install Node.js." -ForegroundColor Red
        Write-Host "Please install Node.js manually from https://nodejs.org" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Verify Node.js installation
Write-Host "[2/6] Verifying Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    $npmVersion = npm --version 2>$null
    if ($nodeVersion -and $npmVersion) {
        Write-Host "Node.js $nodeVersion and npm $npmVersion are ready!" -ForegroundColor Green
    } else {
        throw "Node.js or npm not working"
    }
} catch {
    Write-Host "Node.js installation failed or not in PATH." -ForegroundColor Red
    Write-Host "Please restart your computer and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Install project dependencies
Write-Host "[3/6] Installing project dependencies..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Yellow

Set-Location $InstallDir
try {
    npm install --silent
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to install dependencies." -ForegroundColor Red
    Write-Host "Please check your internet connection and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Create environment file
Write-Host "[4/6] Setting up environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
NODE_ENV=production
PORT=5000
DATABASE_URL=sqlite:./data.db
"@ | Out-File -FilePath ".env" -Encoding UTF8
}

# Create startup script
Write-Host "[5/6] Creating startup script..." -ForegroundColor Yellow
$startupScript = @"
@echo off
title 3D Print Shop Management App
cd /d "$InstallDir"
echo Starting 3D Print Shop Management App...
echo.
echo Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to build the application.
    echo Please check your installation and try again.
    pause
    exit /b 1
)
echo.
echo App will be available at: http://localhost:5000
echo.
echo Opening your web browser...
echo.
echo IMPORTANT: Keep this window open while using the app.
echo           Close this window to stop the server.
echo.
timeout /t 3 >nul
start "" "http://localhost:5000"
npm start
echo.
echo App has been stopped.
pause
"@

$startupScript | Out-File -FilePath "start-3d-print-shop.bat" -Encoding UTF8

# Create desktop shortcut
Write-Host "[6/6] Creating desktop shortcut..." -ForegroundColor Yellow
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "$AppName.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $InstallDir "start-3d-print-shop.bat"
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.Description = "3D Print Shop Management Application"
$Shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,43"
$Shortcut.Save()

# Create Start Menu shortcut
Write-Host "Creating Start Menu shortcut..." -ForegroundColor Yellow
$StartMenu = [Environment]::GetFolderPath("StartMenu")
$StartMenuPath = Join-Path $StartMenu "Programs\$AppName.lnk"

$StartMenuShortcut = $WshShell.CreateShortcut($StartMenuPath)
$StartMenuShortcut.TargetPath = Join-Path $InstallDir "start-3d-print-shop.bat"
$StartMenuShortcut.WorkingDirectory = $InstallDir
$StartMenuShortcut.Description = "3D Print Shop Management Application"
$StartMenuShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,43"
$StartMenuShortcut.Save()

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The 3D Print Shop Management App has been installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run the app in these ways:" -ForegroundColor White
Write-Host "  1. Double-click the '$AppName' shortcut on your desktop" -ForegroundColor White
Write-Host "  2. Find '$AppName' in your Start Menu" -ForegroundColor White
Write-Host "  3. Run 'start-3d-print-shop.bat' from this folder" -ForegroundColor White
Write-Host ""
Write-Host "The app will open automatically in your web browser at:" -ForegroundColor White
Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Keep the command window open while using the app." -ForegroundColor Yellow
Write-Host "      Close it to stop the server." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to start the app now..." -ForegroundColor Green
Read-Host

# Start the app
Write-Host "Starting 3D Print Shop Management App..." -ForegroundColor Green
Start-Process -FilePath (Join-Path $InstallDir "start-3d-print-shop.bat")