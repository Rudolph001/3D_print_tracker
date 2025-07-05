import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit3, Trash2, AlertTriangle, Package, Weight, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FilamentStockModal } from "@/components/filament-stock-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FilamentStock {
  id: number;
  material: string;
  color: string;
  brand: string;
  currentWeightGrams: number;
  originalWeightGrams: number;
  costPerKg: number;
  lowStockThreshold: number;
  notes?: string;
}

interface MaterialGroup {
  material: string;
  rolls: FilamentStock[];
  totalWeight: number;
  totalValue: number;
  averageFillLevel: number;
  lowStockCount: number;
}

export function FilamentDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<FilamentStock | null>(null);

  const { data: filamentStock = [], isLoading } = useQuery({
    queryKey: ["/api/filament-stock"],
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/filament-stock/alerts"],
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/filament-stock/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/filament-stock/alerts"] });
      toast({
        title: "Filament stock deleted",
        description: "The filament roll has been removed from inventory.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete filament stock",
        description: "There was an error deleting the filament roll.",
        variant: "destructive",
      });
    },
  });

  // Calculate KPI metrics
  const kpiMetrics = {
    totalRolls: filamentStock.length,
    totalWeight: filamentStock.reduce((sum: number, stock: FilamentStock) => sum + stock.currentWeightGrams, 0),
    averageFillLevel: filamentStock.length > 0 
      ? filamentStock.reduce((sum: number, stock: FilamentStock) => 
          sum + (stock.currentWeightGrams / stock.originalWeightGrams * 100), 0) / filamentStock.length
      : 0,
    lowStockAlerts: alerts.length,
    totalValue: filamentStock.reduce((sum: number, stock: FilamentStock) => 
      sum + (stock.currentWeightGrams / 1000 * stock.costPerKg), 0)
  };

  // Group filaments by material
  const materialGroups: MaterialGroup[] = filamentStock.reduce((groups: MaterialGroup[], stock: FilamentStock) => {
    const existingGroup = groups.find(g => g.material === stock.material);
    const fillLevel = (stock.currentWeightGrams / stock.originalWeightGrams) * 100;
    const isLowStock = fillLevel <= stock.lowStockThreshold;
    const value = (stock.currentWeightGrams / 1000) * stock.costPerKg;

    if (existingGroup) {
      existingGroup.rolls.push(stock);
      existingGroup.totalWeight += stock.currentWeightGrams;
      existingGroup.totalValue += value;
      existingGroup.averageFillLevel = existingGroup.rolls.reduce((sum, roll) => 
        sum + (roll.currentWeightGrams / roll.originalWeightGrams * 100), 0) / existingGroup.rolls.length;
      if (isLowStock) existingGroup.lowStockCount++;
    } else {
      groups.push({
        material: stock.material,
        rolls: [stock],
        totalWeight: stock.currentWeightGrams,
        totalValue: value,
        averageFillLevel: fillLevel,
        lowStockCount: isLowStock ? 1 : 0
      });
    }
    return groups;
  }, []);

  const getStatusColor = (fillLevel: number, threshold: number) => {
    if (fillLevel <= threshold * 0.5) return "bg-red-500";
    if (fillLevel <= threshold) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusBadge = (fillLevel: number, threshold: number) => {
    if (fillLevel <= threshold * 0.5) return <Badge variant="destructive">Critical</Badge>;
    if (fillLevel <= threshold) return <Badge variant="secondary" className="bg-yellow-500 text-white">Low</Badge>;
    return <Badge variant="default" className="bg-green-500">Good</Badge>;
  };

  const handleEditStock = (stock: FilamentStock) => {
    setEditingStock(stock);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingStock(null);
  };

  const formatWeight = (grams: number) => {
    if (grams >= 1000) return `${(grams / 1000).toFixed(1)}kg`;
    return `${grams}g`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Filament Inventory</h1>
          <p className="text-gray-600 mt-1">Manage your 3D printing filament stock</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Filament Roll
        </Button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rolls</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiMetrics.totalRolls}</div>
            <p className="text-xs text-muted-foreground">Active spools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatWeight(kpiMetrics.totalWeight)}</div>
            <p className="text-xs text-muted-foreground">Remaining material</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Fill</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiMetrics.averageFillLevel.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all rolls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpiMetrics.lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpiMetrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Current inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Material Groups */}
      <div className="space-y-6">
        {materialGroups.map((group) => (
          <Card key={group.material}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{group.material} Filament</CardTitle>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span>{group.rolls.length} rolls</span>
                    <span>{formatWeight(group.totalWeight)} total</span>
                    <span>{group.averageFillLevel.toFixed(1)}% avg fill</span>
                    <span>{formatCurrency(group.totalValue)} value</span>
                    {group.lowStockCount > 0 && (
                      <span className="text-red-600 font-medium">
                        {group.lowStockCount} low stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {group.rolls.map((stock) => {
                  const fillLevel = (stock.currentWeightGrams / stock.originalWeightGrams) * 100;
                  const rollValue = (stock.currentWeightGrams / 1000) * stock.costPerKg;
                  
                  return (
                    <div
                      key={stock.id}
                      className="group relative border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white"
                    >
                      {/* Visual Filament Roll */}
                      <div className="flex flex-col items-center mb-3">
                        <div className="relative w-16 h-16 border-2 border-gray-300 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="absolute bottom-0 left-0 right-0 transition-all duration-300"
                            style={{
                              height: `${fillLevel}%`,
                              backgroundColor: stock.color.toLowerCase(),
                            }}
                          />
                          {fillLevel <= stock.lowStockThreshold && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <Progress value={fillLevel} className="w-full mt-2 h-2" />
                      </div>

                      {/* Roll Info */}
                      <div className="text-center space-y-1">
                        <h4 className="font-medium text-sm">{stock.color}</h4>
                        <p className="text-xs text-gray-600">{stock.brand}</p>
                        <div className="text-xs space-y-1">
                          <div>{formatWeight(stock.currentWeightGrams)} / {formatWeight(stock.originalWeightGrams)}</div>
                          <div className="font-medium">{fillLevel.toFixed(1)}%</div>
                          <div className="text-green-600">{formatCurrency(rollValue)}</div>
                        </div>
                        {getStatusBadge(fillLevel, stock.lowStockThreshold)}
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditStock(stock)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={() => deleteStockMutation.mutate(stock.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Status Indicator */}
                      <div
                        className={`absolute top-2 left-2 w-2 h-2 rounded-full ${getStatusColor(fillLevel, stock.lowStockThreshold)}`}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filamentStock.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No filament stock found</h3>
            <p className="text-gray-600 mb-4">Start by adding your first filament roll to track inventory.</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Filament Roll
            </Button>
          </CardContent>
        </Card>
      )}

      <FilamentStockModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}