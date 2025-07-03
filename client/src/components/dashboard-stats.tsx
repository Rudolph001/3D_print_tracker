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
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Orders</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.activeOrders || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Prints in Queue</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.printsInQueue || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Estimated Hours</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.estimatedHours || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <Hourglass className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Completed Today</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.completedToday || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}