# 3D Print Shop Management App - Setup Guide

## Quick Start (For Windows Users)

### Option 1: Automatic Installation (Recommended)
1. Download or copy all files to a folder on your computer
2. Right-click on `install-3d-print-shop.bat` and select "Run as administrator"
3. The installer will automatically:
   - Install Node.js if needed
   - Install all app dependencies
   - Create desktop and Start Menu shortcuts
   - Start the app

### Option 2: Manual Installation
1. Install Node.js from [nodejs.org](https://nodejs.org) (version 18 or higher)
2. Download or copy all files to a folder on your computer
3. Double-click `start-3d-print-shop.bat` to start the app

## Using the App

Once started, the app will:
- Open automatically in your web browser at `http://localhost:5000`
- Show the 3D Print Shop Management dashboard
- Keep running as long as the command window is open

### Important Notes:
- **Keep the black command window open** while using the app
- **Close the command window** to stop the app
- The app stores all data in a local database file (`data.db`)
- Your STL files are stored in the `uploads` folder

## Features

### Dashboard
- View order statistics and progress
- Monitor filament stock levels
- Track active orders and prints

### Order Management
- Create new orders with multiple print jobs
- Select specific filament spools for each print
- Track order status and progress
- Send WhatsApp notifications to customers

### Product Catalog
- Add products with STL files
- Set print times and filament requirements
- View 3D previews of STL files
- Upload technical drawings

### Customer Management
- Store customer information
- Track WhatsApp numbers for notifications
- View order history per customer

### Filament Management
- Track filament stock by material, color, and brand
- Monitor remaining weight and length
- Get low stock alerts
- Assign specific filaments to print jobs

## Troubleshooting

### App won't start
- Make sure Node.js is installed (run `node --version` in command prompt)
- Try running `install-3d-print-shop.bat` as administrator
- Check that port 5000 is not being used by another application

### Can't access the app
- Make sure the command window is still open
- Try accessing `http://localhost:5000` directly in your browser
- Check Windows Firewall settings

### Database issues
- The app creates a `data.db` file automatically
- If you get database errors, try deleting `data.db` (you'll lose your data)
- The app will create a new database on next startup

## Data Backup

Your data is stored in these files:
- `data.db` - Main database with all orders, customers, products
- `uploads/` folder - STL files and drawings

**Backup these files regularly** to prevent data loss.

## Support

For technical issues:
1. Check the command window for error messages
2. Try restarting the app
3. Try reinstalling using the installer script
4. Check the troubleshooting section above

## System Requirements

- Windows 10 or higher
- At least 4GB RAM
- 500MB free disk space
- Internet connection (for initial setup only)