import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { ProductVariantWithDetails } from "@/hooks/useInventory";

interface StockMovementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductVariantWithDetails;
  onSubmit: (movement: {
    product_variant_id: string; // Maps to inventory_detail_id internally
    warehouse_id: string;
    movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
    qty: number;
    unit_cost?: number;
    reference_type?: string;
    reference_id?: string;
    notes?: string;
    from_location_id?: string;
    to_location_id?: string;
  }) => Promise<void>;
  loading?: boolean;
}

const movementTypes = [
  {
    value: 'IN',
    label: 'Stock In',
    description: 'Receive inventory (purchases, returns)',
    icon: <TrendingUp className="h-4 w-4 text-green-600" />,
    color: 'text-green-600',
  },
  {
    value: 'OUT',
    label: 'Stock Out',
    description: 'Remove inventory (sales, damages)',
    icon: <TrendingDown className="h-4 w-4 text-red-600" />,
    color: 'text-red-600',
  },
  {
    value: 'ADJUST',
    label: 'Adjustment',
    description: 'Correct inventory counts',
    icon: <RefreshCw className="h-4 w-4 text-blue-600" />,
    color: 'text-blue-600',
  },
  {
    value: 'TRANSFER',
    label: 'Transfer',
    description: 'Move between locations',
    icon: <ArrowRight className="h-4 w-4 text-orange-600" />,
    color: 'text-orange-600',
  },
];

const referenceTypes = [
  'purchase_order',
  'sales_order',
  'transfer_order',
  'return',
  'damage',
  'theft',
  'cycle_count',
  'adjustment',
  'other',
];

export default function StockMovementForm({
  open,
  onOpenChange,
  product,
  onSubmit,
  loading = false,
}: StockMovementFormProps) {
  const [formData, setFormData] = useState({
    movement_type: '',
    qty: '',
    unit_cost: '',
    reference_type: '',
    reference_id: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.movement_type) {
      newErrors.movement_type = 'Movement type is required';
    }

    if (!formData.qty || parseInt(formData.qty) <= 0) {
      newErrors.qty = 'Quantity must be greater than 0';
    }

    if (formData.movement_type === 'OUT' &&
        parseInt(formData.qty) > product.current_stock) {
      newErrors.qty = 'Cannot remove more stock than available';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Submit movement - product.id now refers to inventory_detail_id
      await onSubmit({
        product_variant_id: product.id, // This is actually inventory_detail_id now
        warehouse_id: product.warehouse.id,
        movement_type: formData.movement_type as 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER',
        qty: parseInt(formData.qty),
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : undefined,
        reference_type: formData.reference_type || undefined,
        reference_id: formData.reference_id || undefined,
        notes: formData.notes || undefined,
      });

      // Reset form on success
      setFormData({
        movement_type: '',
        qty: '',
        unit_cost: '',
        reference_type: '',
        reference_id: '',
        notes: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting stock movement:', error);
      setErrors({ submit: 'Failed to record stock movement. Please try again.' });
    }
  };

  const selectedMovementType = movementTypes.find(mt => mt.value === formData.movement_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Record Stock Movement
          </DialogTitle>
        </DialogHeader>

        {/* Product Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <img
                src={product.product.image_url}
                alt={product.product.name}
                className="h-16 w-16 rounded-lg object-cover bg-muted"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.product.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>SKU: {product.sku}</span>
                  <span>Current Stock: {product.current_stock}</span>
                  <span>Available: {product.available_stock}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{product.product.category?.name}</Badge>
                  <span className="text-sm text-muted-foreground">{product.warehouse.name}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Movement Type */}
          <div className="space-y-2">
            <Label htmlFor="movement_type">Movement Type *</Label>
            <Select
              value={formData.movement_type}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, movement_type: value }));
                if (errors.movement_type) {
                  setErrors(prev => ({ ...prev, movement_type: '' }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select movement type" />
              </SelectTrigger>
              <SelectContent>
                {movementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-3">
                      {type.icon}
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.movement_type && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.movement_type}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity *</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={formData.qty}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, qty: e.target.value }));
                  if (errors.qty) {
                    setErrors(prev => ({ ...prev, qty: '' }));
                  }
                }}
                placeholder="Enter quantity"
              />
              {errors.qty && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.qty}
                </p>
              )}
            </div>

            {/* Unit Cost */}
            <div className="space-y-2">
              <Label htmlFor="unit_cost">Unit Cost (₹)</Label>
              <Input
                id="unit_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
                placeholder="Enter unit cost"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reference Type */}
            <div className="space-y-2">
              <Label htmlFor="reference_type">Reference Type</Label>
              <Select
                value={formData.reference_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reference_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reference type" />
                </SelectTrigger>
                <SelectContent>
                  {referenceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference ID */}
            <div className="space-y-2">
              <Label htmlFor="reference_id">Reference ID</Label>
              <Input
                id="reference_id"
                value={formData.reference_id}
                onChange={(e) => setFormData(prev => ({ ...prev, reference_id: e.target.value }))}
                placeholder="e.g., PO-001, SO-123"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this movement"
              rows={3}
            />
          </div>

          {/* Preview */}
          {selectedMovementType && formData.qty && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {selectedMovementType.icon}
                  <div>
                    <div className="font-medium">
                      {selectedMovementType.label}: {formData.qty} units
                    </div>
                    <div className="text-sm text-muted-foreground">
                      New stock level: {
                        formData.movement_type === 'IN'
                          ? product.current_stock + parseInt(formData.qty)
                          : formData.movement_type === 'OUT'
                          ? product.current_stock - parseInt(formData.qty)
                          : formData.movement_type === 'ADJUST'
                          ? parseInt(formData.qty)
                          : product.current_stock
                      } units
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {errors.submit && (
            <div className="text-sm text-destructive flex items-center gap-1 p-3 rounded-md bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Movement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}