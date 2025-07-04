@echo off
echo Building for production...
set NODE_ENV=production
npm run build
echo Build completed! Files are in the 'dist' folder.