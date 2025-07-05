import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Users, Clock, Package, TrendingUp, Box, Download, Bell, Edit, Trash2, Phone, Mail, MapPin, User, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardStats } from "@/components/dashboard-stats";
import { OrderCard } from "@/components/order-card";
import { OrderDetails } from "@/components/order-details";
import { ProductCard } from "@/components/product-card";
import { NewOrderModal } from "@/components/new-order-modal";
import { AddProductModal } from "@/components/add-product-modal";
import { EditOrderModal } from "@/components/edit-order-modal";
import { EditProductModal } from "@/components/edit-product-modal";
import { AddCustomerModal } from "@/components/add-customer-modal";
import { EditCustomerModal } from "@/components/edit-customer-modal";
import { FilamentStockModal } from "@/components/filament-stock-modal";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import React from "react";

// Enhanced Filament Dashboard Component
const EnhancedFilamentDashboard = ({ isFilamentStockModalOpen, setIsFilamentStockModalOpen }: any) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingStock, setEditingStock] = React.useState<any | null>(null);

  const { data: filamentStock = [], isLoading } = useQuery({
    queryKey: ["/api/filament-stock"],
    refetchInterval: 5000, // Refresh every 5 seconds to show real-time updates
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/filament-stock/alerts"],
    refetchInterval: 10000, // Check for alerts every 10 seconds
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
    totalWeight: filamentStock.reduce((sum: number, stock: any) => sum + stock.currentWeightGrams, 0),
    averageFillLevel: filamentStock.length > 0 
      ? filamentStock.reduce((sum: number, stock: any) => 
          sum + (stock.currentWeightGrams / stock.originalWeightGrams * 100), 0) / filamentStock.length
      : 0,
    lowStockAlerts: alerts.length,
    totalValue: filamentStock.reduce((sum: number, stock: any) => 
      sum + (stock.currentWeightGrams / 1000 * stock.costPerKg), 0)
  };

  // Group filaments by material
  const materialGroups = filamentStock.reduce((groups: any[], stock: any) => {
    const existingGroup = groups.find(g => g.material === stock.material);
    const fillLevel = (stock.currentWeightGrams / stock.originalWeightGrams) * 100;
    const isLowStock = fillLevel <= stock.lowStockThreshold;
    const value = (stock.currentWeightGrams / 1000) * stock.costPerKg;

    if (existingGroup) {
      existingGroup.rolls.push(stock);
      existingGroup.totalWeight += stock.currentWeightGrams;
      existingGroup.totalValue += value;
      existingGroup.averageFillLevel = existingGroup.rolls.reduce((sum: number, roll: any) => 
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

  const handleEditStock = (stock: any) => {
    setEditingStock(stock);
    setIsFilamentStockModalOpen(true);
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
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Filament Inventory</h2>
          <p className="text-gray-600 mt-1">Manage your 3D printing filament stock</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/filament-stock"] });
              queryClient.invalidateQueries({ queryKey: ["/api/filament-stock/alerts"] });
            }} 
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsFilamentStockModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Filament Roll
          </Button>
        </div>
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
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpiMetrics.lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpiMetrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Current inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Material Groups */}
      <div className="space-y-6">
        {materialGroups.map((group: any) => (
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
                {group.rolls.map((stock: any) => {
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
                          <Edit className="h-3 w-3" />
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
            <Button onClick={() => setIsFilamentStockModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Filament Roll
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [isFilamentStockModalOpen, setIsFilamentStockModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    time: string;
    type: 'order' | 'print' | 'stock';
    read: boolean;
    data?: any;
  }>>([]);

  // Close notifications when clicking outside
  const notificationRef = useRef<HTMLDivElement>(null);

  // Data queries - moved to top to be available before use in effects
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: filamentAlerts = [] } = useQuery({
    queryKey: ["/api/filament-stock/alerts"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Generate notifications from recent data
  React.useEffect(() => {
    if (!orders || !Array.isArray(orders)) return;

    const newNotifications: any[] = [];

    // Recent orders (last 24 hours)
    orders.forEach((order: any) => {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const diffHours = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);

      if (diffHours <= 24) {
        const diffMinutes = Math.floor(diffHours * 60);
        let timeAgo = '';

        if (diffMinutes < 60) {
        timeAgo = `${diffMinutes} minutes ago`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      }

      newNotifications.push({
          id: `order-${order.id}`,
          message: `New order received from ${order.customer?.name || 'Customer'}`,
          time: timeAgo,
          type: 'order',
          read: false,
          data: order
        });
      }
    });

    // Completed prints (last 24 hours)
    orders.forEach((order: any) => {
      order.prints?.forEach((print: any) => {
        if (print.status === 'completed' && print.updatedAt) {
          const printDate = new Date(print.updatedAt);
          const now = new Date();
          const diffHours = (now.getTime() - printDate.getTime()) / (1000 * 60 * 60);

          if (diffHours <= 24) {
            const diffMinutes = Math.floor(diffHours * 60);
            let timeAgo = '';

            if (diffMinutes < 60) {
              timeAgo = `${diffMinutes} minutes ago`;
            } else {
              const hours = Math.floor(diffMinutes / 60);
              timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
            }

            newNotifications.push({
              id: `print-${print.id}`,
              message: `Print "${print.name}" completed successfully`,
              time: timeAgo,
              type: 'print',
              read: false,
              data: { print, order }
            });
          }
        }
      });
    });

    // Low stock alerts
    if (filamentAlerts && Array.isArray(filamentAlerts)) {
      filamentAlerts.forEach((alert: any) => {
        newNotifications.push({
          id: `stock-${alert.id}`,
          message: `Low filament warning - ${alert.brand} ${alert.color}`,
          time: alert.currentWeight <= alert.lowStockThreshold * 0.5 ? 'Critical' : 'Warning',
          type: 'stock',
          read: false,
          data: alert
        });
      });
    }

    // Sort by most recent first and limit to 10
    newNotifications.sort((a, b) => {
      if (a.type === 'stock' && b.type !== 'stock') return -1;
      if (b.type === 'stock' && a.type !== 'stock') return 1;
      return 0;
    });

    setNotifications(newNotifications.slice(0, 10));
  }, [orders?.length, filamentAlerts?.length]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return '📋';
      case 'print': return '✅';
      case 'stock': return '⚠️';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-500';
      case 'print': return 'bg-green-500';
      case 'stock': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Update notifications when alerts change
  React.useEffect(() => {
    if (filamentAlerts && Array.isArray(filamentAlerts)) {
      setShowNotifications(filamentAlerts.length > 0);
    }
  }, [filamentAlerts?.length]);

  // Close notifications when clicking outside
  React.useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.relative')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const selectedOrder = (orders as any[]).find((order: any) => order.id === selectedOrderId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-success";
      case "in_progress": return "text-warning";
      case "queued": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success bg-opacity-10";
      case "in_progress": return "bg-warning bg-opacity-10";
      case "queued": return "bg-gray-100";
      default: return "bg-gray-100";
    }
  };

  // Placeholder functions for edit and delete
  const handleEditOrder = (orderId: number) => {
    const orderToEdit = (orders as any[]).find((order: any) => order.id === orderId);
    if (orderToEdit) {
      setEditingOrder(orderToEdit);
      setIsEditOrderModalOpen(true);
    } else {
      console.log(`Order with ID: ${orderId} not found`);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await apiRequest(`/api/orders/${orderId}`, { method: "DELETE" });
        refetchOrders();
        setSelectedOrderId(null);
        toast({
          title: "Success",
          description: "Order deleted successfully",
        });
      } catch (error) {
        console.error('Failed to delete order:', error);
        toast({
          title: "Error",
          description: "Failed to delete order. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateOrder = async (orderId: number) => {
    try {
      const order = orders.find((o: any) => o.id === orderId);
      if (!order) return;

      // If order is completed, send WhatsApp notification
      if (order.status === 'completed') {
        await handleSendWhatsAppNotification(orderId);
        return;
      }

      let newStatus = 'completed';
      if (order.status === 'queued') {
        newStatus = 'in_progress';
      } else if (order.status === 'in_progress') {
        newStatus = 'completed';
      }

      await apiRequest(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
        headers: { "Content-Type": "application/json" }
      });

      refetchOrders();
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Failed to update order:', error);
      toast({
        title: "Error", 
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsAppNotification = async (orderId: number) => {
    try {
      const order = orders.find((o: any) => o.id === orderId);
      if (!order) return;

      if (!order.customer?.whatsappNumber) {
        toast({
          title: "Error",
          description: "Customer has no WhatsApp number.",
          variant: "destructive",
        });
        return;
      }

      // Generate status message with order details
      const completedPrints = order.prints?.filter((p: any) => p.status === 'completed').length || 0;
      const totalPrints = order.prints?.length || 0;
      
      let message = `Hello ${order.customer.name}! 👋\n\n`;
      message += `📦 *ORDER UPDATE*\n`;
      message += `Order #: ${order.orderNumber}\n`;
      message += `Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}\n`;
      message += `Progress: ${completedPrints}/${totalPrints} prints completed\n\n`;

      // Add order summary
      if (order.prints && order.prints.length > 0) {
        message += `📋 *ORDER SUMMARY*\n`;
        order.prints.forEach((print: any, index: number) => {
          const statusEmoji = print.status === 'completed' ? '✅' : 
                            print.status === 'printing' ? '🔄' : 
                            print.status === 'in_progress' ? '🔄' : '⏳';
          message += `${index + 1}. ${print.name} ${statusEmoji}\n`;
        });
        message += `\n`;
      }

      if (order.status === 'completed') {
        message += `🎉 Great news! Your order is now complete and ready for pickup.\n\n`;
      } else if (order.status === 'in_progress') {
        message += `🔄 Your order is currently being printed. We'll keep you updated!\n\n`;
      } else if (order.status === 'queued') {
        message += `⏳ Your order is in our queue and will start printing soon.\n\n`;
      }

      message += `Thank you for choosing our 3D printing service! 🚀`;

      // Send WhatsApp message
      const response = await apiRequest("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          message: message
        })
      });

      // Open WhatsApp with the generated link
      if (response.whatsappLink) {
        window.open(response.whatsappLink, '_blank');
        
        // Also open the PDF report in a new tab for easy manual sharing
        setTimeout(() => {
          if (response.downloadUrl) {
            window.open(response.downloadUrl, '_blank');
          }
        }, 1000);
      }

      toast({
        title: "WhatsApp notification sent!",
        description: "Opening WhatsApp message and PDF report. You can manually share the PDF if needed.",
      });

      refetchOrders();
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      toast({
        title: "Failed to send notification",
        description: "Could not send WhatsApp message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsEditProductModalOpen(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await apiRequest(`/api/products/${productId}`, { method: "DELETE" });
        refetchProducts();
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
      } catch (error) {
        console.error('Failed to delete product:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setIsEditCustomerModalOpen(true);
  };

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      await apiRequest(`/api/customers/${customerId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteCustomer = async (customerId: number) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-md">
                  <Box className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">3D Print Shop</h1>
                  <p className="text-xs text-slate-500 -mt-1">Professional Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setIsNewOrderModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative p-2 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5 text-slate-600" />
                </Button>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-lg">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
                {showNotifications && (
                  <div ref={notificationRef} className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="text-xs text-gray-500">
                          {notifications.filter(n => !n.read).length} unread
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <div className="text-2xl mb-2">🔔</div>
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                              notification.read ? 'opacity-60' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                              {!notification.read && (
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getNotificationColor(notification.type)}`}></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <div className="p-3 border-t border-gray-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={markAllAsRead}
                        >
                          Mark all as read
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <DashboardStats />
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm shadow-md border border-slate-200/50 rounded-xl p-1">
            <TabsTrigger 
              value="orders" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="products" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
            >
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="customers" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
            >
              Customers
            </TabsTrigger>
            <TabsTrigger 
              value="filament" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg font-medium transition-all duration-200"
            >
              Filament
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Orders List */}
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
                  <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-800">Recent Orders</h2>
                      <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                        <option>All Status</option>
                        <option>Queued</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200/50">
                    {(orders as any[]).length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <Box className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">No orders yet</h3>
                        <p className="text-slate-500">Create your first order to get started!</p>
                      </div>
                    ) : (
                      orders.map((order: any) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onClick={() => setSelectedOrderId(order.id)}
                          isSelected={selectedOrderId === order.id}
                          getStatusColor={getStatusColor}
                          getStatusBgColor={getStatusBgColor}
                          onEdit={handleEditOrder}
                          onDelete={handleDeleteOrder}
                          onUpdate={handleUpdateOrder}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="lg:col-span-1">
                {selectedOrder ? (
                  <OrderDetails
                    order={selectedOrder}
                    onUpdate={refetchOrders}
                    onEdit={handleEditOrder}
                    onDelete={handleDeleteOrder}
                    getStatusColor={getStatusColor}
                    getStatusBgColor={getStatusBgColor}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-gray-400 mb-4">
                      <Box className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-600">Select an order to view details</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Product Catalog</h2>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open('/api/products/catalog/pdf', '_blank')}
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF Catalog
                    </Button>
                    <Button 
                      onClick={() => setIsAddProductModalOpen(true)}
                      className="bg-primary hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {(products as any[]).length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No products yet</h3>
                    <p className="text-slate-500">Add your first product to the catalog!</p>
                  </div>
                ) : (
                  products.map((product: any) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Customer Database</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your customer relationships</p>
                  </div>
                  <Button 
                    onClick={() => setIsAddCustomerModalOpen(true)} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-6">
                {(customers as any[])?.map((customer: any) => (
                <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {customer.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {customer.whatsappNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {customer.whatsappNumber}
                        <Badge variant="secondary" className="text-xs">
                          WhatsApp
                        </Badge>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        {customer.email}
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        Created: {format(new Date(customer.createdAt), "MMM d, yyyy")}
                      </div>
                      {customer.updatedAt && customer.updatedAt !== customer.createdAt && (
                        <div className="text-xs text-gray-500">
                          Updated: {format(new Date(customer.updatedAt), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

                {(customers as any[])?.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No customers yet</h3>
                    <p className="text-slate-500 mb-4">Start by adding your first customer to begin managing your database.</p>
                    <Button onClick={() => setIsAddCustomerModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Customer
                    </Button>
                </div>
              )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filament" className="space-y-6">
            <EnhancedFilamentDashboard 
              isFilamentStockModalOpen={isFilamentStockModalOpen}
              setIsFilamentStockModalOpen={setIsFilamentStockModalOpen}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* New Order Modal */}
      <NewOrderModal 
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSuccess={() => {
          setIsNewOrderModalOpen(false);
          refetchOrders();
        }}
      />

      <EditOrderModal 
        isOpen={isEditOrderModalOpen}
        onClose={() => {
          setIsEditOrderModalOpen(false);
          setEditingOrder(null);
        }}
        onSuccess={() => {
          setIsEditOrderModalOpen(false);
          setEditingOrder(null);
          refetchOrders();
        }}
        order={editingOrder}
      />

      <AddProductModal 
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSuccess={() => {
          setIsAddProductModalOpen(false);
          refetchProducts();
        }}
      />

      <EditProductModal 
        isOpen={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
          refetchProducts();
        }}
        product={editingProduct}
      />

      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onSuccess={() => {
          setIsAddCustomerModalOpen(false);
          refetchCustomers();
        }}
      />

      <EditCustomerModal
        isOpen={isEditCustomerModalOpen}
        onClose={() => {
          setIsEditCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        onSuccess={() => {
          setIsEditCustomerModalOpen(false);
          setEditingCustomer(null);
          refetchCustomers();
        }}
        customer={editingCustomer}
      />

      <FilamentStockModal
        isOpen={isFilamentStockModalOpen}
        onClose={() => setIsFilamentStockModalOpen(false)}
      />
    </div>
  );
}