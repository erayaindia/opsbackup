import React, { useState } from 'react';
import { ProductVariantWithDetails } from '@/hooks/useInventory';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Edit,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Calendar,
  Truck,
  MapPin,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryTableProps {
  products: ProductVariantWithDetails[];
  onEdit: (product: ProductVariantWithDetails) => void;
  onStockUpdate: (productId: string, type: 'in' | 'out', qty: number) => void;
  loading?: boolean;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onEdit,
  onStockUpdate,
  loading = false
}) => {
  const [stockUpdates, setStockUpdates] = useState<Record<string, { type: 'in' | 'out'; qty: string }>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getStockStatus = (product: ProductVariantWithDetails) => {
    const { current_stock, min_stock_level, reorder_point } = product;
    
    if (current_stock === 0) return { status: 'out_of_stock', label: 'Out of Stock', color: 'destructive' };
    if (current_stock <= reorder_point) return { status: 'reorder', label: 'Reorder', color: 'destructive' };
    if (current_stock <= min_stock_level) return { status: 'low_stock', label: 'Low Stock', color: 'warning' };
    return { status: 'in_stock', label: 'In Stock', color: 'default' };
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return <XCircle className="w-3 h-3" />;
      case 'reorder':
      case 'low_stock':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <CheckCircle className="w-3 h-3" />;
    }
  };

  const handleStockUpdate = (productId: string, type: 'in' | 'out') => {
    const update = stockUpdates[productId];
    if (!update || !update.qty) return;
    
    const qty = parseInt(update.qty);
    if (qty > 0) {
      onStockUpdate(productId, type, qty);
      setStockUpdates(prev => ({ ...prev, [productId]: { type: 'in', qty: '' } }));
    }
  };

  const updateStockInput = (productId: string, field: 'type' | 'qty', value: string) => {
    setStockUpdates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const toggleRowExpansion = (productId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 border-r border-border/50"></TableHead>
            <TableHead className="border-r border-border/50 whitespace-nowrap">Product</TableHead>
            <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Category</TableHead>
            <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Current Stock</TableHead>
            <TableHead className="w-24 border-r border-border/50 whitespace-nowrap">Available</TableHead>
            <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">Status</TableHead>
            <TableHead className="w-20 border-r border-border/50 whitespace-nowrap">Cost</TableHead>
            <TableHead className="w-24 border-r border-border/50 whitespace-nowrap">Total Value</TableHead>
            <TableHead className="w-48 whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            const stockUpdate = stockUpdates[product.id] || { type: 'in', qty: '' };
            const isExpanded = expandedRows.has(product.id);

            return (
              <React.Fragment key={product.id}>
                <TableRow 
                  className="cursor-pointer hover:bg-muted/50 transition-colors h-12"
                  onClick={() => toggleRowExpansion(product.id)}
                >
                  <TableCell className="border-r border-border/50 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(product.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-3 w-3 transition-transform duration-200" />
                      )}
                    </Button>
                  </TableCell>
                  
                  <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      {product.product.image_url ? (
                        <img 
                          src={product.product.image_url} 
                          alt={product.product.name}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{product.product.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          SKU: {product.sku}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2 text-sm">
                    {product.product.category?.name || 'Uncategorized'}
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    <div className="flex items-center space-x-1">
                      {getStockIcon(stockStatus.status)}
                      <span className={cn(
                        "font-medium text-sm",
                        stockStatus.status === 'out_of_stock' && "text-destructive",
                        (stockStatus.status === 'low_stock' || stockStatus.status === 'reorder') && "text-warning"
                      )}>
                        {product.current_stock}
                      </span>
                    </div>
                    {product.allocated_stock > 0 && (
                      <div className="text-xs text-muted-foreground leading-none">
                        {product.allocated_stock} alloc.
                      </div>
                    )}
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    <span className="font-medium text-sm">{product.available_stock}</span>
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    <Badge 
                      variant={stockStatus.color as any}
                      className="whitespace-nowrap text-xs px-2 py-0.5"
                    >
                      {stockStatus.label}
                    </Badge>
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    {product.cost && (
                      <span className="text-sm">₹{product.cost.toFixed(2)}</span>
                    )}
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    <span className="text-sm font-medium">
                      ₹{((product.current_stock || 0) * (product.cost || 0)).toFixed(2)}
                    </span>
                  </TableCell>
                
                  <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-2">
                        <select
                          value={stockUpdate.type}
                          onChange={(e) => updateStockInput(product.id, 'type', e.target.value)}
                          className="text-sm border rounded px-2 py-1 min-w-[60px] bg-background text-foreground"
                        >
                          <option value="in">In</option>
                          <option value="out">Out</option>
                        </select>
                        
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={stockUpdate.qty}
                          onChange={(e) => updateStockInput(product.id, 'qty', e.target.value)}
                          className="w-20 h-8 text-sm px-2 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          min="1"
                        />
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockUpdate(product.id, stockUpdate.type)}
                          disabled={!stockUpdate.qty || parseInt(stockUpdate.qty) <= 0}
                          className="px-3"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded Row Content */}
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <div className="bg-muted/30 p-6 border-t animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          
                          {/* Product Details */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                              Product Details
                            </h4>
                            
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Product ID</div>
                                  <div className="text-xs text-muted-foreground font-mono">{product.product.id}</div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">SKU</div>
                                  <div className="text-xs text-muted-foreground font-mono">{product.sku}</div>
                                </div>
                              </div>

                              {product.barcode && (
                                <div className="flex items-center space-x-3">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-sm font-medium">Barcode</div>
                                    <div className="text-xs text-muted-foreground font-mono">{product.barcode}</div>
                                  </div>
                                </div>
                              )}

                              {product.weight && (
                                <div className="flex items-center space-x-3">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-sm font-medium">Weight</div>
                                    <div className="text-xs text-muted-foreground">{product.weight} kg</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Warehouse Information */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                              Warehouse Information
                            </h4>
                            
                            <div className="space-y-3">
                              {product.warehouse ? (
                                <>
                                  <div className="flex items-center space-x-3">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm font-medium">Location</div>
                                      <div className="text-xs text-muted-foreground">{product.warehouse.name}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm font-medium">Warehouse Code</div>
                                      <div className="text-xs text-muted-foreground font-mono">{product.warehouse.code}</div>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center space-x-3">
                                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                  <div>
                                    <div className="text-sm font-medium text-yellow-600">No Warehouse Assigned</div>
                                    <div className="text-xs text-muted-foreground">Product not assigned to any warehouse</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Stock Information */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                              Stock Information
                            </h4>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">On Hand</span>
                                <span className="font-medium">{product.current_stock}</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Allocated</span>
                                <span className="font-medium">{product.allocated_stock}</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Available</span>
                                <span className="font-medium text-green-600">{product.available_stock}</span>
                              </div>
                              
                              <hr className="my-2" />
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Min Level</span>
                                <span className="font-medium">{product.min_stock_level}</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Reorder Point</span>
                                <span className="font-medium">{product.reorder_point}</span>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Reorder Qty</span>
                                <span className="font-medium">{product.reorder_quantity}</span>
                              </div>

                              <hr className="my-2" />

                              {/* Price Information */}
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Unit Cost</span>
                                <span className="font-medium">
                                  {product.cost ? `₹${product.cost.toFixed(2)}` : 'N/A'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-sm">Unit Price</span>
                                <span className="font-medium">
                                  {product.price ? `₹${product.price.toFixed(2)}` : 'N/A'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Stock Value (Cost)</span>
                                <span className="font-bold text-blue-600">
                                  ₹{((product.current_stock || 0) * (product.cost || 0)).toFixed(2)}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Stock Value (Price)</span>
                                <span className="font-bold text-green-600">
                                  ₹{((product.current_stock || 0) * (product.price || 0)).toFixed(2)}
                                </span>
                              </div>

                              {product.cost && product.price && (
                                <>
                                  <hr className="my-2" />
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Profit per Unit</span>
                                    <span className="font-medium text-purple-600">
                                      ₹{(product.price - product.cost).toFixed(2)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Margin %</span>
                                    <span className="font-medium text-purple-600">
                                      {(((product.price - product.cost) / product.price) * 100).toFixed(1)}%
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Total Potential Profit</span>
                                    <span className="font-bold text-purple-600">
                                      ₹{((product.current_stock || 0) * (product.price - product.cost)).toFixed(2)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Pricing & Dates */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                              Pricing & Timeline
                            </h4>
                            
                            <div className="space-y-3">
                              {product.cost && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Cost Price</span>
                                  <span className="font-medium">₹{product.cost.toFixed(2)}</span>
                                </div>
                              )}
                              
                              {product.price && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Selling Price</span>
                                  <span className="font-medium">₹{product.price.toFixed(2)}</span>
                                </div>
                              )}

                              {product.price && product.cost && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Margin</span>
                                  <span className="font-medium text-green-600">
                                    ₹{(product.price - product.cost).toFixed(2)}
                                  </span>
                                </div>
                              )}
                              
                              <hr className="my-2" />
                              
                              <div className="flex items-center space-x-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Created</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(product.created_at)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Last Updated</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(product.updated_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Product Attributes */}
                        {product.attributes && Object.keys(product.attributes).length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                              Product Attributes
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(product.attributes).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Supplier Information */}
                        {product.supplier && (
                          <div className="mt-6">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                              Supplier Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center space-x-3">
                                <Truck className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">{product.supplier.name}</div>
                                  {product.supplier.contact_person && (
                                    <div className="text-xs text-muted-foreground">
                                      Contact: {product.supplier.contact_person}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {(product.supplier.email || product.supplier.phone) && (
                                <div>
                                  {product.supplier.email && (
                                    <div className="text-sm">Email: {product.supplier.email}</div>
                                  )}
                                  {product.supplier.phone && (
                                    <div className="text-sm">Phone: {product.supplier.phone}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
      
      {products.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No products found
        </div>
      )}
    </div>
  );
};