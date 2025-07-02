
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const orderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  notes: z.string().optional(),
});

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: any;
}

export function EditOrderModal({ isOpen, onClose, onSuccess, order }: EditOrderModalProps) {
  const { toast } = useToast();
  const [prints, setPrints] = useState<any[]>([]);

  const form = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      whatsappNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (order) {
      form.reset({
        customerName: order.customer?.name || "",
        whatsappNumber: order.customer?.whatsappNumber || "",
        notes: order.notes || "",
      });
      setPrints(order.prints || []);
    }
  }, [order, form]);

  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/orders/${order.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Order updated successfully",
        description: "The order has been updated.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Failed to update order",
        description: "There was an error updating the order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addPrint = () => {
    setPrints([...prints, { 
      name: "", 
      quantity: 1, 
      material: "PLA", 
      estimatedTime: "4",
      status: "queued"
    }]);
  };

  const removePrint = (index: number) => {
    setPrints(prints.filter((_, i) => i !== index));
  };

  const updatePrint = (index: number, field: string, value: any) => {
    const updated = [...prints];
    updated[index] = { ...updated[index], [field]: value };
    setPrints(updated);
  };

  const onSubmit = async (data: any) => {
    const validPrints = prints.filter(print => print.name.trim() !== "");
    if (validPrints.length === 0) {
      toast({
        title: "No prints in order",
        description: "Please add at least one print to the order.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      customer: {
        name: data.customerName,
        whatsappNumber: data.whatsappNumber,
      },
      order: {
        notes: data.notes,
        totalEstimatedTime: validPrints.reduce((sum, print) => sum + parseFloat(print.estimatedTime || 0) * print.quantity, 0).toString(),
      },
      prints: validPrints.map(print => ({
        id: print.id,
        name: print.name,
        quantity: print.quantity,
        material: print.material,
        estimatedTime: (parseFloat(print.estimatedTime || 0) * print.quantity).toString(),
        status: print.status || "queued",
      })),
    };

    updateOrderMutation.mutate(orderData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order {order?.orderNumber}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                {...form.register("customerName")}
                placeholder="Enter customer name"
              />
              {form.formState.errors.customerName && (
                <p className="text-sm text-red-600">{form.formState.errors.customerName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                {...form.register("whatsappNumber")}
                placeholder="+1 (555) 123-4567"
              />
              {form.formState.errors.whatsappNumber && (
                <p className="text-sm text-red-600">{form.formState.errors.whatsappNumber.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Order Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Add any special instructions or notes..."
              rows={3}
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Print Jobs</h3>
              <Button type="button" variant="outline" onClick={addPrint}>
                <Plus className="h-4 w-4 mr-2" />
                Add Print Job
              </Button>
            </div>
            
            <div className="space-y-4">
              {prints.map((print, index) => (
                <div key={print.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm">Print Job {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrint(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Print Name</Label>
                      <Input
                        value={print.name}
                        onChange={(e) => updatePrint(index, "name", e.target.value)}
                        placeholder="Enter print name"
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={print.quantity}
                        onChange={(e) => updatePrint(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label>Material</Label>
                      <Select
                        value={print.material}
                        onValueChange={(value) => updatePrint(index, "material", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLA">PLA</SelectItem>
                          <SelectItem value="PETG">PETG</SelectItem>
                          <SelectItem value="ABS">ABS</SelectItem>
                          <SelectItem value="TPU">TPU</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Estimated Time (hours)</Label>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={print.estimatedTime}
                        onChange={(e) => updatePrint(index, "estimatedTime", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateOrderMutation.isPending}
              className="bg-primary hover:bg-blue-700 text-white"
            >
              {updateOrderMutation.isPending ? "Updating..." : "Update Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
