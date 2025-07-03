import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
// Removed puppeteer - using browser-native printing instead

import { storage } from "./storage";
import { 
  insertCustomerSchema, 
  insertOrderSchema, 
  insertProductSchema, 
  insertPrintSchema,
  updateOrderStatusSchema,
  updatePrintStatusSchema,
  sendWhatsappMessageSchema
} from "@shared/schema-sqlite";
import { z } from "zod";



// Function to parse GCODE file and extract comprehensive print data
async function parseGCodeData(filePath: string): Promise<{
  estimatedTime: number;
  nozzleTemp?: number;
  bedTemp?: number;
  layerHeight?: number;
  infillPercentage?: number;
  printSpeed?: number;
  layerCount?: number;
  filamentLength?: number;
  supportMaterial?: boolean;
  objectDimensions?: { x: number; y: number; z: number };
}> {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let estimatedTime = 4; // Default fallback
    let nozzleTemp: number | undefined;
    let bedTemp: number | undefined;
    let layerHeight: number | undefined;
    let infillPercentage: number | undefined;
    let printSpeed: number | undefined;
    let layerCount = 0;
    let filamentLength: number | undefined;
    let supportMaterial = false;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let currentZ = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract print time
      if (line.includes(';TIME:') || line.includes('; estimated printing time')) {
        const timeMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:h|hours|minutes|m|s|seconds)/i);
        if (timeMatch) {
          const value = parseFloat(timeMatch[1]);
          if (line.toLowerCase().includes('h') || line.toLowerCase().includes('hour')) {
            estimatedTime = value;
          } else if (line.toLowerCase().includes('m') || line.toLowerCase().includes('minute')) {
            estimatedTime = value / 60;
          } else if (line.toLowerCase().includes('s') || line.toLowerCase().includes('second')) {
            estimatedTime = value / 3600;
          }
        }
      }

      // PrusaSlicer time format
      if (line.includes('; estimated printing time (normal mode)')) {
        const nextLine = lines[i + 1];
        if (nextLine) {
          const timeMatch = nextLine.match(/;\s*(\d+)h\s*(\d+)m/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]) || 0;
            const minutes = parseInt(timeMatch[2]) || 0;
            estimatedTime = hours + (minutes / 60);
          }
        }
      }

      // Extract temperatures
      if (line.startsWith('M104') || line.startsWith('M109')) {
        const tempMatch = line.match(/S(\d+)/);
        if (tempMatch) nozzleTemp = parseInt(tempMatch[1]);
      }

      if (line.startsWith('M140') || line.startsWith('M190')) {
        const tempMatch = line.match(/S(\d+)/);
        if (tempMatch) bedTemp = parseInt(tempMatch[1]);
      }

      // Extract layer height from comments
      if (line.includes('layer_height') || line.includes('Layer height')) {
        const heightMatch = line.match(/(\d+\.?\d*)\s*mm/);
        if (heightMatch) layerHeight = parseFloat(heightMatch[1]);
      }

      // Extract infill percentage
      if (line.includes('fill_density') || line.includes('infill')) {
        const infillMatch = line.match(/(\d+)%/);
        if (infillMatch) infillPercentage = parseInt(infillMatch[1]);
      }

      // Extract filament length
      if (line.includes('filament used') || line.includes('Filament used')) {
        const lengthMatch = line.match(/(\d+\.?\d*)\s*m/);
        if (lengthMatch) filamentLength = parseFloat(lengthMatch[1]);
      }

      // Detect support material
      if (line.includes('support') && (line.includes('TYPE:') || line.includes('SUPPORT'))) {
        supportMaterial = true;
      }

      // Extract movement commands to determine dimensions and speed
      if (line.startsWith('G1') || line.startsWith('G0')) {
        // Extract coordinates
        const xMatch = line.match(/X([-\d.]+)/);
        const yMatch = line.match(/Y([-\d.]+)/);
        const zMatch = line.match(/Z([-\d.]+)/);
        const fMatch = line.match(/F(\d+)/);

        if (xMatch) {
          const x = parseFloat(xMatch[1]);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }

        if (yMatch) {
          const y = parseFloat(yMatch[1]);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }

        if (zMatch) {
          const z = parseFloat(zMatch[1]);
          if (z > currentZ) {
            layerCount++;
            currentZ = z;
          }
          minZ = Math.min(minZ, z);
          maxZ = Math.max(maxZ, z);
        }

        if (fMatch && !printSpeed) {
          printSpeed = parseInt(fMatch[1]);
        }
      }
    }

    // Calculate object dimensions
    const objectDimensions = (minX !== Infinity && maxX !== -Infinity) ? {
      x: Math.round((maxX - minX) * 10) / 10,
      y: Math.round((maxY - minY) * 10) / 10,
      z: Math.round((maxZ - minZ) * 10) / 10
    } : undefined;

    // If no time found, estimate based on file size
    if (estimatedTime === 4) {
      const fileSizeKB = fs.statSync(filePath).size / 1024;
      estimatedTime = Math.max(1, Math.round(fileSizeKB / 100));
    }

    return {
      estimatedTime,
      nozzleTemp,
      bedTemp,
      layerHeight,
      infillPercentage,
      printSpeed,
      layerCount: layerCount > 0 ? layerCount : undefined,
      filamentLength,
      supportMaterial: supportMaterial || undefined,
      objectDimensions
    };
  } catch (error) {
    console.error('Error parsing GCODE:', error);
    return { estimatedTime: 4 };
  }
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      // Keep original filename for STL files so 3D viewer can work
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Allow STL and GCODE files
    if (file.mimetype === 'application/octet-stream' || 
        file.originalname.endsWith('.stl') || 
        file.originalname.endsWith('.gcode')) {
      cb(null, true);
    }
    // Allow common image formats for drawings
    else if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    }
    // Allow PDF files for technical drawings
    else if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      const error = new Error('Only STL, GCODE, image, and PDF files are allowed') as any;
      cb(error, false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {


  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      // For now, return empty array - implement customer listing if needed
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid customer data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create customer" });
      }
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderWithDetails(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { customer, order, prints } = req.body;

      // Create or find customer
      let customerRecord = await storage.getCustomerByWhatsapp(customer.whatsappNumber);
      if (!customerRecord) {
        const customerData = insertCustomerSchema.parse(customer);
        customerRecord = await storage.createCustomer(customerData);
      }

      // Create order
      const orderData = insertOrderSchema.parse({
        ...order,
        customerId: customerRecord.id,
      });
      const newOrder = await storage.createOrder(orderData);

      // Create prints
      const printPromises = prints.map((print: any) => {
        const printData = insertPrintSchema.parse({
          ...print,
          orderId: newOrder.id,
        });
        return storage.createPrint(printData);
      });

      await Promise.all(printPromises);

      // Return order with details
      const orderWithDetails = await storage.getOrderWithDetails(newOrder.id);
      res.status(201).json(orderWithDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = updateOrderStatusSchema.parse(req.body);
      const updatedOrder = await storage.updateOrderStatus(id, status);
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid status", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update order status" });
      }
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { customer, order, prints } = req.body;

      // Update customer
      if (customer) {
        await storage.updateCustomer(id, customer);
      }

      // Update order
      if (order) {
        await storage.updateOrder(id, order);
      }

      // Update prints
      if (prints) {
        await storage.updateOrderPrints(id, prints);
      }

      // Return updated order with details
      const updatedOrder = await storage.getOrderWithDetails(id);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOrder(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete order error:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Print routes
  app.patch("/api/prints/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = updatePrintStatusSchema.parse(req.body);
      const updatedPrint = await storage.updatePrintStatus(id, status);
      res.json(updatedPrint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid status", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update print status" });
      }
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", upload.fields([
    { name: 'stlFile', maxCount: 1 },
    { name: 'drawingFile', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const stlFile = files?.stlFile?.[0];
      const drawingFile = files?.drawingFile?.[0];

      const productData = insertProductSchema.parse({
        ...req.body,
        stlFileName: stlFile?.originalname,
        stlFileUrl: stlFile ? `/api/files/${path.basename(stlFile.path)}` : null,
        drawingFileName: drawingFile?.originalname,
        drawingFileUrl: drawingFile ? `/api/files/${path.basename(drawingFile.path)}` : null,
      });
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  app.patch("/api/products/:id", upload.fields([
    { name: 'stlFile', maxCount: 1 },
    { name: 'drawingFile', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData: any = { ...req.body };
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const stlFile = files?.stlFile?.[0];
      const drawingFile = files?.drawingFile?.[0];

      // Add new file info if uploaded
      if (stlFile) {
        updateData.stlFileName = stlFile.originalname;
        updateData.stlFileUrl = `/api/files/${path.basename(stlFile.path)}`;
      }

      if (drawingFile) {
        updateData.drawingFileName = drawingFile.originalname;
        updateData.drawingFileUrl = `/api/files/${path.basename(drawingFile.path)}`;
      }

      const updatedProduct = await storage.updateProduct(id, updateData);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete product error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
      res.status(400).json({ error: errorMessage });
    }
  });

  // File upload for STL files
  app.post("/api/upload/stl", upload.single('stlFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      res.json({
        filename: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // File upload for GCODE files
  app.post("/api/upload/gcode", upload.single('gcodeFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Parse GCODE file to extract comprehensive print data
      const gcodeData = await parseGCodeData(req.file.path);

      res.json({
        filename: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        ...gcodeData,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Serve uploaded STL files
  app.get("/api/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    res.sendFile(filePath);
  });

  // Helper function to generate clean, simplified report HTML
  const generateReportHTML = async (orderId: number) => {
    const order = await storage.getOrderWithDetails(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // Calculate totals
    const totalParts = order.prints.reduce((sum: number, print: any) => sum + print.quantity, 0);
    const totalTime = order.prints.reduce((sum: number, print: any) => sum + (parseFloat(print.estimatedTime) * print.quantity), 0);
    const completedPrints = order.prints.filter((print: any) => print.status === 'completed').length;
    const progressPercentage = order.prints.length > 0 ? Math.round((completedPrints / order.prints.length) * 100) : 0;
    const remainingTime = order.prints
      .filter((print: any) => print.status !== 'completed')
      .reduce((sum: number, print: any) => sum + (parseFloat(print.estimatedTime) * print.quantity), 0);

    // Calculate estimated completion date
    const now = new Date();
    const estimatedCompletion = new Date(now.getTime() + (remainingTime * 60 * 60 * 1000));
    const isCompleted = order.status === 'completed';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order ${order.orderNumber} - Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #f8fafc;
              color: #1e293b;
              line-height: 1.6;
              padding: 40px 20px;
            }

            .document {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }

            .completion-badge {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px 24px;
              margin: 30px;
              text-align: center;
              color: #475569;
              font-weight: 500;
            }

            .completion-badge::before {
              content: '📅';
              margin-right: 8px;
            }

            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: 
                radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%);
              z-index: 1;
            }

            .header-content {
              position: relative;
              z-index: 2;
            }

            .company-logo {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              border-radius: 20px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              font-weight: 700;
              color: white;
              box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
            }

            .company-name {
              font-size: 36px;
              font-weight: 700;
              margin-bottom: 8px;
              letter-spacing: -0.02em;
              background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .company-tagline {
              font-size: 16px;
              opacity: 0.8;
              font-weight: 400;
              letter-spacing: 0.5px;
              margin-bottom: 30px;
            }

            .order-badge {
              display: inline-block;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              padding: 16px 32px;
              border-radius: 50px;
              font-size: 18px;
              font-weight: 600;
              box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .content {
              padding: 50px;
            }

            .status-section {
              text-align: center;
              margin-bottom: 50px;
              padding: 40px;
              background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
              border-radius: 20px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }

            .status-badge {
              display: inline-block;
              padding: 16px 40px;
              border-radius: 50px;
              font-size: 16px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 20px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              border: 2px solid transparent;
            }

            .status-queued { 
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              color: #92400e;
              border-color: #f59e0b;
            }

            .status-in_progress { 
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              color: #1e40af;
              border-color: #3b82f6;
            }

            .status-completed { 
              background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
              color: #166534;
              border-color: #22c55e;
            }

            .completion-date {
              font-size: 20px;
              color: #475569;
              font-weight: 500;
              margin-top: 15px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 50px;
            }

            .info-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
              transition: all 0.3s ease;
            }

            .info-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }

            .info-title {
              font-size: 14px;
              font-weight: 700;
              color: #6366f1;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .info-title::before {
              content: '';
              width: 4px;
              height: 20px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              border-radius: 2px;
            }

            .info-content {
              font-size: 16px;
              color: #334155;
              line-height: 1.7;
              font-weight: 400;
            }

            .info-content strong {
              color: #1e293b;
              font-weight: 600;
            }

            .prints-summary {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              overflow: hidden;
              margin-bottom: 40px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }

            .prints-header {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 24px 32px;
              border-bottom: 1px solid #e2e8f0;
              font-weight: 700;
              color: #1e293b;
              font-size: 20px;
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .prints-header::before {
              content: '📋';
              font-size: 24px;
            }

            .prints-table {
              width: 100%;
              border-collapse: collapse;
            }

            .prints-table th {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 20px;
              text-align: left;
              font-weight: 600;
              color: #475569;
              border-bottom: 2px solid #e2e8f0;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .prints-table td {
              padding: 20px;
              border-bottom: 1px solid #f1f5f9;
              color: #334155;
              font-weight: 400;
            }

            .prints-table tr:hover {
              background: #f8fafc;
            }

            .prints-table tr:last-child td {
              border-bottom: none;
            }

            .print-status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid;
            }

            .print-status-badge.status-queued {
              background: #fef3c7;
              color: #92400e;
              border-color: #f59e0b;
            }

            .print-status-badge.status-in_progress {
              background: #dbeafe;
              color: #1e40af;
              border-color: #3b82f6;
            }

            .print-status-badge.status-completed {
              background: #dcfce7;
              color: #166534;
              border-color: #22c55e;
            }

            .totals-section {
              background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
              border-radius: 20px;
              padding: 40px;
              margin: 40px 0;
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }

            .totals-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
              gap: 30px;
            }

            .total-item {
              text-align: center;
              padding: 20px;
              background: white;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }

            .total-value {
              font-size: 32px;
              font-weight: 700;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 8px;
            }

            .total-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 600;
            }

            .notes-section {
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              border-left: 4px solid #f59e0b;
              border-radius: 12px;
              padding: 24px;
              margin: 40px 0;
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
            }

            .notes-section strong {
              color: #92400e;
              font-size: 16px;
              font-weight: 600;
            }

            .footer {
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              color: white;
              padding: 50px;
              text-align: center;
              font-size: 14px;
              line-height: 1.8;
            }

            .footer-logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              border-radius: 15px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: 700;
            }

            .footer strong {
              font-size: 20px;
              display: block;
              margin-bottom: 15px;
              font-weight: 600;
            }

            .footer-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-top: 30px;
            }

            .footer-item {
              padding: 20px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 12px;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(0, 0, 0, 0.02);
              font-weight: 900;
              z-index: 0;
              pointer-events: none;
            }

            @media print {
              .document { 
                box-shadow: none; 
                margin: 0;
                border-radius: 0;
              }
              body { 
                margin: 0; 
                background: white;
              }
              .watermark { display: none; }
            }

            @media (max-width: 768px) {
              .info-grid { grid-template-columns: 1fr; }
              .totals-grid { grid-template-columns: 1fr 1fr; }
              .prints-table { font-size: 14px; }
              .content { padding: 30px; }
              .header { padding: 40px 30px; }
              .footer { padding: 30px; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">PRECISION 3D</div>
          <div class="document">
            <div class="header">
              <div class="header-content">
                <div class="company-logo">P3D</div>
                <div class="company-name">PRECISION 3D PRINTING</div>
                <div class="company-tagline">Professional Manufacturing Excellence</div>
                <div class="order-badge">Order #${order.orderNumber}</div>
              </div>
            </div>

            <div class="content">
              <div class="status-section">
                <div class="status-badge status-${order.status}">
                  ${order.status.replace('_', ' ').toUpperCase()}
                </div>
                <div class="completion-date">
                  ${isCompleted 
                    ? '✅ Order Completed Successfully' 
                    : `📅 Estimated Completion: ${estimatedCompletion.toLocaleDateString('en-ZA', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`
                  }
                </div>
              </div>

              <div class="info-grid">
                <div class="info-card">
                  <div class="info-title">👤 Customer Details</div>
                  <div class="info-content">
                    <strong>${order.customer.name}</strong><br>
                    📱 ${order.customer.whatsappNumber}<br>
                    📅 Ordered: ${new Date(order.createdAt).toLocaleDateString('en-ZA', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>

                <div class="info-card">
                  <div class="info-title">📊 Order Summary</div>
                  <div class="info-content">
                    <strong>${order.prints.length}</strong> Print Job${order.prints.length > 1 ? 's' : ''}<br>
                    <strong>${totalParts}</strong> Total Parts<br>
                    <strong>${totalTime.toFixed(2)}h</strong> Production Time<br>
                    <strong>Invoice:</strong> INV ${order.id.toString().padStart(6, '0')}<br>
                    <strong>Reference:</strong> ERF ${Math.floor(Math.random() * 9000) + 1000}
                  </div>
                </div>
              </div>

              <div class="prints-summary">
                <div class="prints-header">
                  Production Schedule
                </div>
                <table class="prints-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Material</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.prints.map((print: any) => `
                      <tr>
                        <td><strong>${print.name}</strong></td>
                        <td>${print.quantity}x</td>
                        <td>${print.material}</td>
                        <td>${(parseFloat(print.estimatedTime) * print.quantity).toFixed(1)}h</td>
                        <td>
                          <span class="print-status-badge status-${print.status}">
                            ${print.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              ${order.notes ? `
              <div class="notes-section">
                <strong>📝 Special Instructions</strong><br>
                ${order.notes}
              </div>
              ` : ''}

              <div class="totals-section">
                <div class="totals-grid">
                  <div class="total-item">
                    <div class="total-value">${order.prints.filter((p: any) => p.status === 'completed').length}/${order.prints.length}</div>
                    <div class="total-label">Completed</div>
                  </div>
                  <div class="total-item">
                    <div class="total-value">${Math.round((order.prints.filter((p: any) => p.status === 'completed').length / order.prints.length) * 100)}%</div>
                    <div class="total-label">Progress</div>
                  </div>
                  <div class="total-item">
                    <div class="total-value">${remainingTime.toFixed(1)}h</div>
                    <div class="total-label">Remaining</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-logo">P3D</div>
              <strong>Precision 3D Printing Services</strong>
              Your trusted partner for professional manufacturing excellence
              
              <div class="footer-grid">
                <div class="footer-item">
                  <strong>📧 Email</strong><br>
                  orders@precision3d.co.za
                </div>
                <div class="footer-item">
                  <strong>📞 Phone</strong><br>
                  +27 123 456 7890
                </div>
                <div class="footer-item">
                  <strong>💬 WhatsApp</strong><br>
                  Available for quotes
                </div>
                <div class="footer-item">
                  <strong>📅 Generated</strong><br>
                  ${new Date().toLocaleString('en-ZA')}
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
  };

  // WhatsApp routes
  // Professional HTML Report for printing
  app.get("/api/orders/:id/report", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const html = await generateReportHTML(id);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Print-Ready Order Report Route
  app.get("/api/orders/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderWithDetails(id);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Report #${id} - Precision 3D Printing</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              color: #2c3e50;
              line-height: 1.6;
              background: #ffffff;
            }
            
            .print-instructions {
              background: #e3f2fd;
              border: 1px solid #2196f3;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
              text-align: center;
            }
            
            .print-button {
              background: #2196f3;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              margin: 10px;
            }
            
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 3px solid #667eea;
              margin-bottom: 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 12px;
            }
            
            .company-name {
              font-size: 32px;
              font-weight: 800;
              margin-bottom: 10px;
            }
            
            .report-title {
              font-size: 18px;
              opacity: 0.9;
            }
            
            .order-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            
            .info-card {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #667eea;
            }
            
            .info-title {
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 10px;
            }
            
            .prints-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            
            .prints-table th, .prints-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .prints-table th {
              background: #f8fafc;
              font-weight: 600;
              color: #475569;
            }
            
            .status-badge {
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            
            .status-queued { background: #fef3c7; color: #92400e; }
            .status-in_progress { background: #dbeafe; color: #1e40af; }
            .status-completed { background: #dcfce7; color: #166534; }
            
            .totals {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="print-instructions no-print">
            <h3>📄 Order Report Ready to Print!</h3>
            <p>This professional order report is optimized for printing. Use your browser's print function to save as PDF.</p>
            <button class="print-button" onclick="window.print()">🖨️ Print Report</button>
            <button class="print-button" onclick="window.close()">❌ Close</button>
          </div>

          <div class="header">
            <div class="company-name">PRECISION 3D PRINTING</div>
            <div class="report-title">Order Report #${id}</div>
          </div>

          <div class="order-info">
            <div class="info-card">
              <div class="info-title">Customer Information</div>
              <strong>Name:</strong> ${order.customer?.name || 'N/A'}<br>
              <strong>Email:</strong> ${order.customer?.email || 'N/A'}<br>
              <strong>Phone:</strong> ${order.customer?.whatsappNumber || 'N/A'}
            </div>
            <div class="info-card">
              <div class="info-title">Order Details</div>
              <strong>Status:</strong> ${order.status}<br>
              <strong>Created:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
              <strong>Total Prints:</strong> ${order.prints?.length || 0}
            </div>
          </div>

          <table class="prints-table">
            <thead>
              <tr>
                <th>Print Name</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Time (hrs)</th>
                <th>Material</th>
              </tr>
            </thead>
            <tbody>
              ${order.prints?.map((print: any) => `
                <tr>
                  <td>${print.name}</td>
                  <td>${print.quantity}</td>
                  <td><span class="status-badge status-${print.status}">${print.status}</span></td>
                  <td>${print.estimatedTime}</td>
                  <td>${print.material || 'PLA'}</td>
                </tr>
              `).join('') || '<tr><td colspan="5">No prints found</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <h3>Order Summary</h3>
            <strong>Total Print Time:</strong> ${order.prints?.reduce((sum: number, print: any) => sum + (parseFloat(print.estimatedTime || 0) * print.quantity), 0).toFixed(2)} hours<br>
            <strong>Generated:</strong> ${new Date().toLocaleString()}
          </div>

          <script>
            window.onload = function() {
              document.body.focus();
            };
          </script>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Order report generation error:", error);
      res.status(500).json({ error: "Failed to generate order report" });
    }
  });

  // Removed SVG export - using browser-native printing instead

  // Helper function to generate product catalog HTML
  const generateProductCatalogHTML = async () => {
    const products = await storage.getProducts();

    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Professional Product Catalog - Precision 3D Printing</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              color: #2c3e50;
              line-height: 1.6;
              background: #ffffff;
            }

            .document {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }

            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 50px 40px;
              text-align: center;
            }

            .company-name {
              font-size: 36px;
              font-weight: 300;
              margin-bottom: 8px;
              letter-spacing: 3px;
            }

            .company-tagline {
              font-size: 16px;
              opacity: 0.9;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 20px;
            }

            .catalog-badge {
              display: inline-block;
              background: rgba(255,255,255,0.2);
              padding: 15px 30px;
              border-radius: 30px;
              margin-top: 20px;
              font-size: 20px;
              font-weight: 500;
              letter-spacing: 1px;
            }

            .content {
              padding: 40px;
            }

            .intro-section {
              text-align: center;
              margin-bottom: 50px;
              padding: 40px;
              background: #f8fafc;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }

            .intro-title {
              font-size: 28px;
              color: #2c3e50;
              margin-bottom: 20px;
              font-weight: 300;
            }

            .intro-text {
              font-size: 16px;
              color: #64748b;
              max-width: 600px;
              margin: 0 auto;
              line-height: 1.8;
            }

            .products-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
              gap: 30px;
              margin-bottom: 40px;
            }

            .product-card {
              background: #ffffff;
              border: 1px solid #e9ecef;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.07);
              transition: all 0.3s ease;
            }

            .product-image {
              height: 200px;
              background: linear-gradient(45deg, #f1f3f4 25%, transparent 25%), 
                          linear-gradient(-45deg, #f1f3f4 25%, transparent 25%), 
                          linear-gradient(45deg, transparent 75%, #f1f3f4 75%), 
                          linear-gradient(-45deg, transparent 75%, #f1f3f4 75%);
              background-size: 20px 20px;
              background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #94a3b8;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 1px solid #e9ecef;
            }

            .product-info {
              padding: 25px;
            }

            .product-name {
              font-size: 20px;
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 10px;
            }

            .product-description {
              color: #64748b;
              margin-bottom: 20px;
              font-size: 14px;
              line-height: 1.6;
            }

            .product-specs {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }

            .spec-item {
              display: flex;
              flex-direction: column;
            }

            .spec-label {
              font-size: 11px;
              font-weight: 600;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
            }

            .spec-value {
              font-size: 14px;
              color: #2c3e50;
              font-weight: 500;
            }

            .product-price {
              text-align: center;
              padding: 15px;
              background: #f8fafc;
              border-top: 1px solid #e9ecef;
              font-size: 18px;
              font-weight: 700;
              color: #667eea;
            }

            .no-products {
              text-align: center;
              padding: 60px 40px;
              color: #94a3b8;
            }

            .no-products-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }

            .stats-section {
              background: #f8fafc;
              border-radius: 12px;
              padding: 30px;
              margin: 40px 0;
              border-left: 4px solid #667eea;
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 25px;
              text-align: center;
            }

            .stat-item {
              display: flex;
              flex-direction: column;
            }

            .stat-value {
              font-size: 32px;
              font-weight: 700;
              color: #667eea;
              margin-bottom: 8px;
            }

            .stat-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
            }

            .footer {
              background: #2c3e50;
              color: white;
              padding: 40px;
              text-align: center;
              font-size: 12px;
              line-height: 1.8;
            }

            .footer strong {
              font-size: 18px;
              display: block;
              margin-bottom: 15px;
            }

            .contact-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-top: 20px;
            }

            .contact-item {
              padding: 15px;
              background: rgba(255,255,255,0.1);
              border-radius: 8px;
            }

            @media print {
              .document { box-shadow: none; }
              body { margin: 0; }
              .product-card { break-inside: avoid; }
            }

            @media (max-width: 600px) {
              .products-grid { grid-template-columns: 1fr; }
              .stats-grid { grid-template-columns: 1fr 1fr; }
              .content { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="document">
            <div class="header">
              <div class="company-name">PRECISION 3D PRINTING</div>
              <div class="company-tagline">Professional Manufacturing Solutions</div>
              <div class="catalog-badge">PRODUCT CATALOG ${new Date().getFullYear()}</div>
            </div>

            <div class="content">
              <div class="intro-section">
                <div class="intro-title">Premium 3D Printing Services</div>
                <div class="intro-text">
                  Discover our comprehensive range of professionally designed 3D printable products. 
                  From precision tools to creative designs, each item in our catalog is optimized for 
                  high-quality manufacturing using state-of-the-art 3D printing technology.
                </div>
              </div>

              ${products.length === 0 ? `
              <div class="no-products">
                <div class="no-products-icon">📦</div>
                <h3>No Products Available</h3>
                <p>Our catalog is currently being updated. Please check back soon for new products.</p>
              </div>
              ` : `
              <div class="products-grid">
                ${products.map((product: any) => `
                  <div class="product-card">
                    <div class="product-image">
                      ${product.stlFileName ? `3D Model: ${product.stlFileName}` : '3D Model Available'}
                    </div>
                    <div class="product-info">
                      <div class="product-name">${product.name}</div>
                      <div class="product-description">
                        ${product.description || 'Professional quality 3D printed product designed for optimal performance and durability.'}
                      </div>
                      <div class="product-specs">
                        <div class="spec-item">
                          <div class="spec-label">Material</div>
                          <div class="spec-value">${product.material}</div>
                        </div>
                        <div class="spec-item">
                          <div class="spec-label">Print Time</div>
                          <div class="spec-value">${parseFloat(product.estimatedPrintTime).toFixed(1)}h</div>
                        </div>
                        <div class="spec-item">
                          <div class="spec-label">Category</div>
                          <div class="spec-value">${product.category || 'General'}</div>
                        </div>
                        <div class="spec-item">
                          <div class="spec-label">Product ID</div>
                          <div class="spec-value">#${product.id.toString().padStart(4, '0')}</div>
                        </div>
                      </div>
                    </div>
                    ${product.price ? `
                    <div class="product-price">
                      R${parseFloat(product.price).toFixed(2)}
                    </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
              `}

              <div class="stats-section">
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-value">${products.length}</div>
                    <div class="stat-label">Products Available</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">${new Set(products.map((p: any) => p.material)).size}</div>
                    <div class="stat-label">Material Options</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">${new Set(products.map((p: any) => p.category)).size}</div>
                    <div class="stat-label">Categories</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">${products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrintTime || 0), 0).toFixed(0)}h</div>
                    <div class="stat-label">Total Print Time</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <strong>Precision 3D Printing Services</strong>
              Your trusted partner for professional 3D manufacturing solutions

              <div class="contact-grid">
                <div class="contact-item">
                  <strong>Email</strong><br>
                  orders@precision3d.co.za
                </div>
                <div class="contact-item">
                  <strong>Phone</strong><br>
                  +27 123 456 7890
                </div>
                <div class="contact-item">
                  <strong>WhatsApp</strong><br>
                  Available for quotes
                </div>
                <div class="contact-item">
                  <strong>Generated</strong><br>
                  ${new Date().toLocaleDateString('en-ZA')}
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
  };



  // Product Catalog HTML Route
  app.get("/api/products/catalog", async (req, res) => {
    try {
      const html = await generateProductCatalogHTML();
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Product catalog generation error:", error);
      res.status(500).json({ error: "Failed to generate product catalog" });
    }
  });

  // Product Catalog Print-Ready Route
  app.get("/api/products/catalog/pdf", async (req, res) => {
    try {
      const products = await storage.getProducts();
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Professional Product Catalog - Precision 3D Printing</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              color: #2c3e50;
              line-height: 1.6;
              background: #ffffff;
            }
            
            .print-instructions {
              background: #e3f2fd;
              border: 1px solid #2196f3;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
              text-align: center;
            }
            
            .print-button {
              background: #2196f3;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              margin: 10px;
            }
            
            .print-button:hover {
              background: #1976d2;
            }
            
            .header {
              text-align: center;
              padding: 40px 0;
              border-bottom: 3px solid #667eea;
              margin-bottom: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 12px;
            }
            
            .company-name {
              font-size: 42px;
              font-weight: 800;
              margin-bottom: 10px;
              letter-spacing: 2px;
            }
            
            .company-tagline {
              font-size: 16px;
              opacity: 0.9;
              margin-bottom: 20px;
              font-weight: 300;
            }
            
            .catalog-badge {
              display: inline-block;
              background: rgba(255,255,255,0.2);
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              letter-spacing: 1px;
            }
            
            .intro-section {
              text-align: center;
              margin-bottom: 50px;
            }
            
            .intro-title {
              font-size: 32px;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: 20px;
            }
            
            .intro-text {
              font-size: 16px;
              color: #64748b;
              max-width: 600px;
              margin: 0 auto;
              line-height: 1.8;
            }
            
            .products-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 30px;
              margin-bottom: 50px;
            }
            
            .product-card {
              border: 1px solid #e9ecef;
              border-radius: 12px;
              overflow: hidden;
              background: white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .product-image {
              height: 200px;
              background: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              border-bottom: 1px solid #e9ecef;
              overflow: hidden;
            }

            .product-image img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }

            .no-image {
              color: #94a3b8;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
              background: linear-gradient(45deg, #f1f3f4 25%, transparent 25%), 
                          linear-gradient(-45deg, #f1f3f4 25%, transparent 25%), 
                          linear-gradient(45deg, transparent 75%, #f1f3f4 75%), 
                          linear-gradient(-45deg, transparent 75%, #f1f3f4 75%);
              background-size: 20px 20px;
              background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .product-info {
              padding: 20px;
            }
            
            .product-name {
              font-size: 18px;
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 8px;
            }
            
            .product-description {
              color: #64748b;
              margin-bottom: 15px;
              font-size: 13px;
              line-height: 1.5;
            }
            
            .product-specs {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
            }
            
            .spec-item {
              display: flex;
              flex-direction: column;
            }
            
            .spec-label {
              font-size: 10px;
              font-weight: 600;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 3px;
            }
            
            .spec-value {
              font-size: 12px;
              color: #2c3e50;
              font-weight: 500;
            }
            
            .product-price {
              text-align: center;
              padding: 12px;
              background: #f8fafc;
              border-top: 1px solid #e9ecef;
              font-size: 16px;
              font-weight: 700;
              color: #667eea;
            }
            
            .no-products {
              text-align: center;
              padding: 60px 40px;
              color: #94a3b8;
            }
            
            .footer {
              background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 12px;
              margin-top: 40px;
            }
            
            .footer-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-top: 20px;
            }
            
            .footer-item {
              padding: 15px;
              background: rgba(255,255,255,0.1);
              border-radius: 8px;
            }
            
            .footer-item strong {
              display: block;
              margin-bottom: 5px;
              color: #ecf0f1;
            }
          </style>
        </head>
        <body>
          <div class="print-instructions no-print">
            <h3>📄 Ready to Print!</h3>
            <p>This professional catalog is optimized for printing. Click the button below to print or save as PDF.</p>
            <button class="print-button" onclick="window.print()">🖨️ Print Catalog</button>
            <button class="print-button" onclick="window.close()">❌ Close</button>
          </div>

          <div class="header">
            <div class="company-name">PRECISION 3D PRINTING</div>
            <div class="company-tagline">Professional Manufacturing Solutions</div>
            <div class="catalog-badge">PRODUCT CATALOG ${new Date().getFullYear()}</div>
          </div>

          <div class="intro-section">
            <div class="intro-title">Premium 3D Printing Services</div>
            <div class="intro-text">
              Discover our comprehensive range of professionally designed 3D printable products. 
              From precision tools to creative designs, each item in our catalog is optimized for 
              high-quality manufacturing using state-of-the-art 3D printing technology.
            </div>
          </div>

          ${products.length === 0 ? `
            <div class="no-products">
              <div style="font-size: 48px; margin-bottom: 20px;">📦</div>
              <h3>No Products Available</h3>
              <p>Products will appear here once they are added to the catalog.</p>
            </div>
          ` : `
            <div class="products-grid">
              ${products.map((product: any) => `
                <div class="product-card">
                  <div class="product-image">
                    ${product.drawingFileUrl ? 
                      `<img src="${product.drawingFileUrl}" alt="${product.name} technical drawing" />` : 
                      `<div class="no-image">Technical Drawing<br>Not Available</div>`
                    }
                  </div>
                  <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-description">${product.description || 'Professional 3D printed item with premium quality finish.'}</div>
                    <div class="product-specs">
                      <div class="spec-item">
                        <div class="spec-label">Material</div>
                        <div class="spec-value">${product.material || 'PLA+'}</div>
                      </div>
                      <div class="spec-item">
                        <div class="spec-label">Category</div>
                        <div class="spec-value">${product.category || 'Custom'}</div>
                      </div>
                      <div class="spec-item">
                        <div class="spec-label">Print Time</div>
                        <div class="spec-value">${product.estimatedPrintTime || '2-4'}h</div>
                      </div>
                      <div class="spec-item">
                        <div class="spec-label">Quality</div>
                        <div class="spec-value">Professional</div>
                      </div>
                    </div>
                  </div>
                  <div class="product-price">R${product.price || '99.00'}</div>
                </div>
              `).join('')}
            </div>
          `}

          <div class="footer">
            <strong>Precision 3D Printing Services</strong>
            Your trusted partner for professional manufacturing excellence
            
            <div class="footer-grid">
              <div class="footer-item">
                <strong>📧 Email</strong>
                orders@precision3d.co.za
              </div>
              <div class="footer-item">
                <strong>📞 Phone</strong>
                +27 123 456 7890
              </div>
              <div class="footer-item">
                <strong>💬 WhatsApp</strong>
                Available for quotes
              </div>
              <div class="footer-item">
                <strong>📅 Generated</strong>
                ${new Date().toLocaleString('en-ZA')}
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              document.body.focus();
            };
          </script>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Product catalog generation error:", error);
      res.status(500).json({ error: "Failed to generate product catalog" });
    }
  });

  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { orderId, message } = sendWhatsappMessageSchema.parse(req.body);

      // Get order details
      const order = await storage.getOrderWithDetails(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Create WhatsApp message record
      const whatsappMessage = await storage.createWhatsappMessage({
        orderId,
        customerId: order.customerId,
        message,
        status: "sent",
      });

      // Return download link and WhatsApp link for manual sending
      const downloadUrl = `${req.protocol}://${req.get('host')}/api/orders/${orderId}/pdf`;
      const whatsappLink = `https://wa.me/${order.customer.whatsappNumber.replace('+', '')}?text=${encodeURIComponent(`Hello ${order.customer.name}, here is your order update for ${order.orderNumber}. Download your order report: ${downloadUrl}`)}`;

      res.json({ 
        success: true, 
        messageId: whatsappMessage.id,
        downloadUrl,
        whatsappLink
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid message data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to generate download link" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}