import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { X, Plus, Upload, Trash2 } from "lucide-react";
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

const printSchema = z.object({
  name: z.string().min(1, "Print name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  material: z.string().min(1, "Material is required"),
  estimatedTime: z.number().min(0.5, "Estimated time must be at least 0.5 hours"),
});

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewOrderModal({ isOpen, onClose, onSuccess }: NewOrderModalProps) {
  const { toast } = useToast();
  const [prints, setPrints] = useState([
    { 
      name: "", 
      quantity: 1, 
      material: "PLA", 
      estimatedTime: 4, 
      stlFile: null as File | null,
      gcodeFile: null as File | null,
      gcodeEstimatedTime: null as number | null
    }
  ]);

  const form = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      whatsappNumber: "",
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/orders", data);
    },
    onSuccess: () => {
      toast({
        title: "Order created successfully",
        description: "The new order has been added to your queue.",
      });
      onSuccess();
      form.reset();
      setPrints([{ 
        name: "", 
        quantity: 1, 
        material: "PLA", 
        estimatedTime: 4, 
        stlFile: null,
        gcodeFile: null,
        gcodeEstimatedTime: null
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
      name: "", 
      quantity: 1, 
      material: "PLA", 
      estimatedTime: 4, 
      stlFile: null,
      gcodeFile: null,
      gcodeEstimatedTime: null
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

  const handleFileUpload = (index: number, file: File | null) => {
    updatePrint(index, "stlFile", file);
  };

  const handleGcodeUpload = async (index: number, file: File | null) => {
    if (!file) {
      updatePrint(index, "gcodeFile", null);
      updatePrint(index, "gcodeEstimatedTime", null);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('gcodeFile', file);
      
      const response = await fetch('/api/upload/gcode', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Auto-fill form information from GCODE filename and data
        const filename = file.name.replace(/\.(gcode|g)$/i, '');
        
        // Extract name from filename (remove common GCODE suffixes)
        const cleanName = filename
          .replace(/_\d+h\d+m/i, '') // Remove time patterns like _4h30m
          .replace(/_\d+mm/gi, '') // Remove size patterns like _100mm
          .replace(/_v\d+/gi, '') // Remove version patterns like _v2
          .replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
          .trim();
        
        updatePrint(index, "gcodeFile", file);
        updatePrint(index, "gcodeEstimatedTime", result.estimatedTime);
        updatePrint(index, "estimatedTime", result.estimatedTime);
        
        // Auto-fill name if it's empty or default
        if (!prints[index].name || prints[index].name === `Print ${index + 1}`) {
          updatePrint(index, "name", cleanName || `Print ${index + 1}`);
        }
        
        toast({
          title: "GCODE uploaded and form auto-filled",
          description: `Print time: ${result.estimatedTime}h, Name: "${cleanName}"`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload GCODE file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: any) => {
    // Validate prints
    const validPrints = prints.filter(print => print.name.trim() !== "");
    if (validPrints.length === 0) {
      toast({
        title: "No prints added",
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
        totalEstimatedTime: validPrints.reduce((sum, print) => sum + print.estimatedTime * print.quantity, 0).toString(),
      },
      prints: validPrints.map(print => ({
        name: print.name,
        quantity: print.quantity,
        material: print.material,
        estimatedTime: (print.gcodeEstimatedTime || print.estimatedTime * print.quantity).toString(),
        stlFileName: print.stlFile?.name,
        stlFileUrl: print.stlFile ? `/uploads/${print.stlFile.name}` : undefined,
        gcodeFileName: print.gcodeFile?.name,
        gcodeFileUrl: print.gcodeFile ? `/uploads/${print.gcodeFile.name}` : undefined,
        gcodeEstimatedTime: print.gcodeEstimatedTime?.toString(),
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
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
                        onChange={(e) => updatePrint(index, "estimatedTime", parseFloat(e.target.value) || 0.5)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Upload STL File</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer relative">
                        <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-xs text-gray-600">
                          {print.stlFile ? print.stlFile.name : "Click to upload STL file"}
                        </p>
                        <input
                          type="file"
                          accept=".stl"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Upload GCODE File (Auto-fills form)</Label>
                      <div className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors cursor-pointer relative">
                        <Upload className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <p className="text-xs text-gray-600">
                          {print.gcodeFile ? print.gcodeFile.name : "Click to upload GCODE file"}
                        </p>
                        {print.gcodeEstimatedTime && (
                          <p className="text-xs text-green-600 font-medium">
                            Est. time: {print.gcodeEstimatedTime}h
                          </p>
                        )}
                        <input
                          type="file"
                          accept=".gcode,.g"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => handleGcodeUpload(index, e.target.files?.[0] || null)}
                        />
                      </div>
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
