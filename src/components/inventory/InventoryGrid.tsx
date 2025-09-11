import React from 'react';
import { ProductVariantWithDetails } from '@/hooks/useInventory';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  Warehouse,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface InventoryGridProps {
  products: ProductVariantWithDetails[];
  onEdit: (product: ProductVariantWithDetails) => void;
  onStockUpdate: (productId: string, type: 'in' | 'out', qty: number) => void;
  loading?: boolean;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  products,
  onEdit,
  onStockUpdate,
  loading = false
}) => {
  const getStockStatus = (product: ProductVariantWithDetails) => {
    const { current_stock, min_stock_level, reorder_point } = product;
    
    if (current_stock === 0) return { 
      status: 'out_of_stock', 
      label: 'Out of Stock', 
      color: 'destructive',
      icon: <XCircle className="w-4 h-4" />
    };
    if (current_stock <= reorder_point) return { 
      status: 'reorder', 
      label: 'Reorder', 
      color: 'destructive',
      icon: <AlertTriangle className="w-4 h-4" />
    };
    if (current_stock <= min_stock_level) return { 
      status: 'low_stock', 
      label: 'Low Stock', 
      color: 'warning',
      icon: <AlertTriangle className="w-4 h-4" />
    };
    return { 
      status: 'in_stock', 
      label: 'In Stock', 
      color: 'default',
      icon: <CheckCircle className="w-4 h-4" />
    };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-32 bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No products found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-6">
      {products.map((product) => {
        const stockStatus = getStockStatus(product);
        const totalValue = (product.current_stock || 0) * (product.cost || 0);
        const profitPerUnit = product.price && product.cost ? product.price - product.cost : 0;
        
        return (
          <Card 
            key={product.id} 
            className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20 bg-gradient-to-br from-card to-card/80"
          >
            <CardContent className="p-0">
              {/* Product Header */}
              <div className="p-4 border-b border-border/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {product.product.image_url ? (
                      <img 
                        src={product.product.image_url} 
                        alt={product.product.name}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-border/20"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center border-2 border-primary/20">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {product.product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        SKU: {product.sku}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={stockStatus.color === 'destructive' ? 'destructive' : stockStatus.color === 'warning' ? 'secondary' : 'default'} className="text-xs">
                    {stockStatus.icon}
                    <span className="ml-1">{stockStatus.label}</span>
                  </Badge>
                  
                  {product.product.category && (
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {product.product.category.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Information */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock</span>
                      <span className="font-medium">{product.current_stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium text-green-600">{product.available_stock}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost</span>
                      <span className="font-medium">
                        {product.cost ? `₹${product.cost.toFixed(0)}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">
                        {product.price ? `₹${product.price.toFixed(0)}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="pt-2 border-t border-border/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Total Value</span>
                    <span className="text-lg font-bold text-primary">₹{totalValue.toFixed(0)}</span>
                  </div>
                  
                  {profitPerUnit > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Profit/Unit</span>
                      <span className="text-green-600 font-medium flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        ₹{profitPerUnit.toFixed(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Warehouse Info */}
                {product.warehouse && (
                  <div className="flex items-center text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{product.warehouse.name} ({product.warehouse.code})</span>
                  </div>
                )}

                {/* Stock Level Indicator */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Stock Level</span>
                    <span>{((product.current_stock / (product.reorder_point || 1)) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        product.current_stock === 0 
                          ? 'bg-red-500' 
                          : product.current_stock <= product.min_stock_level 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, Math.max(5, (product.current_stock / Math.max(product.reorder_point, 1)) * 100))}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};