import { useState } from "react";
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
import { formatPrintTime } from "@/lib/time-utils";

const orderSchema = z.object({
  customerId: z.number().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  email: z.string().optional(),
  address: z.string().optional(),
  invoiceNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

const printSchema = z.object({
  productId: z.number().min(1, "Product selection is required"),
  quantityNeeded: z.number().min(1, "Quantity needed must be at least 1"),
  quantityPerPlate: z.number().min(1, "Quantity per plate must be at least 1"),
});

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewOrderModal({ isOpen, onClose, onSuccess }: NewOrderModalProps) {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [prints, setPrints] = useState([
    { 
      productId: 0,
      quantityNeeded: 1,
      quantityPerPlate: 1,
      filamentStockId: null
    }
  ]);

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: filamentStock = [] } = useQuery({
    queryKey: ["/api/filament-stock"],
  });

  const form = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: undefined,
      customerName: "",
      whatsappNumber: "",
      email: "",
      address: "",
      invoiceNumber: "",
      referenceNumber: "",
      notes: "",
    },
  });

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    if (customerId === "new") {
      setIsNewCustomer(true);
      setSelectedCustomerId(null);
      form.setValue("customerId", undefined);
      form.setValue("customerName", "");
      form.setValue("whatsappNumber", "");
      form.setValue("email", "");
      form.setValue("address", "");
    } else {
      const customer = (customers as any[]).find(c => c.id === parseInt(customerId));
      if (customer) {
        setIsNewCustomer(false);
        setSelectedCustomerId(customer.id);
        form.setValue("customerId", customer.id);
        form.setValue("customerName", customer.name);
        form.setValue("whatsappNumber", customer.whatsappNumber);
        form.setValue("email", customer.email || "");
        form.setValue("address", customer.address || "");
      }
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Order created successfully",
        description: "The new order has been added to your queue.",
      });
      onSuccess();
      form.reset();
      setPrints([{ 
        productId: 0,
        quantityNeeded: 1,
        quantityPerPlate: 1,
        filamentStockId: null
      }]);
    },
    onError: () => {
      toast({
        title: "Failed to create order",
        description: "There was an error creating the order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addPrint = () => {
    setPrints([...prints, { 
      productId: 0,
      quantityNeeded: 1,
      quantityPerPlate: 1,
      filamentStockId: null
    }]);
  };

  const removePrint = (index: number) => {
    setPrints(prints.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    form.reset();
    setSelectedCustomerId(null);
    setIsNewCustomer(false);
    setPrints([{ 
      productId: 0,
      quantityNeeded: 1,
      quantityPerPlate: 1,
      filamentStockId: null
    }]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
        email: data.email || "",
        address: data.address || "",
      },
      order: {
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        invoiceNumber: data.invoiceNumber,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        totalEstimatedTime: totalEstimatedTime,
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
          estimatedTime: totalTime,
          stlFileName: product?.stlFileName,
          stlFileUrl: product?.stlFileUrl,
          filamentStockId: print.filamentStockId,
        };
      }),
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-4">
            <Label>Customer</Label>
            <Select onValueChange={handleCustomerSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select existing customer or create new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">+ Create New Customer</SelectItem>
                {(customers as any[])?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} - {customer.whatsappNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="customerName">Customer Name*</Label>
              <Input
                id="customerName"
                {...form.register("customerName")}
                placeholder="Enter customer name"
                disabled={!isNewCustomer && selectedCustomerId !== null}
              />
              {form.formState.errors.customerName && (
                <p className="text-sm text-red-600">{form.formState.errors.customerName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Number*</Label>
              <Input
                id="whatsappNumber"
                {...form.register("whatsappNumber")}
                placeholder="+1 (555) 123-4567"
                disabled={!isNewCustomer && selectedCustomerId !== null}
              />
              {form.formState.errors.whatsappNumber && (
                <p className="text-sm text-red-600">{form.formState.errors.whatsappNumber.message}</p>
              )}
            </div>
          </div>

          {/* Additional Customer Fields for New Customers */}
          {isNewCustomer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  placeholder="Customer address"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
              <Input
                id="invoiceNumber"
                {...form.register("invoiceNumber")}
                placeholder="INV-001"
              />
              {form.formState.errors.invoiceNumber && (
                <p className="text-sm text-red-600">{form.formState.errors.invoiceNumber.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
              <Input
                id="referenceNumber"
                {...form.register("referenceNumber")}
                placeholder="REF-001"
              />
              {form.formState.errors.referenceNumber && (
                <p className="text-sm text-red-600">{form.formState.errors.referenceNumber.message}</p>
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
                        value={print.productId > 0 ? print.productId.toString() : ""}
                        onValueChange={(value) => updatePrint(index, "productId", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a product to print" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {product.material} ({formatPrintTime(parseFloat(product.estimatedPrintTime))})
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
                  
                  {/* Filament Selection */}
                  {print.productId > 0 && (
                    <div className="mt-4">
                      <Label>Choose Filament (Optional)</Label>
                      <Select
                        value={print.filamentStockId?.toString() || ""}
                        onValueChange={(value) => updatePrint(index, "filamentStockId", value ? parseInt(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Use product default material or choose specific filament" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Use product default material</SelectItem>
                          {filamentStock
                            .filter((stock: any) => stock.material === getSelectedProduct(print.productId)?.material)
                            .map((stock: any) => (
                              <SelectItem key={stock.id} value={stock.id.toString()}>
                                {stock.material} - {stock.color} ({stock.brand || 'Generic'}) - {stock.currentWeightGrams}g available
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose a specific filament spool or leave empty to use any {getSelectedProduct(print.productId)?.material} filament
                      </p>
                    </div>
                  )}
                  
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
                          <div className="font-medium">{formatPrintTime(parseFloat(getSelectedProduct(print.productId)?.estimatedPrintTime || "0"))}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total print time:</span>
                          <div className="font-medium">{formatPrintTime(calculateTotalPrintTime(print.productId, print.quantityNeeded, print.quantityPerPlate))}</div>
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
              disabled={createOrderMutation.isPending}
              className="bg-primary hover:bg-blue-700 text-white"
            >
              {createOrderMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
