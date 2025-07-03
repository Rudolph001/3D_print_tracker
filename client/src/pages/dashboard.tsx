import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/dashboard-stats";
import { OrderCard } from "@/components/order-card";
import { OrderDetails } from "@/components/order-details";
import { ProductCard } from "@/components/product-card";
import { NewOrderModal } from "@/components/new-order-modal";
import { AddProductModal } from "@/components/add-product-modal";
import { EditOrderModal } from "@/components/edit-order-modal";

export default function Dashboard() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ["/api/products"],
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

  const handleDeleteOrder = (orderId: number) => {
    console.log(`Deleting order with ID: ${orderId}`);
    // Implement your delete order logic here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Box className="text-primary text-2xl" />
                <h1 className="text-xl font-bold text-gray-800">3D Print Shop Manager</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsNewOrderModalOpen(true)}
                className="bg-primary hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
              <div className="relative">
                <Button variant="ghost" size="sm" className="p-2 rounded-full">
                  <Bell className="h-5 w-5" />
                </Button>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats />

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Orders List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
                      <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option>All Status</option>
                        <option>Queued</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {orders.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Box className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No orders yet. Create your first order to get started!</p>
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
                  <Button 
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="bg-primary hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {products.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Box className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No products in catalog yet. Add your first product!</p>
                  </div>
                ) : (
                  products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Box className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600">Customer management coming soon</p>
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
    </div>
  );
}