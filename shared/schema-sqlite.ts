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
  stlFileName: text("stl_file_name"),
  stlFileUrl: text("stl_file_url"),
  drawingFileName: text("drawing_file_name"),
  drawingFileUrl: text("drawing_file_url"),
  estimatedPrintTime: real("estimated_print_time").notNull(),
  material: text("material").notNull(),
  price: real("price"),
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