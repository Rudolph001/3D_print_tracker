# Troubleshooting Guide for 3D Print Shop Management App

## Common Issues and Solutions

### 1. "package.json not found" Error

**Problem:** The startup script can't find the project files.

**Solution:**
1. Make sure you've downloaded ALL the project files to the same folder
2. The following files must be in the same directory:
   - `package.json`
   - `start-3d-print-shop.bat`
   - `install-3d-print-shop.ps1`
   - `server/` folder
   - `client/` folder
   - All other project files

3. If files are missing, download the complete project again from the source

### 2. "Node.js is not installed" Error

**Problem:** Node.js is not installed or not in the system PATH.

**Solution:**
1. Run the installer first: `install-3d-print-shop.ps1`
2. If that fails, manually download Node.js from https://nodejs.org
3. Install Node.js with default settings
4. Restart your computer
5. Try running the app again

### 3. Port 5000 Already in Use

**Problem:** Another application is using port 5000.

**Solution:**
1. Close any other applications that might be using port 5000
2. The startup script will automatically try to stop conflicting processes
3. If the problem persists, restart your computer

### 4. Browser Shows "This site can't be reached"

**Problem:** The server didn't start properly or took too long to build.

**Solution:**
1. Wait 30-60 seconds for the build process to complete
2. Refresh your browser
3. Check the command window for error messages
4. If you see "App has been stopped", the server crashed - check for error messages

### 5. Build Errors During Startup

**Problem:** The application fails to build due to missing dependencies.

**Solution:**
1. Make sure you ran the installer first
2. Check your internet connection
3. Try running: `npm install` in the app directory
4. If errors persist, delete the `node_modules` folder and run the installer again

### 6. Application Loads but Features Don't Work

**Problem:** JavaScript errors or missing files.

**Solution:**
1. Check the browser's developer console (F12) for error messages
2. Make sure all project files were downloaded correctly
3. Try rebuilding: delete the `dist` folder and run the startup script again

## Installation Requirements

- **Operating System:** Windows 10 or newer
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** At least 500MB free space
- **Internet Connection:** Required for initial setup and Node.js download

## Getting Help

If you continue to have issues:
1. Check that all files are in the correct location
2. Ensure you have administrator privileges when running the installer
3. Try running the installer again
4. Make sure your antivirus isn't blocking the installation

## Manual Installation Steps

If the automatic installer doesn't work:

1. Install Node.js manually from https://nodejs.org (LTS version)
2. Open Command Prompt in the app directory
3. Run: `npm install`
4. Run: `npm run build`
5. Run: `npm start`
6. Open http://localhost:5000 in your browser