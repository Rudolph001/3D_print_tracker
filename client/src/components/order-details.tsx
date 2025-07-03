import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Edit, Phone, Download, Share, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { openOrderReport } from "@/lib/whatsapp";

interface OrderDetailsProps {
  order: any;
  onUpdate: () => void;
  onEdit: (orderId: number) => void;
  onDelete: (orderId: number) => void;
  getStatusColor: (status: string) => string;
  getStatusBgColor: (status: string) => string;
}

export function OrderDetails({ order, onUpdate, onEdit, onDelete, getStatusColor, getStatusBgColor }: OrderDetailsProps) {
  const { toast } = useToast();

  const sendWhatsAppMutation = useMutation({
    mutationFn: async (data: { orderId: number; message: string }) => {
      return apiRequest("POST", "/api/whatsapp/send", data);
    },
    onSuccess: (response: any) => {
      // Open WhatsApp with the generated link
      if (response.whatsappLink) {
        window.open(response.whatsappLink, '_blank');
      }
      toast({
        title: "WhatsApp link generated",
        description: "Opening WhatsApp to share the order report with your customer.",
      });
      onUpdate();
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Could not send WhatsApp message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendWhatsApp = () => {
    const message = `Hello ${order.customer?.name}! Your order ${order.orderNumber} status update: ${order.status}. ${order.prints?.filter((p: any) => p.status === 'completed').length} of ${order.prints?.length} prints completed.`;
    sendWhatsAppMutation.mutate({ orderId: order.id, message });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "queued": return "Queued";
      default: return status;
    }
  };

  const getPrintProgress = (print: any) => {
    if (print.status === "completed") return 100;
    if (print.status === "printing") return 50;
    return 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Order {order.orderNumber} Details
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Customer</p>
            <p className="font-medium text-gray-800">{order.customer?.name}</p>
            <p className="text-sm text-gray-500 flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              {order.customer?.whatsappNumber}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Order Date</p>
            <p className="font-medium text-gray-800">
              {format(new Date(order.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <Badge className={`${getStatusBgColor(order.status)} ${getStatusColor(order.status)} font-medium`}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          {order.notes && (
            <div>
              <p className="text-sm text-gray-600">Notes</p>
              <p className="text-sm text-gray-800">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4">
            Print Jobs ({order.prints?.length || 0})
          </h4>
          <div className="space-y-3">
            {order.prints?.length === 0 ? (
              <p className="text-sm text-gray-500">No prints in this order</p>
            ) : (
              order.prints?.map((print: any) => (
                <div key={print.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-800">{print.name}</p>
                    <Badge className={`${getStatusBgColor(print.status)} ${getStatusColor(print.status)} text-xs`}>
                      {getStatusLabel(print.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      Qty: {print.quantity} | Material: {print.material}
                    </p>
                    <p>
                      Time: {print.estimatedTime}h | Status: {getStatusLabel(print.status)}
                    </p>
                  </div>
                  {print.status === "printing" && (
                    <div className="mt-2">
                      <Progress value={getPrintProgress(print)} className="h-1" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
          <Button
            onClick={() => openOrderReport(order.id)}
            className="w-full bg-primary hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Open Report & Print PDF
          </Button>
          <Button
            onClick={handleSendWhatsApp}
            disabled={sendWhatsAppMutation.isPending}
            variant="outline"
            className="w-full"
          >
            <Share className="h-4 w-4 mr-2" />
            {sendWhatsAppMutation.isPending ? "Generating..." : "Get WhatsApp Share Link"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => onEdit(order.id)} className="w-full">
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Button>
            <Button variant="destructive" onClick={() => onDelete(order.id)} className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
