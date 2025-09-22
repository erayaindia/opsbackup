import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Building, User, Mail, Phone, MapPin, FileText, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Vendor } from '@/hooks/useSuppliers';

interface EditVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorUpdated: () => void;
  vendor: Vendor | null;
}

export function EditVendorDialog({
  open,
  onOpenChange,
  onVendorUpdated,
  vendor
}: EditVendorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    payment_terms: '',
    status: 'active'
  });

  // Populate form when vendor changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        gstin: vendor.gstin || '',
        contact_person: vendor.contact_person || '',
        contact_email: vendor.contact_email || '',
        contact_phone: vendor.contact_phone || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        country: vendor.country || 'India',
        postal_code: vendor.postal_code || '',
        payment_terms: vendor.payment_terms || '',
        status: vendor.status || 'active'
      });
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendor) {
      toast.error('No vendor selected for editing');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('vendors')
        .update({
          name: formData.name.trim(),
          gstin: formData.gstin.trim() || null,
          contact_person: formData.contact_person.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          country: formData.country.trim() || null,
          postal_code: formData.postal_code.trim() || null,
          payment_terms: formData.payment_terms.trim() || null,
          status: formData.status,
          is_active: formData.status === 'active'
        })
        .eq('id', vendor.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Vendor updated successfully');
      onVendorUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
    'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu',
    'Lakshadweep'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Edit Vendor: {vendor?.name}
          </DialogTitle>
          <DialogDescription>
            Update the vendor information below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building className="h-4 w-4" />
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Vendor Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter vendor name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-gstin">GSTIN</Label>
                <Input
                  id="edit-gstin"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="edit-contact_person">Contact Person</Label>
              <Input
                id="edit-contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="Primary contact person name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contact_email">Email</Label>
                <Input
                  id="edit-contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="vendor@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-contact_phone">Phone</Label>
                <Input
                  id="edit-contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleInputChange('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-postal_code">Postal Code</Label>
                <Input
                  id="edit-postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="400001"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Business Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="edit-payment_terms">Payment Terms</Label>
              <Select
                value={formData.payment_terms}
                onValueChange={(value) => handleInputChange('payment_terms', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 15">Net 15 days</SelectItem>
                  <SelectItem value="Net 30">Net 30 days</SelectItem>
                  <SelectItem value="Net 45">Net 45 days</SelectItem>
                  <SelectItem value="Net 60">Net 60 days</SelectItem>
                  <SelectItem value="COD">Cash on Delivery</SelectItem>
                  <SelectItem value="Advance">Advance Payment</SelectItem>
                  <SelectItem value="Custom">Custom Terms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Vendor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}