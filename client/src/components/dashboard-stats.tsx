import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Clock, Hourglass, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardStats() {
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="bg-gray-200 p-3 rounded-full h-12 w-12"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.activeOrders || 0}</p>
            </div>
            <div className="bg-primary bg-opacity-10 p-3 rounded-full">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Prints in Queue</p>
              <p className="text-2xl font-bold text-gray-800">{stats.printsInQueue || 0}</p>
            </div>
            <div className="bg-warning bg-opacity-10 p-3 rounded-full">
              <Clock className="h-6 w-6 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estimated Hours</p>
              <p className="text-2xl font-bold text-gray-800">{stats.estimatedHours || 0}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Hourglass className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-800">{stats.completedToday || 0}</p>
            </div>
            <div className="bg-success bg-opacity-10 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
