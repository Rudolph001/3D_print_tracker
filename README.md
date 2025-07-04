# 3D Print Shop Management System

A comprehensive web application for managing a 3D print shop with order tracking, customer management, and 3D file visualization.

## Quick Start (Local Development)

1. **Install Node.js** (version 18+) from [nodejs.org](https://nodejs.org/)

2. **Clone/Download** this project to your local machine

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and go to: `http://localhost:5000`

## Features

✅ **Order Management** - Track orders with multiple 3D prints  
✅ **Customer Database** - Store customer info and WhatsApp numbers  
✅ **3D File Viewer** - Preview STL files in the browser  
✅ **Print Status Tracking** - Monitor print progress and completion  
✅ **Dashboard Analytics** - View shop statistics and metrics  
✅ **Filament Management** - Track material inventory and usage  

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