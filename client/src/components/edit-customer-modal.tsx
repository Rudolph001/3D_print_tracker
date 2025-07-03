import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer: any;
}

export function EditCustomerModal({ isOpen, onClose, onSuccess, customer }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsappNumber: "",
    address: "",
    notes: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        whatsappNumber: customer.whatsappNumber || "",
        address: customer.address || "",
        notes: customer.notes || "",
      });
    }
  }, [customer]);

  const updateCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      return await apiRequest(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Customer updated",
        description: "The customer has been successfully updated.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Customer name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.whatsappNumber.trim()) {
      toast({
        title: "Error",
        description: "WhatsApp number is required.",
        variant: "destructive",
      });
      return;
    }

    updateCustomerMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsappNumber" className="text-right">
                WhatsApp*
              </Label>
              <Input
                id="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappNumber: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter WhatsApp number"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter email address"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter customer address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="col-span-3"
                placeholder="Additional notes about the customer"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateCustomerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateCustomerMutation.isPending}
            >
              {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}