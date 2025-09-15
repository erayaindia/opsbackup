import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InventoryOverviewProps {
  products: any[];
  loading: boolean;
}

export function InventoryOverview({ products, loading }: InventoryOverviewProps) {
  const navigate = useNavigate();

  const getStockStatus = (product: any) => {
    const stock = product.on_hand_qty || product.available_qty || 0;
    const minLevel = product.min_stock_level || product.reorder_point || 0;

    if (stock === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', variant: 'destructive' as const };
    } else if (stock <= minLevel) {
      return { status: 'low-stock', label: 'Low Stock', variant: 'destructive' as const };
    } else if (stock <= minLevel * 2) {
      return { status: 'warning', label: 'Warning', variant: 'outline' as const };
    } else {
      return { status: 'in-stock', label: 'In Stock', variant: 'secondary' as const };
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getStockTrend = (product: any) => {
    // This would typically come from historical data
    // For now, we'll simulate based on current stock levels
    const stock = product.on_hand_qty || product.available_qty || 0;
    const minLevel = product.min_stock_level || product.reorder_point || 0;

    return stock > minLevel ? 'up' : 'down';
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-3 w-32 mb-2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topProducts = products
    .filter(product => product.on_hand_qty !== undefined || product.available_qty !== undefined)
    .sort((a, b) => {
      const stockA = a.on_hand_qty || a.available_qty || 0;
      const stockB = b.on_hand_qty || b.available_qty || 0;
      return stockB - stockA;
    })
    .slice(0, 6);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Overview
            <Badge variant="outline" className="ml-2">
              {products.length} Products
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {topProducts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No inventory data available</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/inventory/new')}
            >
              Add First Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topProducts.map((product, index) => {
              const stock = product.on_hand_qty || product.available_qty || 0;
              const stockStatus = getStockStatus(product);
              const trend = getStockTrend(product);
              const price = product.price || 0;
              const cost = product.cost || 0;
              const margin = price > 0 ? ((price - cost) / price * 100).toFixed(1) : '0';

              return (
                <div
                  key={product.id || index}
                  className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate('/inventory')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {product.product_name || product.name || `Product ${index + 1}`}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        SKU: {product.sku || 'N/A'}
                      </p>
                    </div>
                    <Badge variant={stockStatus.variant} className="text-xs">
                      {stockStatus.label}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Stock</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{stock}</span>
                        {trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Price</span>
                      <span className="text-sm font-medium">{formatCurrency(price)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Margin</span>
                      <span className="text-sm font-medium text-green-600">{margin}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Category</span>
                      <span className="text-xs">{product.product_category || product.category || 'Uncategorized'}</span>
                    </div>

                    {stock <= (product.min_stock_level || product.reorder_point || 0) && stock > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Needs restock</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {topProducts.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing top {topProducts.length} products by stock level
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/inventory')}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Full Inventory
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}