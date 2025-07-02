import { apiRequest } from "./queryClient";

export interface WhatsAppMessage {
  orderId: number;
  message: string;
}

export async function sendWhatsAppMessage(data: WhatsAppMessage): Promise<any> {
  return apiRequest("POST", "/api/whatsapp/send", data);
}

export function generateOrderStatusMessage(order: any): string {
  const customerName = order.customer?.name || "Customer";
  const orderNumber = order.orderNumber;
  const completedPrints = order.prints?.filter((p: any) => p.status === "completed").length || 0;
  const totalPrints = order.prints?.length || 0;
  const status = order.status;

  let message = `Hello ${customerName}! 👋\n\n`;
  message += `Order Update: ${orderNumber}\n`;
  message += `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}\n`;
  message += `Progress: ${completedPrints}/${totalPrints} prints completed\n\n`;

  if (status === "completed") {
    message += `🎉 Great news! Your order is now complete and ready for pickup.\n\n`;
  } else if (status === "in_progress") {
    message += `🔄 Your order is currently being printed. We'll keep you updated!\n\n`;
  } else if (status === "queued") {
    message += `⏳ Your order is in our queue and will start printing soon.\n\n`;
  }

  message += `Thank you for choosing our 3D printing service! 🚀`;

  return message;
}

export function generatePrintStartMessage(order: any, printName: string): string {
  const customerName = order.customer?.name || "Customer";
  const orderNumber = order.orderNumber;

  return `Hello ${customerName}! 👋\n\nWe've started printing "${printName}" for your order ${orderNumber}. 🖨️\n\nWe'll notify you when it's completed!`;
}

export function generatePrintCompleteMessage(order: any, printName: string): string {
  const customerName = order.customer?.name || "Customer";
  const orderNumber = order.orderNumber;

  return `Hello ${customerName}! 👋\n\nGood news! "${printName}" from your order ${orderNumber} has been completed successfully. ✅\n\nWe'll let you know when your entire order is ready!`;
}
