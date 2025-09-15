import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, RefreshCw, Upload, Dice1, RotateCw, Camera, Trash2, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useVendors } from '@/hooks/useSuppliers';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useCategories } from '@/hooks/useCategories';

interface InventoryProductData {
  id?: string;
  product_name: string;
  product_image_url?: string;
  product_category: string;
  sku: string;
  barcode?: string;
  cost: number;
  price: number;
  vendor_name: string;
  vendor_contact?: string;
  warehouse_location: string;
  on_hand_qty: number;
  allocated_qty: number;
  min_stock_level: number;
  reorder_point: number;
  reorder_quantity: number;
  attributes?: Record<string, any>;
  notes?: string;
}

interface InventoryProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItem?: InventoryProductData | null;
  onSubmit: (data: InventoryProductData) => Promise<void>;
  loading?: boolean;
}

export function InventoryProductModal({
  open,
  onOpenChange,
  inventoryItem,
  onSubmit,
  loading = false
}: InventoryProductModalProps) {
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors();
  const { warehouses } = useWarehouses();
  const { allCategories, loading: categoriesLoading } = useCategories();

  const [formData, setFormData] = useState<InventoryProductData>({
    product_name: '',
    product_image_url: '',
    product_category: 'Uncategorized',
    sku: '',
    barcode: '',
    cost: '' as any,
    price: '' as any,
    vendor_name: '',
    vendor_contact: '',
    warehouse_location: 'Main Warehouse',
    on_hand_qty: '' as any,
    allocated_qty: '' as any,
    min_stock_level: '' as any,
    reorder_point: '' as any,
    reorder_quantity: '' as any,
    attributes: {},
    notes: ''
  });

  // Get categories from database, with fallback to default if none exist
  const availableCategories = allCategories.length > 0
    ? allCategories.map(cat => cat.name)
    : ['Uncategorized'];

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (inventoryItem) {
        // Edit mode
        setFormData(inventoryItem);
      } else {
        // Create mode - reset form
        setFormData({
          product_name: '',
          product_image_url: '',
          product_category: 'Uncategorized',
          sku: '',
          barcode: '',
          cost: '' as any,
          price: '' as any,
          vendor_name: '',
          vendor_contact: '',
          warehouse_location: 'Main Warehouse',
          on_hand_qty: '' as any,
          allocated_qty: '' as any,
          min_stock_level: '' as any,
          reorder_point: '' as any,
          reorder_quantity: '' as any,
          attributes: {},
          notes: ''
        });

        // Auto-generate SKU for new items
        setTimeout(() => {
          generateSKU();
        }, 100);
      }
    }
  }, [open, inventoryItem]);

  const handleInputChange = (field: keyof InventoryProductData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSKU = async () => {
    try {
      // Try to get next sequential SKU from database function
      const { data, error } = await supabase.rpc('generate_inventory_sku');

      if (error || !data) {
        // Fallback to random/timestamp based SKU
        const randomPart = Math.floor(Math.random() * 9000) + 1000;
        const timestamp = Date.now().toString().slice(-4);
        const fallbackSku = `ERPR-${randomPart}${timestamp}`;

        setFormData(prev => ({
          ...prev,
          sku: fallbackSku
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          sku: data
        }));
      }
    } catch (error) {
      console.error('Error generating SKU:', error);
      // Ultimate fallback
      const randomSku = `ERPR-${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`;
      setFormData(prev => ({
        ...prev,
        sku: randomSku
      }));
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `inventory-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        product_image_url: data.publicUrl
      }));

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.product_name.trim()) {
      alert('Product name is required');
      return;
    }

    if (!formData.sku.trim()) {
      alert('SKU is required');
      return;
    }

    if (!formData.vendor_name.trim()) {
      alert('Vendor name is required');
      return;
    }

    try {
      // Convert string values to numbers before submitting
      const submissionData = {
        ...formData,
        cost: parseFloat(formData.cost as string) || 0,
        price: parseFloat(formData.price as string) || 0,
        on_hand_qty: parseInt(formData.on_hand_qty as string) || 0,
        allocated_qty: parseInt(formData.allocated_qty as string) || 0,
        min_stock_level: parseInt(formData.min_stock_level as string) || 0,
        reorder_point: parseInt(formData.reorder_point as string) || 0,
        reorder_quantity: parseInt(formData.reorder_quantity as string) || 0,
      };

      await onSubmit(submissionData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const isEditing = !!inventoryItem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditing ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the inventory details for this product'
              : 'Add a new product to your inventory system'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Image - First Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Product Image</Label>

            <div className="flex items-start gap-6">
              {/* Image Display/Upload Area */}
              <div className="flex-shrink-0">
                {formData.product_image_url ? (
                  <div className="relative group">
                    <img
                      src={formData.product_image_url}
                      alt="Product preview"
                      className="h-32 w-32 object-cover border-2 border-border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Image Actions Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-white/90 hover:bg-white rounded-none"
                        onClick={() => document.getElementById('imageUpload')?.click()}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700 rounded-none"
                        onClick={() => handleInputChange('product_image_url', '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="h-32 w-32 border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors group"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                  >
                    <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-2" />
                    <span className="text-sm text-muted-foreground group-hover:text-primary">Add Image</span>
                  </div>
                )}

                {/* Hidden File Input */}
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        await handleImageUpload(file);
                      } catch (error) {
                        // Error handling is done in handleImageUpload
                      }
                    }
                  }}
                />
              </div>

              {/* Image Instructions */}
              <div className="flex-1 text-sm text-muted-foreground">
                <p className="mb-2">Click the image area to upload a product photo</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Recommended size: 400x400 pixels</li>
                  <li>Formats: JPG, PNG, WebP</li>
                  <li>Maximum size: 5MB</li>
                  <li>Hover over existing image to edit or delete</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Product Information</Label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => {
                    if (!isEditing) {
                      handleInputChange('product_name', e.target.value);
                    }
                  }}
                  placeholder="Enter product name"
                  className={`rounded-none ${isEditing ? 'bg-muted cursor-not-allowed' : ''}`}
                  disabled={isEditing}
                  required
                />
              </div>

              <div>
                <Label htmlFor="product_category">Category</Label>
                <Select
                  value={formData.product_category}
                  onValueChange={(value) => handleInputChange('product_category', value)}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                    {allCategories.length === 0 && !categoriesLoading && (
                      <SelectItem value="Uncategorized" disabled className="text-muted-foreground">
                        No categories found - Add categories first
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Inventory Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Inventory Details</Label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => {
                      if (!isEditing) {
                        handleInputChange('sku', e.target.value);
                      }
                    }}
                    placeholder="e.g., ERPR-0001000"
                    className={`rounded-none ${isEditing ? 'bg-muted cursor-not-allowed' : ''}`}
                    disabled={isEditing}
                    required
                  />
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSKU}
                      className="whitespace-nowrap rounded-none"
                    >
                      <RotateCw className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Product barcode"
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost">Cost Per Unit (₹) *</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  className="rounded-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Selling Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="rounded-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Vendor Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Vendor Information</Label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendor_name">Vendor Name *</Label>
                <Select
                  value={formData.vendor_name}
                  onValueChange={(value) => handleInputChange('vendor_name', value)}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorsLoading ? (
                      <SelectItem value="loading" disabled>Loading vendors...</SelectItem>
                    ) : vendors.length === 0 ? (
                      <SelectItem value="no-vendors" disabled>No vendors available</SelectItem>
                    ) : (
                      vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.name}>
                          {vendor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="warehouse_location">Warehouse Location</Label>
                {isEditing ? (
                  <Input
                    value={(() => {
                      const warehouse = warehouses.find(w => w.name === formData.warehouse_location);
                      return warehouse ? `${warehouse.name} (${warehouse.code})` : formData.warehouse_location;
                    })()}
                    disabled
                    className="bg-muted cursor-not-allowed rounded-none"
                  />
                ) : (
                  <Select
                    value={formData.warehouse_location}
                    onValueChange={(value) => {
                      // Find the selected warehouse to get the full display format
                      const selectedWarehouse = warehouses.find(w => w.name === value);
                      handleInputChange('warehouse_location', value);
                    }}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Select warehouse">
                        {formData.warehouse_location && (() => {
                          const warehouse = warehouses.find(w => w.name === formData.warehouse_location);
                          return warehouse ? `${warehouse.name} (${warehouse.code})` : formData.warehouse_location;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.name}>
                          {warehouse.name} ({warehouse.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

          </div>

          <Separator />

          {/* Stock Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Stock Information</Label>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="on_hand_qty">On Hand Quantity</Label>
                <Input
                  id="on_hand_qty"
                  type="number"
                  min="0"
                  value={formData.on_hand_qty}
                  onChange={(e) => handleInputChange('on_hand_qty', e.target.value)}
                  className="rounded-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <Label htmlFor="allocated_qty">Allocated Quantity</Label>
                <Input
                  id="allocated_qty"
                  type="number"
                  min="0"
                  value={formData.allocated_qty}
                  onChange={(e) => handleInputChange('allocated_qty', e.target.value)}
                  className="rounded-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <Label>Available Quantity</Label>
                <Input
                  value={Math.max(0, (parseInt(formData.on_hand_qty as string) || 0) - (parseInt(formData.allocated_qty as string) || 0))}
                  disabled
                  className="bg-muted rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="min_stock_level">Min Stock Level</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                  className="rounded-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <Label htmlFor="reorder_point">Reorder Point</Label>
                <Input
                  id="reorder_point"
                  type="number"
                  min="0"
                  value={formData.reorder_point}
                  onChange={(e) => handleInputChange('reorder_point', e.target.value)}
                  className="rounded-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <Label htmlFor="reorder_quantity">Reorder Quantity</Label>
                <Input
                  id="reorder_quantity"
                  type="number"
                  min="0"
                  value={formData.reorder_quantity}
                  onChange={(e) => handleInputChange('reorder_quantity', e.target.value)}
                  className="rounded-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Additional Information</Label>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this inventory item"
                rows={3}
                className="rounded-none"
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-none"
          >
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update' : 'Add'} Inventory Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}