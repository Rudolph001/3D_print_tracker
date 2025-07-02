import { 
  customers, 
  orders, 
  products, 
  prints, 
  whatsappMessages,
  type Customer, 
  type InsertCustomer,
  type Order,
  type InsertOrder,
  type Product,
  type InsertProduct,
  type Print,
  type InsertPrint,
  type WhatsappMessage,
  type InsertWhatsappMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Customer operations
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByWhatsapp(whatsappNumber: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
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

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.name));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
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

  async updatePrintStatus(id: number, status: string): Promise<Print> {
    const [updatedPrint] = await db.update(prints)
      .set({ status, updatedAt: new Date() })
      .where(eq(prints.id, id))
      .returning();
    return updatedPrint;
  }

  async createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const [newMessage] = await db.insert(whatsappMessages).values(message).returning();
    return newMessage;
  }

  async getWhatsappMessages(orderId: number): Promise<WhatsappMessage[]> {
    return await db.select().from(whatsappMessages).where(eq(whatsappMessages.orderId, orderId));
  }

  async getDashboardStats(): Promise<any> {
    const allOrders = await db.select().from(orders);
    const allPrints = await db.select().from(prints);
    
    const activeOrders = allOrders.filter(order => order.status !== 'completed').length;
    const printsInQueue = allPrints.filter(print => print.status === 'queued').length;
    const completedToday = allOrders.filter(order => {
      const today = new Date();
      const orderDate = new Date(order.updatedAt);
      return order.status === 'completed' && 
             orderDate.toDateString() === today.toDateString();
    }).length;
    
    const estimatedHours = allPrints
      .filter(print => print.status !== 'completed')
      .reduce((total, print) => total + parseFloat(print.estimatedTime), 0);

    return {
      activeOrders,
      printsInQueue,
      estimatedHours: Math.round(estimatedHours),
      completedToday,
    };
  }
}

export const storage = new DatabaseStorage();
