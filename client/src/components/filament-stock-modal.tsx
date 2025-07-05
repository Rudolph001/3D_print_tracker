
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, AlertTriangle, Package, Trash2, Edit, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  quantity: z.number().min(1, "Quantity must be at least 1").optional(),
});

interface FilamentStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Filament Roll Component
const FilamentRoll = ({ 
  percentage, 
  color, 
  material, 
  brand, 
  current, 
  total,
  isLowStock,
  isCritical 
}: {
  percentage: number;
  color: string;
  material: string;
  brand?: string;
  current: number;
  total: number;
  isLowStock: boolean;
  isCritical: boolean;
}) => {
  const getColorClass = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      'white': '#f8fafc',
      'black': '#1e293b',
      'red': '#ef4444',
      'blue': '#3b82f6',
      'green': '#22c55e',
      'yellow': '#eab308',
      'orange': '#f97316',
      'purple': '#a855f7',
      'pink': '#ec4899',
      'gray': '#6b7280',
      'grey': '#6b7280',
      'transparent': '#e2e8f0',
      'natural': '#f1f5f9',
      'clear': '#e2e8f0',
    };
    return colorMap[colorName.toLowerCase()] || '#64748b';
  };

  const filamentColor = getColorClass(color);
  const rollHeight = Math.max(percentage * 0.8, 0.1); // Minimum 10% height for visibility

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Roll Visual */}
      <div className="relative w-16 h-20 flex items-end justify-center">
        {/* Roll Base - Now matches filament color */}
        <div 
          className="w-14 h-16 rounded-lg border-2 relative overflow-hidden shadow-md"
          style={{
            backgroundColor: filamentColor,
            borderColor: filamentColor === '#f8fafc' ? '#e2e8f0' : filamentColor
          }}
        >
          {/* Filament Fill - Darker shade for fill level */}
          <div 
            className="absolute bottom-0 left-0 right-0 rounded-b-lg transition-all duration-300"
            style={{
              height: `${rollHeight * 100}%`,
              backgroundColor: filamentColor,
              opacity: 0.9,
              border: filamentColor === '#f8fafc' ? '1px solid #e2e8f0' : 'none'
            }}
          />
          {/* Roll Core */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white bg-opacity-80 rounded-full border border-gray-400" />
          
          {/* Status Indicator */}
          {isCritical && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
          {isLowStock && !isCritical && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full" />
          )}
        </div>
      </div>

      {/* Roll Info */}
      <div className="text-center">
        <div className="text-xs font-medium text-gray-800">
          {material}
        </div>
        <div className="text-xs text-gray-500">
          {color}
        </div>
        {brand && (
          <div className="text-xs text-gray-400">
            {brand}
          </div>
        )}
        <div className="text-xs font-semibold mt-1">
          {percentage.toFixed(0)}%
        </div>
        <div className="text-xs text-gray-500">
          {(current / 1000).toFixed(1)}kg
        </div>
      </div>
    </div>
  );
};

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
      const quantity = data.quantity || 1;
      
      if (quantity === 1) {
        // Single roll creation
        const { quantity: _, ...stockData } = data;
        return apiRequest("/api/filament-stock", {
          method: "POST",
          body: JSON.stringify(stockData),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // Bulk creation - create multiple rolls
        const { quantity: _, ...stockData } = data;
        const promises = [];
        
        for (let i = 0; i < quantity; i++) {
          promises.push(
            apiRequest("/api/filament-stock", {
              method: "POST",
              body: JSON.stringify(stockData),
              headers: { "Content-Type": "application/json" },
            })
          );
        }
        
        return Promise.all(promises);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsAddingStock(false);
      form.reset();
      
      const quantity = variables.quantity || 1;
      toast({
        title: "Success",
        description: quantity === 1 
          ? "Filament stock added successfully" 
          : `${quantity} filament rolls added successfully`,
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

  // Calculate KPIs
  const totalRolls = filamentStock.length;
  const totalWeight = filamentStock.reduce((sum: number, stock: any) => sum + stock.currentWeightGrams, 0);
  const totalValue = filamentStock.reduce((sum: number, stock: any) => 
    sum + (stock.costPerKg ? (stock.currentWeightGrams / 1000) * stock.costPerKg : 0), 0
  );
  const lowStockCount = filamentStock.filter((stock: any) => 
    getStockStatus(stock.currentWeightGrams, stock.lowStockThresholdGrams) !== "good"
  ).length;
  const averagePercentage = totalRolls > 0 ? 
    filamentStock.reduce((sum: number, stock: any) => 
      sum + (stock.currentWeightGrams / stock.totalWeightGrams), 0
    ) / totalRolls * 100 : 0;

  // Group by material for better organization
  const groupedStock = filamentStock.reduce((groups: any, stock: any) => {
    const material = stock.material;
    if (!groups[material]) {
      groups[material] = [];
    }
    groups[material].push(stock);
    return groups;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Filament Inventory Dashboard
          </DialogTitle>
        </DialogHeader>

        {/* Quick Restock Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Quick Restock</h3>
                <p className="text-xs text-green-600">Add multiple rolls efficiently</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setIsAddingStock(true);
                setEditingStock(null);
                form.reset({ quantity: 10 }); // Default to 10 for bulk operations
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Package className="h-4 w-4 mr-2" />
              Bulk Add Rolls
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-lg font-bold text-green-600">💰</div>
              <div className="text-xs text-gray-600">Cost Efficient</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-lg font-bold text-blue-600">⚡</div>
              <div className="text-xs text-gray-600">Fast Entry</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-lg font-bold text-purple-600">📦</div>
              <div className="text-xs text-gray-600">Bulk Orders</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-lg font-bold text-orange-600">📊</div>
              <div className="text-xs text-gray-600">Auto Tracking</div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalRolls}</div>
              <div className="text-sm text-blue-700">Total Rolls</div>
              <Package className="h-6 w-6 mx-auto mt-2 text-blue-500" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{(totalWeight / 1000).toFixed(1)}kg</div>
              <div className="text-sm text-green-700">Total Weight</div>
              <TrendingUp className="h-6 w-6 mx-auto mt-2 text-green-500" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{averagePercentage.toFixed(0)}%</div>
              <div className="text-sm text-purple-700">Avg. Fill Level</div>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${averagePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
              <div className="text-sm text-orange-700">Low Stock</div>
              <AlertTriangle className="h-6 w-6 mx-auto mt-2 text-orange-500" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">R{totalValue.toFixed(0)}</div>
              <div className="text-sm text-emerald-700">Total Value</div>
              <TrendingUp className="h-6 w-6 mx-auto mt-2 text-emerald-500" />
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Low Stock Alerts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockAlerts.map((alert: any) => (
                <div key={alert.id} className="bg-white p-3 rounded border border-red-200">
                  <div className="font-medium text-red-800">
                    {alert.material} - {alert.color}
                  </div>
                  <div className="text-sm text-red-600">
                    {alert.brand && `${alert.brand} • `}
                    {alert.currentWeightGrams}g remaining
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Filament Inventory</h3>
            <p className="text-sm text-gray-500">Manage individual rolls and bulk operations</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setIsAddingStock(true);
                setEditingStock(null);
                form.reset();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filament Roll(s)
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {isAddingStock && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingStock ? "Edit" : "Add New"} Filament Roll</CardTitle>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <Label htmlFor="quantity" className="text-blue-800 font-semibold">🎯 Bulk Add Quantity</Label>
                    <Input
                      type="number"
                      {...form.register("quantity", { valueAsNumber: true })}
                      placeholder="1"
                      min="1"
                      max="100"
                      defaultValue={1}
                      className="mt-2 border-blue-300 focus:border-blue-500"
                    />
                    <div className="bg-blue-100 rounded-md p-2 mt-2">
                      <p className="text-xs text-blue-700 font-medium">
                        💡 Add up to 100 rolls of the same material/color at once
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Each roll will be created as a separate inventory item for individual tracking
                      </p>
                    </div>
                  </div>
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

                {/* Quick Quantity Presets */}
                {!editingStock && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Quick Bulk Presets:</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[1, 5, 10, 20, 50].map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("quantity", preset)}
                          className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                        >
                          {preset} roll{preset > 1 ? 's' : ''}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createStockMutation.isPending || updateStockMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createStockMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {form.watch("quantity") > 1 ? `Adding ${form.watch("quantity")} Rolls...` : "Adding Roll..."}
                      </>
                    ) : (
                      <>
                        {editingStock ? "Update" : "Add"} {form.watch("quantity") > 1 ? `${form.watch("quantity")} Rolls` : "Roll"}
                      </>
                    )}
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

        {/* Filament Rolls Display */}
        {Object.keys(groupedStock).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedStock).map(([material, stocks]: [string, any]) => (
              <Card key={material}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    {material} Filament ({stocks.length} roll{stocks.length > 1 ? 's' : ''})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 mb-4">
                    {stocks.map((stock: any) => {
                      const percentage = (stock.currentWeightGrams / stock.totalWeightGrams) * 100;
                      const status = getStockStatus(stock.currentWeightGrams, stock.lowStockThresholdGrams);
                      const isLowStock = status === "low";
                      const isCritical = status === "critical";

                      return (
                        <div key={stock.id} className="relative">
                          <FilamentRoll
                            percentage={percentage}
                            color={stock.color}
                            material={stock.material}
                            brand={stock.brand}
                            current={stock.currentWeightGrams}
                            total={stock.totalWeightGrams}
                            isLowStock={isLowStock}
                            isCritical={isCritical}
                          />
                          
                          {/* Action Buttons */}
                          <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-white shadow-sm border"
                              onClick={() => handleEdit(stock)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-white shadow-sm border text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(stock.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Detailed Info on Hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                              {stock.currentWeightGrams}g / {stock.totalWeightGrams}g
                              {stock.costPerKg && <div>R{((stock.currentWeightGrams / 1000) * stock.costPerKg).toFixed(2)}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Material Summary */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Total Rolls</div>
                        <div className="text-lg font-semibold">{stocks.length}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Total Weight</div>
                        <div className="text-lg font-semibold">
                          {(stocks.reduce((sum: number, s: any) => sum + s.currentWeightGrams, 0) / 1000).toFixed(1)}kg
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Avg. Fill Level</div>
                        <div className="text-lg font-semibold">
                          {(stocks.reduce((sum: number, s: any) => sum + (s.currentWeightGrams / s.totalWeightGrams), 0) / stocks.length * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Total Value</div>
                        <div className="text-lg font-semibold">
                          R{stocks.reduce((sum: number, s: any) => 
                            sum + (s.costPerKg ? (s.currentWeightGrams / 1000) * s.costPerKg : 0), 0
                          ).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No filament stock yet</h3>
            <p className="text-gray-500 mb-4">Add your first filament roll to start tracking inventory!</p>
            <Button 
              onClick={() => {
                setIsAddingStock(true);
                setEditingStock(null);
                form.reset();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Roll
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
