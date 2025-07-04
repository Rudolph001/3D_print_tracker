# 3D Print Shop Management App

## Overview

This is a full-stack web application designed for managing a 3D print shop. The application allows shop owners to track orders containing multiple prints, calculate total print times, send WhatsApp notifications to customers, and display a product catalog with interactive 3D previews of STL files.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend:

- **Frontend**: React-based single-page application built with Vite
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **File Storage**: Local file system for STL files
- **Communication**: RESTful API architecture
- **UI Framework**: Tailwind CSS with shadcn/ui components

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **3D Visualization**: Three.js integration for STL file previews

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Uploads**: Multer middleware for handling STL file uploads
- **API Design**: RESTful endpoints following standard HTTP conventions
- **Error Handling**: Centralized error handling middleware
- **Development Tools**: Hot reloading with Vite middleware integration

### Database Schema
The application uses a relational database structure with the following main entities:
- **Customers**: Store customer information including WhatsApp numbers
- **Orders**: Track order status and metadata with customer relationships
- **Products**: Catalog items with STL files and pricing information  
- **Prints**: Individual print jobs within orders with status tracking
- **WhatsApp Messages**: Log of communications sent to customers

### Key Features
1. **Order Management**: Create orders with multiple prints, track progress
2. **Print Tracking**: Individual print status (queued, printing, completed)
3. **Time Estimation**: Automatic calculation of total print times
4. **WhatsApp Integration**: Send automated status updates to customers
5. **3D Preview**: Interactive STL file visualization in the browser
6. **Dashboard**: Real-time statistics and order overview

## Data Flow

1. **Order Creation**: Customer information is stored, order is created with associated prints
2. **File Upload**: STL files are uploaded and associated with prints or products
3. **Status Updates**: Print and order statuses are updated, triggering WhatsApp notifications
4. **Real-time Dashboard**: Statistics are calculated and displayed in real-time
5. **3D Visualization**: STL files are loaded and rendered using Three.js

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, React Query)
- Express.js with middleware (cors, multer, express-session)
- Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)

### UI and Styling
- Tailwind CSS for styling
- Radix UI primitives for accessible components
- Lucide React for icons
- date-fns for date manipulation

### Development Tools
- TypeScript for type safety
- Vite for build tooling and development server
- ESBuild for production builds
- Replit-specific plugins for development environment

### 3D Visualization
- Three.js for STL file rendering (loaded via CDN)
- STL loader for parsing 3D model files

## Deployment Strategy

### Development Environment
- Uses Vite development server with hot module replacement
- Replit-specific middleware for development banner and error handling
- Environment variables for database connection

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: ESBuild bundles server code for Node.js deployment
- Database: Drizzle migrations for schema management
- File Storage: Local filesystem (can be extended to cloud storage)

### Environment Configuration
- DATABASE_URL required for PostgreSQL connection
- NODE_ENV for environment-specific behavior
- REPL_ID for Replit-specific features

The application is designed to be deployed on Replit but can be adapted for other platforms with minimal configuration changes. The build process creates a production-ready bundle that can be served by any Node.js hosting platform.

## Changelog

```
Changelog:
- July 04, 2025. Added automated local deployment with desktop shortcuts for non-technical users
  * Created comprehensive Windows batch file installer (install-3d-print-shop.bat)
  * Added PowerShell installer alternative (install-3d-print-shop.ps1)
  * Automated Node.js installation with administrator privileges
  * Created desktop and Start Menu shortcuts automatically
  * Added simple launcher script (start-3d-print-shop.bat) for easy app starting
  * Created detailed setup guide (SETUP_GUIDE.md) with troubleshooting
  * Added installation verification script (check-installation.bat)
  * Updated README.md with clear installation instructions for end users
  * Deployment solution designed for users without technical knowledge
- July 04, 2025. Enhanced WhatsApp notifications with order reports and completed Replit migration
  * Fixed "Notified" button in order cards to properly send WhatsApp notifications
  * Enhanced WhatsApp messages to include detailed order summaries with print status emojis
  * Added both online view and PDF download links for order reports in WhatsApp messages
  * WhatsApp messages now include order number, completion progress, and individual print statuses
  * Messages formatted with clear sections and professional layout with emojis
  * Successfully migrated project from Replit Agent to Replit environment
  * All core functionality working: order management, 3D visualization, database operations
  * Project running cleanly with proper client/server separation and security practices
- July 04, 2025. Enhanced order reporting and status management
  * Improved order report display to show only part names in item field
  * Added vibrant color-coded status badges with gradients and shadows
  * Enhanced visual distinction between different print statuses (queued, printing, completed, failed)
  * Added functional Update button to order cards for status management
  * Implemented order status synchronization logic (printing status now updates order to in_progress)
  * Fixed order report item field to display clean part names without extra details
  * Updated both main order report and clean report templates for consistency
  * FIXED: Resolved SQLite binding issues in order status updates using raw SQL queries
  * FIXED: Eliminated infinite loop causing maximum update depth warnings in dashboard
  * FIXED: Order status updates now work properly with Update buttons on order cards
  * FIXED: Proper dependency management in useEffect hooks prevents console errors
  * COMPLETED: All order status functionality now working correctly with real-time updates
- July 03, 2025. Successfully migrated from Replit Agent to Replit environment
  * Fixed PDF generation by replacing Puppeteer with browser-native printing
  * Created professional print-ready catalog and order reports
  * Added part drawing upload functionality for products
  * Technical drawings now display in product catalog
  * All database connections and workflows now working properly
  * Completed full migration to Replit environment with SQLite database
  * Fixed product creation, dashboard stats, and all API endpoints
  * Application running successfully with 3D visualization support
  * Updated PDF catalog to remove price, material, category, and quality fields
  * Added product code functionality to products and PDF catalog
  * Removed price display from product catalog interface
  * Product code field added to both add and edit product forms
  * Database updated with product_code column migration
  * Added local development setup files (LOCAL_SETUP.md, README.md, .env.example)
  * Configured project for easy local machine deployment
  * Removed Replit-specific dependencies for local development
- July 02, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```