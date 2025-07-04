# Complete Installation Guide for 3D Print Shop Management App

## Step 1: Download All Project Files

**IMPORTANT:** You need to download the ENTIRE project, not just individual files.

### If downloading from Replit:
1. Click the "Download as ZIP" button or export the entire project
2. Extract ALL files to a folder (e.g., `C:\3d-print-shop\`)
3. Make sure you have all these files and folders:
   ```
   3d-print-shop/
   ├── package.json
   ├── install-3d-print-shop.ps1
   ├── start-3d-print-shop.bat
   ├── server/
   ├── client/
   ├── shared/
   ├── vite.config.ts
   ├── tailwind.config.ts
   └── (many other files)
   ```

### If downloading from GitHub:
1. Click "Code" → "Download ZIP"
2. Extract to a folder
3. Verify all files are present

## Step 2: Run the Installer

1. **Right-click** on `install-3d-print-shop.ps1`
2. Select **"Run with PowerShell"**
3. If you get a security warning, click **"Open"** or **"Run anyway"**
4. **Choose "Yes"** when asked for administrator privileges
5. Wait for the installation to complete (may take 5-10 minutes)

### Alternative Installation Method:
1. Open **PowerShell as Administrator**:
   - Press `Windows Key + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
2. Navigate to your project folder:
   ```powershell
   cd "C:\path\to\your\3d-print-shop"
   ```
3. Run the installer:
   ```powershell
   .\install-3d-print-shop.ps1
   ```

## Step 3: Start the Application

After installation, you can start the app in three ways:

### Method 1: Desktop Shortcut
- Double-click the "3D Print Shop Manager" shortcut on your desktop

### Method 2: Start Menu
- Click Start Menu → Find "3D Print Shop Manager"

### Method 3: Manual Start
- Double-click `start-3d-print-shop.bat` in the project folder

## What Should Happen

1. A command window opens showing:
   ```
   Building the application...
   Starting application...
   ```
2. Your web browser automatically opens to `http://localhost:5000`
3. You see the 3D Print Shop dashboard

## Troubleshooting

### Error: "package.json not found"
**Cause:** Missing project files or wrong directory

**Solution:**
1. Make sure you downloaded ALL project files
2. Check that `package.json` exists in the same folder as the `.bat` file
3. Re-download the complete project if files are missing

### Error: "Node.js is not installed"
**Cause:** Node.js installation failed

**Solution:**
1. Download Node.js manually from https://nodejs.org
2. Install with default settings
3. Restart your computer
4. Try again

### Error: "This site can't be reached"
**Cause:** Server didn't start or is still building

**Solution:**
1. Wait 1-2 minutes for the build to complete
2. Refresh your browser
3. Check the command window for errors

### PowerShell Security Error
**Cause:** Windows security policy blocking script execution

**Solution:**
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Type "Y" and press Enter
4. Try running the installer again

## System Requirements

- **Windows 10 or newer**
- **4GB RAM minimum** (8GB recommended)
- **500MB free disk space**
- **Internet connection** (for initial setup)
- **Administrator privileges** (for installation only)

## Need Help?

If you're still having issues:

1. Check `TROUBLESHOOTING.md` for more solutions
2. Make sure you have all project files in one folder
3. Try the manual installation steps in the troubleshooting guide
4. Ensure your antivirus isn't blocking the installation

## Manual Installation (Advanced Users)

If the automated installer doesn't work:

```cmd
# 1. Install Node.js from https://nodejs.org
# 2. Open Command Prompt in the project directory
npm install
npm run build
npm start
# 3. Open http://localhost:5000 in your browser
```