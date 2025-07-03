import { 
  customers, 
  orders, 
  products, 
  prints, 
  whatsappMessages
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
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

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