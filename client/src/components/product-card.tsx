import { Button } from "@/components/ui/button";
import { STLViewer } from "./stl-viewer";
import { Expand } from "lucide-react";

interface ProductCardProps {
  product: any;
}

export function ProductCard({ product }: ProductCardProps) {
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
            <p>Print time: {product.estimatedPrintTime}h</p>
            <p>Material: {product.material}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-800">
              R{product.price || "N/A"}
            </p>
            <Button variant="link" className="text-primary hover:text-blue-700 text-sm mt-1 p-0">
              Add to Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
