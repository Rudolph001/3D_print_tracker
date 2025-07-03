
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, AlertTriangle, Package, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const filamentStockSchema = z.object({
  material: z.string().min(1, "Material is required"),
  color: z.string().min(1, "Color is required"),
  brand: z.string().optional(),
  totalWeightGrams: z.number().min(1, "Total weight must be positive"),
  currentWeightGrams: z.number().min(0, "Current weight must be positive"),
  lowStockThresholdGrams: z.number().min(1, "Threshold must be positive"),
  costPerKg: z.number().min(0, "Cost must be positive").optional(),
  supplierInfo: z.string().optional(),
});

interface FilamentStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilamentStockModal({ isOpen, onClose }: FilamentStockModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [editingStock, setEditingStock] = useState<any | null>(null);

  const { data: filamentStock = [] } = useQuery({
    queryKey: ["/api/filament-stock"],
    enabled: isOpen,
  });

  const { data: lowStockAlerts = [] } = useQuery({
    queryKey: ["/api/filament-stock/alerts"],
    enabled: isOpen,
  });

  const form = useForm({
    resolver: zodResolver(filamentStockSchema),
    defaultValues: {
      material: "PLA",
      color: "",
      brand: "",
      totalWeightGrams: 1000,
      currentWeightGrams: 1000,
      lowStockThresholdGrams: 100,
      costPerKg: 0,
      supplierInfo: "",
    },
  });

  const createStockMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/filament-stock", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsAddingStock(false);
      form.reset();
      toast({
        title: "Success",
        description: "Filament stock added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add filament stock",
        variant: "destructive",
      });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/filament-stock/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setEditingStock(null);
      form.reset();
      toast({
        title: "Success",
        description: "Filament stock updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update filament stock",
        variant: "destructive",
      });
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/filament-stock/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Filament stock deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete filament stock",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingStock) {
      updateStockMutation.mutate({ id: editingStock.id, data });
    } else {
      createStockMutation.mutate(data);
    }
  };

  const handleEdit = (stock: any) => {
    setEditingStock(stock);
    form.reset({
      material: stock.material,
      color: stock.color,
      brand: stock.brand || "",
      totalWeightGrams: stock.totalWeightGrams,
      currentWeightGrams: stock.currentWeightGrams,
      lowStockThresholdGrams: stock.lowStockThresholdGrams,
      costPerKg: stock.costPerKg || 0,
      supplierInfo: stock.supplierInfo || "",
    });
    setIsAddingStock(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this filament stock?")) {
      deleteStockMutation.mutate(id);
    }
  };

  const getStockStatus = (current: number, threshold: number) => {
    if (current <= threshold) return "critical";
    if (current <= threshold * 2) return "low";
    return "good";
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "low":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Low</Badge>;
      default:
        return <Badge className="bg-green-500 hover:bg-green-600">Good</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Filament Stock Management
          </DialogTitle>
        </DialogHeader>

        {lowStockAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Low Stock Alerts</h3>
            </div>
            <div className="space-y-1">
              {lowStockAlerts.map((alert: any) => (
                <p key={alert.id} className="text-sm text-red-700">
                  {alert.material} - {alert.color} ({alert.brand}): {alert.currentWeightGrams}g remaining
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Current Stock</h3>
          <Button
            onClick={() => {
              setIsAddingStock(true);
              setEditingStock(null);
              form.reset();
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Filament
          </Button>
        </div>

        {isAddingStock && (
          <Card>
            <CardHeader>
              <CardTitle>{editingStock ? "Edit" : "Add New"} Filament Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="color">Color</Label>
                    <Input {...form.register("color")} placeholder="e.g. White, Black, Red" />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input {...form.register("brand")} placeholder="e.g. eSUN, Hatchbox" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="totalWeightGrams">Total Weight (g)</Label>
                    <Input
                      type="number"
                      {...form.register("totalWeightGrams", { valueAsNumber: true })}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentWeightGrams">Current Weight (g)</Label>
                    <Input
                      type="number"
                      {...form.register("currentWeightGrams", { valueAsNumber: true })}
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lowStockThresholdGrams">Low Stock Threshold (g)</Label>
                    <Input
                      type="number"
                      {...form.register("lowStockThresholdGrams", { valueAsNumber: true })}
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="costPerKg">Cost per KG (optional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register("costPerKg", { valueAsNumber: true })}
                      placeholder="25.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplierInfo">Supplier Info</Label>
                    <Input {...form.register("supplierInfo")} placeholder="Where to reorder" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createStockMutation.isPending || updateStockMutation.isPending}>
                    {editingStock ? "Update" : "Add"} Stock
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddingStock(false);
                      setEditingStock(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {filamentStock.map((stock: any) => {
            const status = getStockStatus(stock.currentWeightGrams, stock.lowStockThresholdGrams);
            const percentageRemaining = (stock.currentWeightGrams / stock.totalWeightGrams) * 100;

            return (
              <Card key={stock.id} className={status === "critical" ? "border-red-300" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {stock.material} - {stock.color}
                        </h4>
                        {stock.brand && <Badge variant="secondary">{stock.brand}</Badge>}
                        {getStockBadge(status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          Weight: {stock.currentWeightGrams}g / {stock.totalWeightGrams}g ({percentageRemaining.toFixed(1)}%)
                        </p>
                        <p>Low stock threshold: {stock.lowStockThresholdGrams}g</p>
                        {stock.costPerKg && <p>Cost per KG: R{stock.costPerKg}</p>}
                        {stock.supplierInfo && <p>Supplier: {stock.supplierInfo}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(stock)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(stock.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filamentStock.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No filament stock yet</h3>
              <p className="text-gray-500">Add your first filament to start tracking inventory!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
