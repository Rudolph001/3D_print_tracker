import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Phone, Mail, MapPin, User } from "lucide-react";
import { AddCustomerModal } from "@/components/add-customer-modal";
import { EditCustomerModal } from "@/components/edit-customer-modal";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Customers() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiRequest("/api/customers"),
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      await apiRequest(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
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

  const handleAddCustomer = () => {
    setIsAddModalOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleDeleteCustomer = async (customerId: number) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedCustomer(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your customer database</p>
        </div>
        <Button onClick={handleAddCustomer} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers?.map((customer: any) => (
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
      </div>

      {customers?.length === 0 && (
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No customers yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start by adding your first customer to begin managing your customer database.
          </p>
          <Button onClick={handleAddCustomer} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add First Customer
          </Button>
        </div>
      )}

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleModalSuccess}
        customer={selectedCustomer}
      />
    </div>
  );
}