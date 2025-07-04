
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPrintTime } from "@/lib/time-utils";
import { TimeInput } from "@/components/ui/time-input";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  productCode: z.string().optional(),
  material: z.string().min(1, "Material is required"),
  estimatedPrintTime: z.number().min(0.0003, "Print time must be at least 1 second"),
  filamentLengthMeters: z.number().min(0, "Filament length must be positive").optional(),
  filamentWeightGrams: z.number().min(0, "Filament weight must be positive").optional(),
  price: z.number().min(0, "Price must be positive").optional(),
});

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
}

export function EditProductModal({ isOpen, onClose, onSuccess, product }: EditProductModalProps) {
  const { toast } = useToast();
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [drawingFile, setDrawingFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      productCode: "",
      material: "PLA",
      estimatedPrintTime: 4,
      filamentLengthMeters: 0,
      filamentWeightGrams: 0,
      price: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        productCode: product.productCode || "",
        material: product.material || "PLA",
        estimatedPrintTime: parseFloat(product.estimatedPrintTime) || 4,
        filamentLengthMeters: parseFloat(product.filamentLengthMeters) || 0,
        filamentWeightGrams: parseFloat(product.filamentWeightGrams) || 0,
        price: parseFloat(product.price) || 0,
      });
    }
  }, [product, form]);

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Add product data
      Object.keys(data).forEach(key => {
        formData.append(key, data[key].toString());
      });
      
      // Add STL file if present
      if (stlFile) {
        formData.append('stlFile', stlFile);
      }

      // Add drawing file if present
      if (drawingFile) {
        formData.append('drawingFile', drawingFile);
      }

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product updated successfully",
        description: "The product has been updated in your catalog.",
      });
      onSuccess();
      setStlFile(null);
    },
    onError: () => {
      toast({
        title: "Failed to update product",
        description: "There was an error updating the product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateProductMutation.mutate(data);
  };

  const handleFileUpload = (file: File | null) => {
    setStlFile(file);
  };

  const handleDrawingUpload = (file: File | null) => {
    setDrawingFile(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter product name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="productCode">Product Code</Label>
              <Input
                id="productCode"
                {...form.register("productCode")}
                placeholder="e.g. P001, TOOL-001"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...form.register("category")}
                placeholder="e.g. Tools, Toys, Art"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Describe the product..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="material">Material</Label>
              <Select
                value={form.watch("material")}
                onValueChange={(value) => form.setValue("material", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLA">PLA</SelectItem>
                  <SelectItem value="PETG">PETG</SelectItem>
                  <SelectItem value="ABS">ABS</SelectItem>
                  <SelectItem value="TPU">TPU</SelectItem>
                  <SelectItem value="WOOD">Wood Filament</SelectItem>
                  <SelectItem value="METAL">Metal Filled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimatedPrintTime">Print Time (H:MM:SS)</Label>
              <TimeInput
                value={form.watch("estimatedPrintTime") || 0}
                onChange={(hours) => form.setValue("estimatedPrintTime", hours)}
                placeholder="0:00:00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: hours:minutes:seconds (e.g., 1:30:00 for 1.5 hours)
              </p>
              {form.formState.errors.estimatedPrintTime && (
                <p className="text-sm text-red-600">{form.formState.errors.estimatedPrintTime.message}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-3">Filament Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filamentWeightGrams">Weight (grams)</Label>
                <Input
                  id="filamentWeightGrams"
                  type="number"
                  step="0.1"
                  min="0"
                  {...form.register("filamentWeightGrams", { valueAsNumber: true })}
                  placeholder="e.g. 25.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total filament weight needed for one unit
                </p>
              </div>
              <div>
                <Label htmlFor="filamentLengthMeters">Length (meters)</Label>
                <Input
                  id="filamentLengthMeters"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("filamentLengthMeters", { valueAsNumber: true })}
                  placeholder="e.g. 8.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total filament length needed for one unit
                </p>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              💡 You can get these values from your slicer software (Cura, PrusaSlicer, etc.)
            </p>
          </div>
          
          <div>
            <Label htmlFor="price">Price (optional)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              {...form.register("price", { valueAsNumber: true })}
              placeholder="e.g. 15.99"
            />
            <p className="text-xs text-gray-500 mt-1">
              Selling price for this product
            </p>
          </div>
          
          <div>
            <Label>Update STL File (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer relative">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {stlFile ? stlFile.name : "Click to upload new STL file (optional)"}
              </p>
              <input
                type="file"
                accept=".stl"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateProductMutation.isPending}
              className="bg-primary hover:bg-blue-700 text-white"
            >
              {updateProductMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
