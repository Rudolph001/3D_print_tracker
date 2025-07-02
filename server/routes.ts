import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
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

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/octet-stream' || file.originalname.endsWith('.stl')) {
      cb(null, true);
    } else {
      cb(new Error('Only STL files are allowed'), false);
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
        stlFileUrl: req.file?.path,
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

  // Serve uploaded STL files
  app.get("/api/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    res.sendFile(filePath);
  });

  // WhatsApp routes
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
        status: "pending",
      });

      // TODO: Implement actual WhatsApp API call here
      // For now, just mark as sent
      res.json({ success: true, messageId: whatsappMessage.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid message data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to send WhatsApp message" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
