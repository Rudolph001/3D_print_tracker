
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Palette, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderFilamentRequirementsProps {
  orderId: number;
}

export function OrderFilamentRequirements({ orderId }: OrderFilamentRequirementsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: requirements } = useQuery({
    queryKey: [`/api/orders/${orderId}/filament-requirements`],
    enabled: !!orderId,
  });

  const { data: filamentStock = [] } = useQuery({
    queryKey: ["/api/filament-stock"],
  });

  if (!requirements || Object.keys(requirements).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Filament Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No filament requirements calculated. Add filament data to products to see requirements.
          </p>
        </CardContent>
      </Card>
    );
  }

  const checkStockAvailability = (material: string, requiredWeight: number) => {
    const availableStock = filamentStock
      .filter((stock: any) => stock.material === material)
      .reduce((total: number, stock: any) => total + stock.currentWeightGrams, 0);
    
    return {
      available: availableStock,
      sufficient: availableStock >= requiredWeight,
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Filament Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(requirements).map(([material, req]: [string, any]) => {
          const stockCheck = checkStockAvailability(material, req.weight);
          
          return (
            <div key={material} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{material}</span>
                  {stockCheck.sufficient ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <p>Required: {req.weight.toFixed(1)}g ({req.length.toFixed(2)}m)</p>
                  <p>Available: {stockCheck.available.toFixed(1)}g</p>
                </div>
              </div>
              <Badge 
                variant={stockCheck.sufficient ? "default" : "destructive"}
                className="text-xs"
              >
                {stockCheck.sufficient ? "✓ Sufficient" : "⚠ Insufficient"}
              </Badge>
            </div>
          );
        })}
        
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">
            💡 Tip: These calculations are based on the filament data in your product catalog
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
