import { 
  customers, 
  orders, 
  products, 
  prints, 
  whatsappMessages,
  filamentStock,
  filamentUsage,
  insertCustomerSchema,
  insertOrderSchema,
  insertProductSchema,
  insertPrintSchema,
  insertWhatsappMessageSchema,
  insertFilamentStockSchema,
  insertFilamentUsageSchema,
} from "@shared/schema-sqlite";
import type { 
  Customer, 
  InsertCustomer,
  Order,
  InsertOrder,
  Product,
  InsertProduct,
  Print,
  InsertPrint,
  WhatsappMessage,
  InsertWhatsappMessage
} from "@shared/schema-sqlite";
import { db, sqlite } from "./db";
import { eq, desc, asc, sql, and, lt, gt } from "drizzle-orm";

export interface IStorage {
  // Customer operations
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByWhatsapp(whatsappNumber: string): Promise<Customer | undefined>;
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithDetails(id: number): Promise<any>;
  getOrders(): Promise<any[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Print operations
  getPrint(id: number): Promise<Print | undefined>;
  getPrintsByOrder(orderId: number): Promise<Print[]>;
  createPrint(print: InsertPrint): Promise<Print>;
  updatePrintStatus(id: number, status: string): Promise<Print>;

  // WhatsApp operations
  createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage>;
  getWhatsappMessages(orderId: number): Promise<WhatsappMessage[]>;

  // Dashboard stats
  getDashboardStats(): Promise<any>;

    // Filament stock methods
  getFilamentStock(): Promise<any>;
  createFilamentStock(stockData: any): Promise<any>;
  updateFilamentStock(id: number, updates: any): Promise<any>;
  deleteFilamentStock(id: number): Promise<void>;
  getLowStockAlerts(): Promise<any>;
  updateFilamentUsage(printId: number, filamentStockId: number, weightUsed: number, lengthUsed: number): Promise<void>;
  getFilamentUsageByPrint(printId: number): Promise<any>;
  calculateOrderFilamentRequirements(orderId: number): Promise<any>;
  deductFilamentFromInventory(orderId: number): Promise<any>;
  checkFilamentAvailability(orderId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByWhatsapp(whatsappNumber: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.whatsappNumber, whatsappNumber));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(asc(customers.name));
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db.update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderWithDetails(id: number): Promise<any> {
    const orderResult = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        customer: true,
        prints: true,
      },
    });
    return orderResult;
  }

  async getOrders(): Promise<any[]> {
    const ordersResult = await db.query.orders.findMany({
      with: {
        customer: true,
        prints: true,
      },
      orderBy: desc(orders.createdAt),
    });
    return ordersResult;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const [newOrder] = await db.insert(orders).values({
      ...order,
      orderNumber,
    }).returning();
    return newOrder;
  }

  async updateOrder(id: number, orderData: any): Promise<Order> {
    const [updatedOrder] = await db.update(orders)
      .set({
        ...orderData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateCustomerByOrder(orderId: number, customerData: any): Promise<Customer> {
    // Get the order to find the customer ID
    const order = await this.getOrder(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const [updatedCustomer] = await db.update(customers)
      .set(customerData)
      .where(eq(customers.id, order.customerId))
      .returning();
    return updatedCustomer;
  }

  async updateOrderPrints(orderId: number, printsData: any[]): Promise<void> {
    // Delete existing prints for this order
    await db.delete(prints).where(eq(prints.orderId, orderId));

    // Insert new prints
    if (printsData.length > 0) {
      const newPrints = printsData.map(print => ({
        ...print,
        orderId,
        estimatedTime: print.estimatedTime?.toString() || "0",
      }));
      await db.insert(prints).values(newPrints);
    }
  }

  async deleteOrder(id: number): Promise<void> {
    // Delete prints first (foreign key constraint)
    await db.delete(prints).where(eq(prints.orderId, id));

    // Delete WhatsApp messages
    await db.delete(whatsappMessages).where(eq(whatsappMessages.orderId, id));

    // Delete the order
    await db.delete(orders).where(eq(orders.id, id));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    // Use raw SQLite to bypass Drizzle ORM binding issues
    if (sqlite) {
      const stmt = sqlite.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?");
      stmt.run(status, new Date().toISOString(), id);
      
      // Get the updated order
      const updatedOrder = await this.getOrder(id);
      if (!updatedOrder) {
        throw new Error(`Failed to update order status for ID ${id}`);
      }
      return updatedOrder;
    } else {
      // Fallback for PostgreSQL
      const [updatedOrder] = await db.update(orders)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(eq(orders.id, id))
        .returning();
      return updatedOrder;
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.name));
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(productData).returning();
    return newProduct;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    // First check if the product is referenced by any prints
    const referencedPrints = await db.select().from(prints).where(eq(prints.productId, id));

    if (referencedPrints.length > 0) {
      throw new Error('Cannot delete product: it is referenced by existing prints. Please remove or update the associated prints first.');
    }

    await db.delete(products).where(eq(products.id, id));
  }

  async getPrint(id: number): Promise<Print | undefined> {
    const [print] = await db.select().from(prints).where(eq(prints.id, id));
    return print || undefined;
  }

  async getPrintsByOrder(orderId: number): Promise<Print[]> {
    return await db.select().from(prints).where(eq(prints.orderId, orderId));
  }

  async createPrint(print: InsertPrint): Promise<Print> {
    const [newPrint] = await db.insert(prints).values(print).returning();
    return newPrint;
  }

  async updatePrintStatus(printId: number, status: string) {
    try {
      // First check if the print exists
      const existingPrint = await this.getPrint(printId);

      if (!existingPrint) {
        throw new Error(`Print with ID ${printId} not found`);
      }

      // Use raw SQLite to bypass Drizzle ORM binding issues
      if (sqlite) {
        const stmt = sqlite.prepare("UPDATE prints SET status = ? WHERE id = ?");
        stmt.run(status, printId);
      } else {
        // Fallback for PostgreSQL
        await db
          .update(prints)
          .set({ status })
          .where(eq(prints.id, printId));
      }

      // Get the updated print
      const updatedPrint = await this.getPrint(printId);
      
      if (!updatedPrint) {
        throw new Error(`Failed to update print status for ID ${printId}`);
      }

      const allPrints = await this.getPrintsByOrder(updatedPrint.orderId);

      const allCompleted = allPrints.every(print => print.status === 'completed');
      const hasInProgress = allPrints.some(print => print.status === 'in_progress' || print.status === 'printing');

      let newOrderStatus = 'queued';
      if (allCompleted) {
        newOrderStatus = 'completed';
      } else if (hasInProgress || status === 'in_progress' || status === 'printing') {
        newOrderStatus = 'in_progress';
      }

      const currentOrder = await this.getOrder(updatedPrint.orderId);

      if (currentOrder && currentOrder.status !== newOrderStatus) {
        await this.updateOrderStatus(updatedPrint.orderId, newOrderStatus);
      }

      return updatedPrint;
    } catch (error) {
      console.error("Database error in updatePrintStatus:", error);
      throw error;
    }
  }

  async createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const [newMessage] = await db.insert(whatsappMessages).values(message).returning();
    return newMessage;
  }

  async getWhatsappMessages(orderId: number): Promise<WhatsappMessage[]> {
    return await db.select().from(whatsappMessages).where(eq(whatsappMessages.orderId, orderId));
  }

  async getDashboardStats(): Promise<any> {
    const totalOrders = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const activeOrders = await db.select({ count: sql<number>`count(*)` }).from(orders).where(sql`status != 'completed'`);
    const totalPrints = await db.select({ count: sql<number>`count(*)` }).from(prints);
    const printsInQueue = await db.select({ count: sql<number>`count(*)` }).from(prints).where(eq(prints.status, "queued"));
    const estimatedTime = await db.select({ total: sql<number>`sum(estimated_time * quantity)` }).from(prints).where(sql`status != 'completed'`);
    const lowStockCount = await db.select({ count: sql<number>`count(*)` }).from(filamentStock).where(sql`current_weight_grams <= low_stock_threshold_grams`);

    return {
      totalOrders: totalOrders[0]?.count || 0,
      activeOrders: activeOrders[0]?.count || 0,
      totalPrints: totalPrints[0]?.count || 0,
      printsInQueue: printsInQueue[0]?.count || 0,
      estimatedTimeRemaining: estimatedTime[0]?.total || 0,
      lowStockAlerts: lowStockCount[0]?.count || 0,
    };
  }

  // Filament stock methods
  async getFilamentStock() {
    return await db.select().from(filamentStock).orderBy(desc(filamentStock.updatedAt));
  }

  async createFilamentStock(stockData: any) {
    const [result] = await db.insert(filamentStock).values(stockData).returning();
    return result;
  }

  async updateFilamentStock(id: number, updates: any) {
    const [result] = await db
      .update(filamentStock)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(filamentStock.id, id))
      .returning();
    return result;
  }

  async deleteFilamentStock(id: number) {
    await db.delete(filamentStock).where(eq(filamentStock.id, id));
  }

  async getLowStockAlerts() {
    return await db
      .select()
      .from(filamentStock)
      .where(sql`current_weight_grams <= low_stock_threshold_grams`);
  }

  async updateFilamentUsage(printId: number, filamentStockId: number, weightUsed: number, lengthUsed: number) {
    // Record usage
    await db.insert(filamentUsage).values({
      printId,
      filamentStockId,
      weightUsedGrams: weightUsed,
      lengthUsedMeters: lengthUsed,
    });

    // Update stock
    await db
      .update(filamentStock)
      .set({
        currentWeightGrams: sql`current_weight_grams - ${weightUsed}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(filamentStock.id, filamentStockId));
  }

  async getFilamentUsageByPrint(printId: number) {
    return await db
      .select({
        usage: filamentUsage,
        stock: filamentStock,
      })
      .from(filamentUsage)
      .leftJoin(filamentStock, eq(filamentUsage.filamentStockId, filamentStock.id))
      .where(eq(filamentUsage.printId, printId));
  }

  async calculateOrderFilamentRequirements(orderId: number) {
    const order = await this.getOrderWithDetails(orderId);
    if (!order) return null;

    const requirements: Record<string, { weight: number; length: number }> = {};

    for (const print of order.prints) {
      const product = await this.getProduct(print.productId);
      if (product && product.filamentWeightGrams && product.filamentLengthMeters) {
        const totalWeight = product.filamentWeightGrams * print.quantity;
        const totalLength = product.filamentLengthMeters * print.quantity;

        if (!requirements[print.material]) {
          requirements[print.material] = { weight: 0, length: 0 };
        }

        requirements[print.material].weight += totalWeight;
        requirements[print.material].length += totalLength;
      }
    }

    return requirements;
  }

  // Deduct filament from inventory when order is processed
  async deductFilamentFromInventory(orderId: number) {
    const order = await this.getOrderWithDetails(orderId);
    if (!order) throw new Error('Order not found');

    const deductions = [];

    for (const print of order.prints) {
      const product = await this.getProduct(print.productId);
      if (product && product.filamentWeightGrams && product.filamentLengthMeters) {
        const totalWeightNeeded = product.filamentWeightGrams * print.quantity;
        const totalLengthNeeded = product.filamentLengthMeters * print.quantity;

        // Find available rolls of this material and color
        const availableRolls = await db
          .select()
          .from(filamentStock)
          .where(
            and(
              eq(filamentStock.material, print.material),
              gt(filamentStock.currentWeightGrams, 0)
            )
          )
          .orderBy(asc(filamentStock.currentWeightGrams)); // Use rolls with less material first

        let remainingWeight = totalWeightNeeded;
        let remainingLength = totalLengthNeeded;

        for (const roll of availableRolls) {
          if (remainingWeight <= 0) break;

          const availableWeight = roll.currentWeightGrams;
          const weightToDeduct = Math.min(availableWeight, remainingWeight);
          
          // Calculate proportional length based on weight
          const lengthToDeduct = remainingLength * (weightToDeduct / remainingWeight);

          // Update the roll
          const newWeight = roll.currentWeightGrams - weightToDeduct;
          await db
            .update(filamentStock)
            .set({
              currentWeightGrams: newWeight,
              updatedAt: new Date()
            })
            .where(eq(filamentStock.id, roll.id));

          // Record the usage
          await db.insert(filamentUsage).values({
            printId: print.id,
            filamentStockId: roll.id,
            weightUsed: weightToDeduct,
            lengthUsed: lengthToDeduct,
            createdAt: new Date()
          });

          remainingWeight -= weightToDeduct;
          remainingLength -= lengthToDeduct;

          deductions.push({
            rollId: roll.id,
            material: roll.material,
            color: roll.color,
            weightDeducted: weightToDeduct,
            lengthDeducted: lengthToDeduct,
            remainingWeight: newWeight
          });
        }

        if (remainingWeight > 0) {
          throw new Error(`Insufficient ${print.material} filament available. Need ${remainingWeight}g more.`);
        }
      }
    }

    return deductions;
  }

  // Helper method to check if there's enough filament for an order
  async checkFilamentAvailability(orderId: number) {
    const requirements = await this.calculateOrderFilamentRequirements(orderId);
    if (!requirements) return { available: false, details: [] };

    const availabilityDetails = [];

    for (const [material, needed] of Object.entries(requirements)) {
      const availableRolls = await db
        .select()
        .from(filamentStock)
        .where(
          and(
            eq(filamentStock.material, material),
            gt(filamentStock.currentWeightGrams, 0)
          )
        );

      const totalAvailable = availableRolls.reduce((sum, roll) => sum + roll.currentWeightGrams, 0);
      const isAvailable = totalAvailable >= needed.weight;

      availabilityDetails.push({
        material,
        needed: needed.weight,
        available: totalAvailable,
        sufficient: isAvailable,
        rolls: availableRolls.length
      });
    }

    const allAvailable = availabilityDetails.every(detail => detail.sufficient);

    return {
      available: allAvailable,
      details: availabilityDetails
    };
  }
}

export const storage = new DatabaseStorage();