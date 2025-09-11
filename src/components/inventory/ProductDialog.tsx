import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ProductVariantWithDetails } from '@/hooks/useInventory';
import { useCategories } from '@/hooks/useCategories';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useSuppliers } from '@/hooks/useSuppliers';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductVariantWithDetails | null;
  onSave: (productData: any) => Promise<void>;
  loading?: boolean;
}

export const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  onOpenChange,
  product,
  onSave,
  loading = false
}) => {
  const { allCategories } = useCategories();
  const { warehouses } = useWarehouses();
  const { suppliers } = useSuppliers();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    warehouse_id: '',
    supplier_id: '',
    sku: '',
    barcode: '',
    cost: '',
    min_stock_level: '',
    reorder_point: '',
    reorder_quantity: '',
    attributes: {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.product.name || '',
        description: product.product.description || '',
        category_id: product.product.category?.id || '',
        warehouse_id: '', // Will be set when creating initial stock
        supplier_id: product.supplier?.id || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        cost: product.cost?.toString() || '',
        min_stock_level: product.min_stock_level?.toString() || '0',
        reorder_point: product.reorder_point?.toString() || '0',
        reorder_quantity: product.reorder_quantity?.toString() || '0',
        attributes: product.attributes || {}
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category_id: '',
        warehouse_id: '',
        supplier_id: '',
        sku: '',
        barcode: '',
        cost: '',
        min_stock_level: '0',
        reorder_point: '0',
        reorder_quantity: '0',
        attributes: {}
      });
    }
    setErrors({});
  }, [product, open]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.warehouse_id) {
      newErrors.warehouse_id = 'Warehouse is required';
    }

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }

    if (!formData.cost || formData.cost.trim() === '') {
      newErrors.cost = 'Cost is required';
    } else if (parseFloat(formData.cost) <= 0) {
      newErrors.cost = 'Cost must be a positive number';
    }

    if (formData.min_stock_level && parseInt(formData.min_stock_level) < 0) {
      newErrors.min_stock_level = 'Minimum stock level must be non-negative';
    }

    if (formData.reorder_point && parseInt(formData.reorder_point) < 0) {
      newErrors.reorder_point = 'Reorder point must be non-negative';
    }

    if (formData.reorder_quantity && parseInt(formData.reorder_quantity) < 0) {
      newErrors.reorder_quantity = 'Reorder quantity must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category_id: formData.category_id,
        warehouse_id: formData.warehouse_id,
        supplier_id: formData.supplier_id,
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || undefined,
        cost: parseFloat(formData.cost),
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        reorder_point: parseInt(formData.reorder_point) || 0,
        reorder_quantity: parseInt(formData.reorder_quantity) || 0,
        attributes: formData.attributes
      };

      await onSave(productData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const isEditing = !!product;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the product information below.'
              : 'Enter the details for the new product.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter product name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                placeholder="e.g., RING-001"
                className={errors.sku ? 'border-destructive' : ''}
              />
              {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Product description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => handleChange('category_id', value)}
              >
                <SelectTrigger className={errors.category_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(value) => handleChange('warehouse_id', value)}
              >
                <SelectTrigger className={errors.warehouse_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.warehouse_id && <p className="text-sm text-destructive">{errors.warehouse_id}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier *</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => handleChange('supplier_id', value)}
            >
              <SelectTrigger className={errors.supplier_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.filter(s => s.status === 'active').map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name} {supplier.code && `(${supplier.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                placeholder="Product barcode"
              />
            </div>

            <div className="space-y-2">
              {/* Empty space for grid alignment */}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (₹) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0.00"
                className={errors.cost ? 'border-destructive' : ''}
              />
              {errors.cost && <p className="text-sm text-destructive">{errors.cost}</p>}
            </div>

            <div className="space-y-2">
              {/* Empty space for grid alignment */}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_stock_level">Min Stock Level</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => handleChange('min_stock_level', e.target.value)}
                className={errors.min_stock_level ? 'border-destructive' : ''}
              />
              {errors.min_stock_level && <p className="text-sm text-destructive">{errors.min_stock_level}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => handleChange('reorder_point', e.target.value)}
                className={errors.reorder_point ? 'border-destructive' : ''}
              />
              {errors.reorder_point && <p className="text-sm text-destructive">{errors.reorder_point}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_quantity">Reorder Quantity</Label>
              <Input
                id="reorder_quantity"
                type="number"
                min="0"
                value={formData.reorder_quantity}
                onChange={(e) => handleChange('reorder_quantity', e.target.value)}
                className={errors.reorder_quantity ? 'border-destructive' : ''}
              />
              {errors.reorder_quantity && <p className="text-sm text-destructive">{errors.reorder_quantity}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};