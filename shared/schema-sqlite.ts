import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  email: text("email"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  orderNumber: text("order_number").notNull().unique(),
  invoiceNumber: text("invoice_number"),
  referenceNumber: text("reference_number"),
  status: text("status").notNull().default("queued"), // queued, in_progress, completed
  notes: text("notes"),
  totalEstimatedTime: real("total_estimated_time").default(0),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  productCode: text("product_code"),
  stlFileName: text("stl_file_name"),
  stlFileUrl: text("stl_file_url"),
  drawingFileName: text("drawing_file_name"),
  drawingFileUrl: text("drawing_file_url"),
  estimatedPrintTime: real("estimated_print_time").notNull(),
  material: text("material").notNull(),
  filamentLengthMeters: real("filament_length_meters"), // Total filament length in meters
  filamentWeightGrams: real("filament_weight_grams"), // Total filament weight in grams
  price: real("price"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Filament stock management
export const filamentStock = sqliteTable("filament_stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  material: text("material").notNull(), // PLA, PETG, ABS, etc.
  color: text("color").notNull(), // White, Black, Red, etc.
  brand: text("brand"), // eSUN, Hatchbox, etc.
  totalWeightGrams: real("total_weight_grams").notNull(), // Original spool weight
  currentWeightGrams: real("current_weight_grams").notNull(), // Current remaining weight
  lowStockThresholdGrams: real("low_stock_threshold_grams").notNull().default(100), // When to warn
  costPerKg: real("cost_per_kg"), // Cost per kilogram
  supplierInfo: text("supplier_info"), // Where to reorder
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Track filament usage per print
export const filamentUsage = sqliteTable("filament_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  printId: integer("print_id").references(() => prints.id).notNull(),
  filamentStockId: integer("filament_stock_id").references(() => filamentStock.id).notNull(),
  weightUsedGrams: real("weight_used_grams").notNull(),
  lengthUsedMeters: real("length_used_meters").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const prints = sqliteTable("prints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  material: text("material").notNull(),
  estimatedTime: real("estimated_time").notNull(),
  status: text("status").notNull().default("queued"), // queued, printing, completed
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

// Relations
export const filamentStockRelations = relations(filamentStock, ({ many }) => ({
  usage: many(filamentUsage),
}));

export const filamentUsageRelations = relations(filamentUsage, ({ one }) => ({
  print: one(prints, {
    fields: [filamentUsage.printId],
    references: [prints.id],
  }),
  filamentStock: one(filamentStock, {
    fields: [filamentUsage.filamentStockId],
    references: [filamentStock.id],
  }),
}));

// Insert schemas
export const insertFilamentStockSchema = createInsertSchema(filamentStock).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFilamentUsageSchema = createInsertSchema(filamentUsage).omit({
  id: true,
  createdAt: true,
});

// Product schema already defined above with filament info included

export const whatsappMessages = sqliteTable("whatsapp_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  message: text("message").notNull(),
  sent: integer("sent", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  prints: many(prints),
  whatsappMessages: many(whatsappMessages),
}));

export const productsRelations = relations(products, ({ many }) => ({
  prints: many(prints),
}));

export const printsRelations = relations(prints, ({ one }) => ({
  order: one(orders, { fields: [prints.orderId], references: [orders.id] }),
  product: one(products, { fields: [prints.productId], references: [products.id] }),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  order: one(orders, { fields: [whatsappMessages.orderId], references: [orders.id] }),
}));

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertPrintSchema = createInsertSchema(prints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  createdAt: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Print = typeof prints.$inferSelect;
export type InsertPrint = z.infer<typeof insertPrintSchema>;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(["queued", "in_progress", "completed"]),
});

export const updatePrintStatusSchema = z.object({
  status: z.enum(["queued", "printing", "completed"]),
});

export const sendWhatsappMessageSchema = z.object({
  orderId: z.number(),
  message: z.string().min(1),
});