import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Box, Clock, MessageCircle, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

interface OrderCardProps {
  order: any;
  onClick: () => void;
  isSelected: boolean;
  getStatusColor: (status: string) => string;
  getStatusBgColor: (status: string) => string;
  onEdit?: (orderId: number) => void;
  onDelete?: (orderId: number) => void;
  onUpdate?: (orderId: number) => void;
}

export function OrderCard({ order, onClick, isSelected, getStatusColor, getStatusBgColor, onEdit, onDelete, onUpdate }: OrderCardProps) {
  const completedPrints = order.prints?.filter((print: any) => print.status === "completed").length || 0;
  const totalPrints = order.prints?.length || 0;
  const progress = totalPrints > 0 ? (completedPrints / totalPrints) * 100 : 0;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "queued": return "Queued";
      default: return status;
    }
  };

  return (
    <div 
      className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-l-4 border-l-primary' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
            <span className="text-primary font-semibold text-xs">#{order.id}</span>
          </div>
          <div>
            <p className="font-medium text-gray-800">{order.customer?.name}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(order.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${getStatusBgColor(order.status)} ${getStatusColor(order.status)} font-medium`}>
            {getStatusLabel(order.status)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onClick()}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit(order.id);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(order.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress: {completedPrints} of {totalPrints} prints completed</span>
          <span>{order.totalEstimatedTime || 0}h remaining</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            <Box className="h-4 w-4 inline mr-1" />
            {totalPrints} prints
          </span>
          <span className="text-sm text-gray-600">
            <Clock className="h-4 w-4 inline mr-1" />
            {order.totalEstimatedTime || 0}h total
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            className={`${order.status === 'completed' ? 'bg-success hover:bg-green-600' : 'bg-primary hover:bg-blue-700'} text-white`}
            onClick={(e) => {
              e.stopPropagation();
              if (onUpdate) {
                onUpdate(order.id);
              }
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {order.status === 'completed' ? 'Notified' : 'Update'}
          </Button>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
