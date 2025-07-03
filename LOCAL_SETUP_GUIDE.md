
# Local Development Setup Guide
## 3D Print Shop Management App

This guide will help you export your 3D print shop management app from Replit to Visual Studio Code and run it on your local computer.

## Prerequisites

Before starting, make sure you have the following installed:

### 1. Install Node.js
- Download Node.js (version 18 or higher) from [nodejs.org](https://nodejs.org/)
- Choose the LTS (Long Term Support) version
- Run the installer and follow the setup wizard
- Verify installation by opening Command Prompt/Terminal and running:
  ```bash
  node --version
  npm --version
  ```

### 2. Install Visual Studio Code
- Download VS Code from [code.visualstudio.com](https://code.visualstudio.com/)
- Run the installer and follow the setup wizard
- Launch VS Code to make sure it works

### 3. Install Git (Optional but recommended)
- Download Git from [git-scm.com](https://git-scm.com/)
- Run the installer with default settings
- Verify installation:
  ```bash
  git --version
  ```

## Step 1: Download Your Code from Replit

1. **In your Replit project:**
   - Click on the **three dots menu** (⋯) in the file explorer on the left
   - Select **"Download as ZIP"**
   - Save the ZIP file to your computer (e.g., `Downloads/3d-print-shop.zip`)

2. **Extract the files:**
   - Right-click on the ZIP file
   - Select "Extract All" or "Extract Here"
   - Choose a location like `C:\Projects\3d-print-shop` (Windows) or `~/Projects/3d-print-shop` (Mac/Linux)

## Step 2: Open Project in Visual Studio Code

1. **Launch Visual Studio Code**
2. **Open the project folder:**
   - Click **File** → **Open Folder**
   - Navigate to and select your extracted project folder
   - Click **Select Folder**

3. **Install recommended extensions:**
   - VS Code may prompt you to install recommended extensions
   - Install these extensions for better development experience:
     - TypeScript and JavaScript Language Features
     - ES7+ React/Redux/React-Native snippets
     - Tailwind CSS IntelliSense
     - Prettier - Code formatter

## Step 3: Install Project Dependencies

1. **Open the integrated terminal:**
   - Press `Ctrl + ` (backtick)` or go to **View** → **Terminal**
   - Make sure you're in the project root directory

2. **Install dependencies:**
   ```bash
   npm install
   ```
   - This will download all required packages
   - Wait for the installation to complete (may take a few minutes)

## Step 4: Set Up Environment Variables

1. **Create a `.env` file:**
   - In the project root directory, create a new file called `.env`
   - Add the following content:
   ```env
   NODE_ENV=development
   ```
   - The app will automatically use SQLite database when no DATABASE_URL is provided

## Step 5: Start the Development Server

1. **Run the development command:**
   ```bash
   npm run dev
   ```

2. **Access your application:**
   - Open your web browser
   - Navigate to `http://localhost:5000`
   - Your 3D print shop app should be running!

## Step 6: Understanding the File Structure

Your project contains these main directories:

```
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utility functions
├── server/              # Express.js backend API
│   ├── db.ts           # Database configuration
│   ├── routes.ts       # API routes
│   └── index.ts        # Server entry point
├── shared/              # Shared TypeScript schemas
├── uploads/             # Uploaded STL and image files
├── data.db             # SQLite database file
└── package.json        # Project dependencies
```

## Step 7: Development Workflow

### Making Changes
- **Frontend changes**: Edit files in `client/src/` - changes will automatically reload in the browser
- **Backend changes**: Edit files in `server/` - the server will restart automatically
- **Database changes**: Modify `shared/schema-sqlite.ts` if needed

### Common Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Step 8: Production Build (Optional)

If you want to create a production build:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## Troubleshooting Common Issues

### Port Already in Use Error
If you see "EADDRINUSE" error:

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F
```

**Mac/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

### Missing Dependencies
If you get module not found errors:
```bash
npm install --force
npm run dev
```

### Database Issues
If you encounter database errors:
1. Delete the `data.db` file
2. Restart the app with `npm run dev`
3. The database will be recreated automatically

### Permission Errors
If you get permission errors:

**Windows:** Run Command Prompt as Administrator
**Mac/Linux:** Use `sudo` prefix for commands if needed

## Features Available Locally

Your local installation includes all features:

- ✅ Order management and tracking
- ✅ Customer management
- ✅ Product catalog with STL file upload
- ✅ 3D file visualization
- ✅ Filament stock management
- ✅ Low stock alerts
- ✅ Print time estimation
- ✅ PDF report generation
- ✅ Dashboard with statistics
- ✅ Real-time updates

## File Upload Storage

- STL files are stored in the `uploads/` directory
- Technical drawings are stored in the `uploads/` directory
- Make sure this directory has write permissions

## Database Management

- Uses SQLite database (`data.db` file)
- Database tables are created automatically on first run
- Your data is stored locally and persists between sessions

## Tips for Success

1. **Keep VS Code updated** for the best development experience
2. **Use the integrated terminal** for running commands
3. **Install Git** to track changes and backup your code
4. **Create backups** of your `data.db` file regularly
5. **Check the console** for error messages if something doesn't work

## Next Steps

Once you have everything running locally:

1. **Customize the app** to fit your specific needs
2. **Add new features** as your business grows
3. **Consider deploying** to a cloud service when ready for production
4. **Set up regular backups** of your database

## Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Look at the terminal output for server errors
3. Verify all dependencies are installed correctly
4. Make sure ports 5000 is available

## Important Notes

- **Development vs Production**: The local setup runs in development mode with hot reloading
- **Database**: Uses SQLite locally instead of PostgreSQL (as used on Replit)
- **File Storage**: Files are stored locally in the `uploads/` directory
- **Performance**: Local development may be faster than cloud-based development

Your 3D print shop management app is now ready to run locally on your computer!
