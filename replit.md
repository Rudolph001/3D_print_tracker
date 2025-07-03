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
- July 03, 2025. Successfully migrated from Replit Agent to Replit environment
  * Fixed PDF generation by replacing Puppeteer with browser-native printing
  * Created professional print-ready catalog and order reports
  * Added part drawing upload functionality for products
  * Technical drawings now display in product catalog
  * All database connections and workflows now working properly
  * Completed full migration to Replit environment with SQLite database
  * Fixed product creation, dashboard stats, and all API endpoints
  * Application running successfully with 3D visualization support
- July 02, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```