import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Package,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Grid3X3,
  List,
  Download,
  CheckCircle,
  XCircle,
  History
} from "lucide-react";

import { useInventory } from '@/hooks/useInventory';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useCategories } from '@/hooks/useCategories';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryGrid } from '@/components/inventory/InventoryGrid';
import { ProductDialog } from '@/components/inventory/ProductDialog';
import { HistoryDialog } from '@/components/inventory/HistoryDialog';

const NewInventory: React.FC = () => {
  const { 
    products, 
    stockMovements, 
    alerts, 
    loading, 
    error, 
    actions 
  } = useInventory();
  
  const { warehouses } = useWarehouses();
  const { allCategories } = useCategories();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchTerm === '' || 
        product.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || 
        product.product.category?.id === categoryFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'in_stock' && product.current_stock > product.min_stock_level) ||
        (statusFilter === 'low_stock' && product.current_stock <= product.min_stock_level && product.current_stock > 0) ||
        (statusFilter === 'out_of_stock' && product.current_stock === 0);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    const totalCostValue = products.reduce((sum, p) => sum + (p.current_stock * (p.cost || 0)), 0);
    const totalSellingValue = products.reduce((sum, p) => sum + (p.current_stock * (p.price || 0)), 0);
    
    return {
      totalProducts: products.length,
      totalValue: totalCostValue,
      totalSellingValue,
      totalPotentialProfit: totalSellingValue - totalCostValue,
      inStock: products.filter(p => p.current_stock > p.min_stock_level).length,
      lowStock: products.filter(p => p.current_stock <= p.min_stock_level && p.current_stock > 0).length,
      outOfStock: products.filter(p => p.current_stock === 0).length,
      alerts: alerts.length
    };
  }, [products, alerts]);

  const handleAddProduct = async (productData: any) => {
    setActionLoading(true);
    try {
      await actions.addProduct(productData);
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductDialogOpen(true);
  };

  const handleUpdateProduct = async (productData: any) => {
    if (!editingProduct) return;
    
    setActionLoading(true);
    try {
      await actions.updateProduct(editingProduct.id, productData);
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStockUpdate = async (productId: string, type: 'in' | 'out', qty: number) => {
    setActionLoading(true);
    try {
      const warehouse = warehouses[0]; // Use first warehouse for now
      if (!warehouse) {
        throw new Error('No warehouse found');
      }

      // Record the stock movement
      await actions.recordStockMovement({
        product_variant_id: productId,
        warehouse_id: warehouse.id,
        movement_type: type === 'in' ? 'IN' : 'OUT',
        qty,
        reference_type: 'manual',
        notes: `Manual ${type === 'in' ? 'stock in' : 'stock out'} via inventory page`
      });

      // Force refresh data to ensure UI is updated
      await actions.refreshData();
      
    } catch (error) {
      console.error('Error updating stock:', error);
      // Optionally show a toast error message here
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setProductDialogOpen(false);
    setEditingProduct(null);
  };

  const handleExportCSV = () => {
    // Create CSV headers
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Current Stock',
      'Available Stock',
      'Status',
      'Cost',
      'Total Value',
      'Unit Price',
      'Warehouse',
      'Min Stock Level',
      'Reorder Point',
      'Reorder Quantity'
    ];

    // Convert filtered products to CSV rows
    const csvData = filteredProducts.map(product => {
      const stockStatus = product.current_stock === 0 ? 'Out of Stock' 
        : product.current_stock <= product.min_stock_level ? 'Low Stock' 
        : 'In Stock';
      
      return [
        product.product.name,
        product.sku,
        product.product.category?.name || 'N/A',
        product.current_stock,
        product.available_stock,
        stockStatus,
        product.cost ? `₹${product.cost.toFixed(2)}` : 'N/A',
        product.cost ? `₹${((product.current_stock || 0) * product.cost).toFixed(2)}` : 'N/A',
        product.price ? `₹${product.price.toFixed(2)}` : 'N/A',
        product.warehouse?.name || 'N/A',
        product.min_stock_level,
        product.reorder_point,
        product.reorder_quantity
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field}"` 
            : field
        ).join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="container mx-auto px-6 pt-4 pb-8">
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-6 text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Inventory</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => actions.refreshData()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 pt-4 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Inventory Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your product inventory, stock levels, and movements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">₹{inventoryStats.totalValue.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Selling: ₹{inventoryStats.totalSellingValue.toFixed(2)}
            </div>
            <div className="text-xs text-green-600 font-medium">
              Profit: ₹{inventoryStats.totalPotentialProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inventoryStats.inStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inventoryStats.alerts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs and Filters */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('in_stock')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'in_stock'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStatusFilter('low_stock')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'low_stock'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStatusFilter('out_of_stock')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'out_of_stock'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              Out of Stock
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-0 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border h-10"
              />
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-auto min-w-[130px] bg-muted/50 border-0 h-10">
                <Package className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="border-0 h-10 w-10 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="border-0 h-10 w-10 p-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={() => actions.refreshData()}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-0 bg-muted/50 h-10"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button 
              onClick={() => setProductDialogOpen(true)}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>

            <Button
              onClick={() => setHistoryDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-0 bg-muted/50 h-10"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="border-0 bg-muted/50 h-10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Active Inventory Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <div>
                      <span className="font-medium">{alert.product_variant.product.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({alert.product_variant.sku})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {alert.alert_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Stock: {alert.current_stock}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => actions.acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              ))}
              {alerts.length > 3 && (
                <div className="text-center text-sm text-muted-foreground">
                  And {alerts.length - 3} more alerts...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table/Grid */}
      <div className="bg-card rounded-xl border">

        {/* Table Content */}
        <div className="p-0">
          {viewMode === 'table' ? (
            <InventoryTable
              products={filteredProducts}
              onEdit={handleEditProduct}
              onStockUpdate={handleStockUpdate}
              loading={loading || actionLoading}
            />
          ) : (
            <InventoryGrid
              products={filteredProducts}
              onEdit={handleEditProduct}
              onStockUpdate={handleStockUpdate}
              loading={loading || actionLoading}
            />
          )}
        </div>
      </div>

      {/* Product Dialog */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={handleCloseDialog}
        product={editingProduct}
        onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
        loading={actionLoading}
      />

      {/* History Dialog */}
      <HistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        movements={stockMovements}
        loading={loading}
      />
    </div>
  );
};

export default NewInventory;