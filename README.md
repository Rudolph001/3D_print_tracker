# 3D Print Shop Management System

A comprehensive web application for managing a 3D print shop with order tracking, customer management, and 3D file visualization.

## 🚀 Quick Start (Windows Users)

### Easy Installation (Recommended)
1. **Download/copy** all files to a folder on your computer
2. **Right-click** on `install-3d-print-shop.bat` and select **"Run as administrator"**
3. The installer will automatically:
   - Install Node.js if needed
   - Install all dependencies
   - Create desktop shortcut
   - Start the app

### Alternative Installation Methods
- **PowerShell**: Run `install-3d-print-shop.ps1` in PowerShell (as administrator)
- **Manual**: Install [Node.js](https://nodejs.org) then run `start-3d-print-shop.bat`

### Using the App
- App opens automatically at `http://localhost:5000`
- Keep the command window open while using the app
- Close the window to stop the server

📖 **See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed installation instructions and troubleshooting**

## Developer Setup

1. **Install Node.js** (version 18+) from [nodejs.org](https://nodejs.org/)

2. **Clone/Download** this project to your local machine

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the application**:
   
   **Windows:**
   ```cmd
   start.bat
   ```
   
   **Mac/Linux:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

5. **Open your browser** and go to: `http://localhost:5000`

## Features

✅ **Order Management** - Track orders with multiple 3D prints and filament selection  
✅ **Customer Database** - Store customer info and WhatsApp numbers  
✅ **3D File Viewer** - Preview STL files in the browser  
✅ **Print Status Tracking** - Monitor print progress and completion  
✅ **Dashboard Analytics** - View shop statistics and metrics  
✅ **Filament Management** - Track material inventory, usage, and low stock alerts  
✅ **WhatsApp Integration** - Send order updates and reports to customers  
✅ **Professional Reports** - Generate detailed order reports and catalogs  

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **3D Visualization**: Three.js for STL file rendering
- **Database**: SQLite (no setup required)

## File Structure

```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared types and schemas
├── uploads/         # STL files and attachments
└── package.json     # Project dependencies
```

## Need Help?

See [LOCAL_SETUP.md](LOCAL_SETUP.md) for detailed setup instructions and troubleshooting.

## Production Deployment

For production builds:
```bash
npm run build
npm start
```

The application will create all necessary database tables automatically on first run.