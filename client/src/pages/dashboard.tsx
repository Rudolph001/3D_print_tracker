import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Users, Clock, Package, TrendingUp, Box, Download, Bell, Edit, Trash2, Phone, Mail, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import React from "react";

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
  const [showNotifications, setShowNotifications] = useState(false);

  // Close notifications when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.relative')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const selectedOrder = orders.find((order: any) => order.id === selectedOrderId);

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
    const orderToEdit = orders.find((order: any) => order.id === orderId);
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
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-lg">
                  3
                </span>
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">New order received from Von Beneke</p>
                            <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">Print job completed successfully</p>
                            <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">Low filament warning - PLA White</p>
                            <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-center text-blue-600 hover:bg-blue-50"
                        onClick={() => setShowNotifications(false)}
                      >
                        Mark all as read
                      </Button>
                    </div>
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
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm shadow-md border border-slate-200/50 rounded-xl p-1">
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
    </div>
  );
}