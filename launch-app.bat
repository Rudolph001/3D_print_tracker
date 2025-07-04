@echo off
title 3D Print Shop Management System
echo.
echo ====================================
echo    3D Print Shop Management System
echo ====================================
echo.
echo Starting the application...
echo.
echo The app will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

set NODE_ENV=development
.\node_modules\.bin\tsx server/index.ts

pause