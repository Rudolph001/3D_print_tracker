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
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
      <div className="bg-gradient-to-br from-slate-100 to-blue-50/30 h-48 flex items-center justify-center relative">
        <STLViewer 
          stlUrl={product.stlFileUrl} 
          className="w-full h-full"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 cursor-pointer hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">
          <Expand className="h-4 w-4 text-slate-600" />
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1">{product.name}</h3>
            {product.productCode && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                {product.productCode}
              </span>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(product)}
                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(product.id)}
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {product.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">{product.description}</p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Print Time:</span>
            <span className="font-medium text-slate-700">
              {formatPrintTime(parseFloat(product.estimatedPrintTime))}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Material:</span>
            <span className="font-medium text-slate-700">{product.material}</span>
          </div>
          {product.category && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Category:</span>
              <span className="font-medium text-slate-700">{product.category}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
