import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, MapPin, Package, User, Hash } from "lucide-react";
import { Warehouse } from "@/hooks/useWarehouses";

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
  onSave: (warehouseData: any) => Promise<void>;
  loading: boolean;
}

export const WarehouseDialog: React.FC<WarehouseDialogProps> = ({
  open,
  onOpenChange,
  warehouse,
  onSave,
  loading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: '',
    manager_id: '',
    street: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || '',
        code: warehouse.code || '',
        capacity: warehouse.capacity?.toString() || '',
        manager_id: warehouse.manager_id || '',
        street: warehouse.address?.street || '',
        city: warehouse.address?.city || '',
        state: warehouse.address?.state || '',
        country: warehouse.address?.country || 'India',
        postal_code: warehouse.address?.postal_code || '',
        active: warehouse.active ?? true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        capacity: '',
        manager_id: '',
        street: '',
        city: '',
        state: '',
        country: 'India',
        postal_code: '',
        active: true,
      });
    }
    setErrors({});
  }, [warehouse, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Warehouse name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Warehouse code is required';
    }

    if (formData.capacity && isNaN(Number(formData.capacity))) {
      newErrors.capacity = 'Capacity must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const warehouseData = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      manager_id: formData.manager_id.trim() || undefined,
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postal_code: formData.postal_code.trim(),
      },
      active: formData.active,
    };

    try {
      await onSave(warehouseData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving warehouse:', error);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            {warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
          </DialogTitle>
          <DialogDescription>
            {warehouse ? 'Update warehouse information' : 'Create a new warehouse for your inventory'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Hash className="w-4 h-4 mr-2" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="Main Warehouse"
                />
                {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Warehouse Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => updateFormData('code', e.target.value.toUpperCase())}
                  className={errors.code ? 'border-red-500' : ''}
                  placeholder="WH-001"
                />
                {errors.code && <span className="text-red-500 text-sm">{errors.code}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (units)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => updateFormData('capacity', e.target.value)}
                  className={errors.capacity ? 'border-red-500' : ''}
                  placeholder="10000"
                />
                {errors.capacity && <span className="text-red-500 text-sm">{errors.capacity}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager_id">Manager ID</Label>
                <Input
                  id="manager_id"
                  value={formData.manager_id}
                  onChange={(e) => updateFormData('manager_id', e.target.value)}
                  placeholder="manager-123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.active.toString()}
                onValueChange={(value) => updateFormData('active', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Address Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Textarea
                id="street"
                value={formData.street}
                onChange={(e) => updateFormData('street', e.target.value)}
                placeholder="123 Business Street"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  placeholder="Mumbai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => updateFormData('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map(state => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                  placeholder="India"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateFormData('postal_code', e.target.value)}
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (warehouse ? 'Update Warehouse' : 'Create Warehouse')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};