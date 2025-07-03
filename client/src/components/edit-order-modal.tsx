
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  const [prints, setPrints] = useState([
    { 
      productId: 0,
      quantityNeeded: 1,
      quantityPerPlate: 1
    }
  ]);

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

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
      
      // Convert existing prints to the new format
      if (order.prints && order.prints.length > 0) {
        const convertedPrints = order.prints.map((print: any) => ({
          productId: print.productId || 0,
          quantityNeeded: print.quantity || 1,
          quantityPerPlate: 1, // Default value since this wasn't stored before
        }));
        setPrints(convertedPrints);
      } else {
        setPrints([{ 
          productId: 0,
          quantityNeeded: 1,
          quantityPerPlate: 1
        }]);
      }
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
      productId: 0,
      quantityNeeded: 1,
      quantityPerPlate: 1
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

  const getSelectedProduct = (productId: number) => {
    return products.find((product: any) => product.id === productId);
  };

  const calculatePlates = (quantityNeeded: number, quantityPerPlate: number) => {
    return Math.ceil(quantityNeeded / quantityPerPlate);
  };

  const calculateTotalPrintTime = (productId: number, quantityNeeded: number, quantityPerPlate: number) => {
    const product = getSelectedProduct(productId);
    if (!product) return 0;
    
    const plates = calculatePlates(quantityNeeded, quantityPerPlate);
    const timePerPlate = parseFloat(product.estimatedPrintTime);
    return plates * timePerPlate;
  };

  const onSubmit = async (data: any) => {
    // Validate prints
    const validPrints = prints.filter(print => print.productId > 0);
    if (validPrints.length === 0) {
      toast({
        title: "No prints added",
        description: "Please add at least one print to the order.",
        variant: "destructive",
      });
      return;
    }

    const totalEstimatedTime = validPrints.reduce((sum, print) => {
      return sum + calculateTotalPrintTime(print.productId, print.quantityNeeded, print.quantityPerPlate);
    }, 0);

    const orderData = {
      customer: {
        name: data.customerName,
        whatsappNumber: data.whatsappNumber,
      },
      order: {
        notes: data.notes,
        totalEstimatedTime: totalEstimatedTime.toString(),
      },
      prints: validPrints.map(print => {
        const product = getSelectedProduct(print.productId);
        const plates = calculatePlates(print.quantityNeeded, print.quantityPerPlate);
        const totalTime = calculateTotalPrintTime(print.productId, print.quantityNeeded, print.quantityPerPlate);
        
        return {
          productId: print.productId,
          name: `${product?.name} (${print.quantityNeeded} pieces, ${plates} plates)`,
          quantity: print.quantityNeeded,
          material: product?.material || "PLA",
          estimatedTime: totalTime.toString(),
          stlFileName: product?.stlFileName,
          stlFileUrl: product?.stlFileUrl,
        };
      }),
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
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm">Print Job {index + 1}</h4>
                    {prints.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrint(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label>Select Product</Label>
                      <Select
                        value={print.productId.toString()}
                        onValueChange={(value) => updatePrint(index, "productId", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a product to print" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {product.material} ({product.estimatedPrintTime}h)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity Needed</Label>
                      <Input
                        type="number"
                        min="1"
                        value={print.quantityNeeded}
                        onChange={(e) => updatePrint(index, "quantityNeeded", parseInt(e.target.value) || 1)}
                        placeholder="Total pieces needed"
                      />
                    </div>
                    <div>
                      <Label>Quantity Per Plate</Label>
                      <Input
                        type="number"
                        min="1"
                        value={print.quantityPerPlate}
                        onChange={(e) => updatePrint(index, "quantityPerPlate", parseInt(e.target.value) || 1)}
                        placeholder="Pieces per print plate"
                      />
                    </div>
                  </div>
                  
                  {print.productId > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Print Calculation Summary</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Plates needed:</span>
                          <div className="font-medium">{calculatePlates(print.quantityNeeded, print.quantityPerPlate)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Time per plate:</span>
                          <div className="font-medium">{getSelectedProduct(print.productId)?.estimatedPrintTime}h</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total print time:</span>
                          <div className="font-medium">{calculateTotalPrintTime(print.productId, print.quantityNeeded, print.quantityPerPlate)}h</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Material:</span>
                          <div className="font-medium">{getSelectedProduct(print.productId)?.material}</div>
                        </div>
                      </div>
                    </div>
                  )}
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
