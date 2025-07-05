import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Edit, Phone, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openOrderReport } from "@/lib/whatsapp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { OrderFilamentRequirements } from "./order-filament-requirements";

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
  const queryClient = useQueryClient();




  const getStatusLabel = (status: string) => {
    switch (status) {
      case "printing": return "Printing";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "queued": return "Queued";
      default: return status;
    }
  };

  const getPrintProgress = (print: any) => {
    if (print.status === "completed") return 100;
    if (print.status === "printing") return 50;
    if (print.status === "in_progress") return 50;
    return 0;
  };

  const updatePrintStatusMutation = useMutation({
    mutationFn: async ({ printId, status }: { printId: number; status: string }) => {
      const response = await fetch(`/api/prints/${printId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to update print status (${response.status})`;
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock"] }); // Refresh filament stock
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock/alerts"] }); // Refresh alerts
      toast({
        title: "Success",
        description: "Print status updated successfully. Filament inventory updated automatically.",
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update print status",
        variant: "destructive",
      });
    },
  });

  const handlePrintStatusUpdate = (printId: number, newStatus: string) => {
    updatePrintStatusMutation.mutate({ printId, status: newStatus });
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
          {order.invoiceNumber && (
            <div>
              <p className="text-sm text-gray-600">Invoice Number</p>
              <p className="font-medium text-gray-800">{order.invoiceNumber}</p>
            </div>
          )}
          {order.referenceNumber && (
            <div>
              <p className="text-sm text-gray-600">Reference Number</p>
              <p className="font-medium text-gray-800">{order.referenceNumber}</p>
            </div>
          )}
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
                    <p className="font-medium text-sm text-gray-800">{print.name.split('(')[0].trim()}</p>
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
                  {(print.status === "printing" || print.status === "in_progress") && (
                    <div className="mt-2">
                      <Progress value={getPrintProgress(print)} className="h-1" />
                    </div>
                  )}
                   <Select onValueChange={(value) => handlePrintStatusUpdate(print.id, value)}>
                      <SelectTrigger className="w-[180px] mt-2">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="printing">Printing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
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
            View Report
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
      <OrderFilamentRequirements orderId={order.id} />
    </div>
  );
}