import { Button } from "@/components/ui/button";
import { STLViewer } from "./stl-viewer";
import { Expand, Edit, Trash2 } from "lucide-react";
import { formatPrintTime } from "@/lib/time-utils";

interface ProductCardProps {
  product: any;
  onEdit?: (product: any) => void;
  onDelete?: (productId: number) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-gray-100 h-48 flex items-center justify-center relative">
        <STLViewer 
          stlUrl={product.stlFileUrl} 
          className="w-full h-full"
        />
        <div className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 cursor-pointer hover:bg-opacity-100">
          <Expand className="h-4 w-4 text-gray-600" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Print time: {formatPrintTime(parseFloat(product.estimatedPrintTime))}</p>
            <p>Material: {product.material}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-800">
              R{product.price || "N/A"}
            </p>
            <div className="flex gap-1 justify-end mt-2">
              {onEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEdit(product)}
                  className="text-xs px-2 py-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onDelete(product.id)}
                  className="text-xs px-2 py-1"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
