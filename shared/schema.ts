import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("queued"), // queued, in_progress, completed
  notes: text("notes"),
  totalEstimatedTime: decimal("total_estimated_time", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  stlFileName: text("stl_file_name"),
  stlFileUrl: text("stl_file_url"),
  estimatedPrintTime: decimal("estimated_print_time", { precision: 10, scale: 2 }).notNull(),
  material: text("material").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prints = pgTable("prints", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  material: text("material").notNull(),
  estimatedTime: decimal("estimated_time", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("queued"), // queued, printing, completed
  stlFileName: text("stl_file_name"),
  stlFileUrl: text("stl_file_url"),
  gcodeFileName: text("gcode_file_name"),
  gcodeFileUrl: text("gcode_file_url"),
  gcodeEstimatedTime: decimal("gcode_estimated_time", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  whatsappMessages: many(whatsappMessages),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  prints: many(prints),
  whatsappMessages: many(whatsappMessages),
}));

export const productsRelations = relations(products, ({ many }) => ({
  prints: many(prints),
}));

export const printsRelations = relations(prints, ({ one }) => ({
  order: one(orders, {
    fields: [prints.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [prints.productId],
    references: [products.id],
  }),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  order: one(orders, {
    fields: [whatsappMessages.orderId],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [whatsappMessages.customerId],
    references: [customers.id],
  }),
}));

// Insert schemas
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
  sentAt: true,
});

// Types
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

// Additional schemas for API requests
export const updateOrderStatusSchema = z.object({
  status: z.enum(["queued", "in_progress", "completed"]),
});

export const updatePrintStatusSchema = z.object({
  status: z.enum(["queued", "in_progress", "completed"]),
});

export const sendWhatsappMessageSchema = z.object({
  orderId: z.number(),
  message: z.string(),
});
