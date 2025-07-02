import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";

import { storage } from "./storage";
import { 
  insertCustomerSchema, 
  insertOrderSchema, 
  insertProductSchema, 
  insertPrintSchema,
  updateOrderStatusSchema,
  updatePrintStatusSchema,
  sendWhatsappMessageSchema
} from "@shared/schema";
import { z } from "zod";



// Function to parse GCODE file and extract print time
async function parseGCodePrintTime(filePath: string): Promise<number> {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Look for time estimation comments in GCODE
    for (const line of lines) {
      // Check for common slicer time estimates
      if (line.includes(';TIME:') || line.includes('; estimated printing time')) {
        const timeMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:h|hours|minutes|m|s|seconds)/i);
        if (timeMatch) {
          const value = parseFloat(timeMatch[1]);
          if (line.toLowerCase().includes('h') || line.toLowerCase().includes('hour')) {
            return value;
          } else if (line.toLowerCase().includes('m') || line.toLowerCase().includes('minute')) {
            return value / 60;
          } else if (line.toLowerCase().includes('s') || line.toLowerCase().includes('second')) {
            return value / 3600;
          }
        }
      }
      
      // PrusaSlicer format
      if (line.includes('; estimated printing time (normal mode)')) {
        const nextLine = lines[lines.indexOf(line) + 1];
        if (nextLine) {
          const timeMatch = nextLine.match(/;\s*(\d+)h\s*(\d+)m/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]) || 0;
            const minutes = parseInt(timeMatch[2]) || 0;
            return hours + (minutes / 60);
          }
        }
      }
    }
    
    // If no time found, estimate based on file size (rough approximation)
    const fileSizeKB = fs.statSync(filePath).size / 1024;
    return Math.max(1, Math.round(fileSizeKB / 100)); // Very rough estimate
  } catch (error) {
    console.error('Error parsing GCODE:', error);
    return 4; // Default fallback time
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
    if (file.mimetype === 'application/octet-stream' || 
        file.originalname.endsWith('.stl') || 
        file.originalname.endsWith('.gcode')) {
      cb(null, true);
    } else {
      const error = new Error('Only STL and GCODE files are allowed') as any;
      cb(error, false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
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

  app.post("/api/products", upload.single('stlFile'), async (req, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        stlFileName: req.file?.originalname,
        stlFileUrl: req.file ? `/api/files/${path.basename(req.file.path)}` : null,
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

      // Parse GCODE file to extract print time
      const printTime = await parseGCodePrintTime(req.file.path);
      
      res.json({
        filename: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        estimatedTime: printTime,
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

  // WhatsApp routes
  // Professional HTML Report for printing
  app.get("/api/orders/:id/report", async (req, res) => {
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
          <title>Order ${order.orderNumber} - 3D Print Shop</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              margin: 0;
              padding: 40px;
              color: #333;
              line-height: 1.6;
              background: white;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
            }
            .order-info {
              text-align: right;
              color: #666;
            }
            .order-number {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .status-queued { background: #fef3c7; color: #92400e; }
            .status-in_progress { background: #dbeafe; color: #1e40af; }
            .status-completed { background: #d1fae5; color: #065f46; }
            .customer-section, .prints-section {
              margin: 30px 0;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 15px;
              border-left: 4px solid #2563eb;
              padding-left: 12px;
            }
            .customer-card, .print-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 15px;
            }
            .customer-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .detail-item {
              display: flex;
              flex-direction: column;
            }
            .detail-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .detail-value {
              font-size: 16px;
              font-weight: 500;
              color: #374151;
            }
            .prints-grid {
              display: grid;
              gap: 15px;
            }
            .print-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }
            .print-name {
              font-size: 16px;
              font-weight: bold;
              color: #374151;
            }
            .print-status {
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .print-details {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 12px;
              margin-top: 12px;
            }
            .summary-section {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 20px;
            }
            .summary-item {
              text-align: center;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .summary-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            .notes-section {
              margin: 30px 0;
              padding: 20px;
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              border-radius: 0 8px 8px 0;
            }
            .contact-info {
              background: #f0f9ff;
              border: 1px solid #0ea5e9;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
            }
            .whatsapp-link {
              display: inline-block;
              background: #25d366;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 25px;
              font-weight: bold;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              .contact-info { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🏭 3D Print Shop</div>
            <div class="order-info">
              <div class="order-number">Order ${order.orderNumber}</div>
              <div>Generated: ${new Date().toLocaleDateString('en-ZA', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
          </div>

          <div class="customer-section">
            <div class="section-title">Customer Information</div>
            <div class="customer-card">
              <div class="customer-details">
                <div class="detail-item">
                  <div class="detail-label">Customer Name</div>
                  <div class="detail-value">${order.customer.name}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">WhatsApp Number</div>
                  <div class="detail-value">${order.customer.whatsappNumber}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Order Date</div>
                  <div class="detail-value">${new Date(order.createdAt).toLocaleDateString('en-ZA')}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Order Status</div>
                  <div class="detail-value">
                    <span class="status-badge status-${order.status}">${order.status.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="contact-info">
            <strong>📱 Share this report:</strong> Save as PDF (Ctrl/Cmd + P) and send via WhatsApp<br>
            <a href="https://wa.me/${order.customer.whatsappNumber.replace('+', '')}?text=${encodeURIComponent(`Hello ${order.customer.name}, here is your order update for ${order.orderNumber}`)}" 
               class="whatsapp-link" target="_blank">💬 Open WhatsApp Chat</a>
          </div>

          <div class="prints-section">
            <div class="section-title">Print Jobs (${order.prints.length})</div>
            <div class="prints-grid">
              ${order.prints.map((print: any, index: number) => `
                <div class="print-card">
                  <div class="print-header">
                    <div class="print-name">${index + 1}. ${print.name}</div>
                    <span class="print-status status-badge status-${print.status}">${print.status}</span>
                  </div>
                  <div class="print-details">
                    <div class="detail-item">
                      <div class="detail-label">Quantity</div>
                      <div class="detail-value">${print.quantity}x</div>
                    </div>
                    <div class="detail-item">
                      <div class="detail-label">Material</div>
                      <div class="detail-value">${print.material}</div>
                    </div>
                    <div class="detail-item">
                      <div class="detail-label">Print Time</div>
                      <div class="detail-value">${print.estimatedTime}h</div>
                    </div>
                    ${print.gcodeEstimatedTime ? `
                    <div class="detail-item">
                      <div class="detail-label">GCODE Time</div>
                      <div class="detail-value">${print.gcodeEstimatedTime}h</div>
                    </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          ${order.notes ? `
          <div class="notes-section">
            <div class="section-title">📝 Order Notes</div>
            <p>${order.notes}</p>
          </div>
          ` : ''}

          <div class="summary-section">
            <div class="section-title">Order Summary</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">${order.prints.length}</div>
                <div class="summary-label">Total Items</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${order.prints.reduce((sum: number, print: any) => sum + print.quantity, 0)}</div>
                <div class="summary-label">Total Quantity</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${order.totalEstimatedTime}h</div>
                <div class="summary-label">Total Print Time</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">R ${order.prints.reduce((sum: number, print: any) => sum + (parseFloat(print.estimatedTime) * 50 * print.quantity), 0).toFixed(2)}</div>
                <div class="summary-label">Estimated Cost</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>3D Print Shop Management System</strong></p>
            <p>Generated on ${new Date().toLocaleString('en-ZA')} | Order ${order.orderNumber}</p>
            <p>📧 Contact: info@3dprintshop.co.za | 📞 Phone: +27 123 456 7890</p>
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: "Failed to generate report" });
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
