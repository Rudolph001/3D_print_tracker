# Local Development Setup Guide

## Prerequisites

You'll need these installed on your machine:
- Node.js (version 18 or higher)
- npm (comes with Node.js)
- Git

## Setup Steps

### 1. Clone or Download the Project
```bash
# If using git
git clone <your-repo-url>
cd <project-folder>

# Or download and extract the ZIP file
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env` file in the root directory:
```bash
# Database - SQLite will be used automatically if no DATABASE_URL is set
# DATABASE_URL=your-postgresql-url (optional)

# Development settings
NODE_ENV=development
```

### 4. Start the Application
```bash
npm run dev
```

The app will be available at: `http://localhost:5000`

## What's Included

- **Backend**: Express.js server with REST API
- **Frontend**: React app with 3D visualization
- **Database**: SQLite (local file-based database)
- **File Storage**: Local uploads folder for STL files

## Project Structure

```
├── client/          # React frontend
├── server/          # Express.js backend
├── shared/          # Shared TypeScript types and schemas
├── uploads/         # STL files storage
├── package.json     # Dependencies and scripts
└── vite.config.ts   # Build configuration
```

## Features

- Order management with multiple prints
- Customer tracking with WhatsApp integration
- Product catalog with 3D STL file previews
- Print time calculation and status tracking
- Dashboard with real-time statistics
- Filament stock management

## Troubleshooting

### Port Already in Use
If you get a port error, you can change the port in `server/index.ts`:
```typescript
const PORT = process.env.PORT || 3000; // Change 5000 to 3000
```

### Database Issues
The app uses SQLite by default, which creates a local database file. No additional setup needed.

### Missing Dependencies
Run `npm install` again if you encounter missing package errors.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally