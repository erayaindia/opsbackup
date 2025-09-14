import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from 'fuse.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryItem, ViewMode, StockUpdateType, SavedFilterPreset, AdvancedSearchOptions, StockPrediction, SalesHistory, SeasonalPattern, ReorderSuggestion, InventoryLog, InventoryAlert } from "@/types/inventory";
import { useInventory } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import StockMovementsDialog from "@/components/inventory/StockMovementsDialog";
import StockMovementForm from "@/components/inventory/StockMovementForm";
import { InventoryProductModal } from "@/components/inventory/InventoryProductModal";

import {
  Package,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Calendar,
  Clock,
  Target,
  ShoppingCart,
  Truck,
  Box,
  DollarSign,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
  Minus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Zap,
  Star,
  Bookmark,
  BookmarkCheck,
  Grid,
  List,
  PieChart as PieChartIcon,
  BarChart2,
  Activity,
  Archive,
  ExternalLink,
  Database,
  Layers,
  RotateCcw,
  Save,
  FileText,
  PlusCircle,
  MinusCircle,
  ScanLine,
  ShoppingBag,
  Warehouse,
  MapPin,
  Tag,
  Image,
  FileImage,
  X
} from "lucide-react";

// Types are imported from @/types/inventory

export default function Inventory() {
  const navigate = useNavigate();

  // Use the inventory hook for real data
  const { products: inventoryProducts, stockMovements, loading: inventoryLoading, error: inventoryError, actions } = useInventory();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all']);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(['all']);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Dialog states
  const [movementsDialogOpen, setMovementsDialogOpen] = useState(false);
  const [movementFormOpen, setMovementFormOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [recordingMovement, setRecordingMovement] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewProductName, setPreviewProductName] = useState<string>('');

  // Transform database products to inventory format
  const inventoryData: InventoryItem[] = useMemo(() => {
    if (!inventoryProducts || inventoryProducts.length === 0) return [];

    return inventoryProducts.map((product) => {
      const currentStock = product.current_stock || 0;
      const threshold = product.min_stock_level || 10;
      let status: 'in_stock' | 'low_stock' | 'out_of_stock';

      if (currentStock === 0) {
        status = 'out_of_stock';
      } else if (currentStock <= threshold) {
        status = 'low_stock';
      } else {
        status = 'in_stock';
      }

      return {
        id: product.id,
        product_name: product.product_name || product.product?.name || 'Unknown Product',
        sku: product.sku || 'NO-SKU',
        category: product.product_category || product.product?.category?.name || 'uncategorized',
        supplier_id: product.supplier?.id || '',
        supplier_name: product.supplier_name || product.supplier?.name || 'Unknown Supplier',
        base_stock: currentStock,
        current_stock: currentStock,
        reserved_stock: product.allocated_stock || 0,
        available_stock: product.available_stock || currentStock,
        threshold: threshold,
        status: status,
        cost_per_unit: product.cost || 0,
        total_value: (product.cost || 0) * currentStock,
        description: product.product_description || product.product?.description || '',
        location: product.warehouse_location || product.warehouse?.name || 'Unknown Location',
        image_url: product.product_image_url || product.product?.image_url || '/api/placeholder/60/60',
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        created_by: 'system',
        updated_by: 'system'
      };
    });
  }, [inventoryProducts]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon for header
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="h-3 w-3" /> :
      <ArrowDown className="h-3 w-3" />;
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = inventoryData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
      filtered = filtered.filter(item => selectedCategories.includes(item.category));
    }

    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes('all')) {
      filtered = filtered.filter(item => selectedStatuses.includes(item.status));
    }

    // Supplier filter
    if (selectedSuppliers.length > 0 && !selectedSuppliers.includes('all')) {
      filtered = filtered.filter(item => selectedSuppliers.includes(item.supplier_name));
    }

    // Sort data
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField as keyof typeof a];
        let bValue: any = b[sortField as keyof typeof b];

        // Handle different data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [inventoryData, searchTerm, selectedCategories, selectedStatuses, selectedSuppliers, sortField, sortDirection]);

  // Get unique values for filters
  const categories = ['all', ...Array.from(new Set(inventoryData.map(item => item.category)))];
  const suppliers = ['all', ...Array.from(new Set(inventoryData.map(item => item.supplier_name)))];

  // Statistics
  const getStats = () => {
    const inStock = inventoryData.filter(item => item.status === 'in_stock').length;
    const lowStock = inventoryData.filter(item => item.status === 'low_stock').length;
    const outOfStock = inventoryData.filter(item => item.status === 'out_of_stock').length;
    const totalValue = inventoryData.reduce((sum, item) => sum + (item.current_stock * item.cost_per_unit), 0);

    return {
      total: inventoryData.length,
      inStock,
      lowStock,
      outOfStock,
      totalValue
    };
  };

  const stats = getStats();

  // Handler functions for stock movements
  const handleViewMovements = (product: any) => {
    setSelectedProduct(product);
    setMovementsDialogOpen(true);
  };

  const handleRecordMovement = (product: any) => {
    setSelectedProduct(product);
    setMovementFormOpen(true);
  };

  const handleImagePreview = (imageUrl: string, productName: string) => {
    if (imageUrl && imageUrl !== '/api/placeholder/60/60') {
      setPreviewImageUrl(imageUrl);
      setPreviewProductName(productName);
      setImagePreviewOpen(true);
    }
  };

  const handleMovementSubmit = async (movementData: any) => {
    setRecordingMovement(true);
    try {
      await actions.recordStockMovement(movementData);
      setMovementFormOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error recording movement:', error);
      throw error;
    } finally {
      setRecordingMovement(false);
    }
  };

  // Handle add new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  // Handle global history view
  const handleGlobalHistory = () => {
    navigate('/inventory-history');
  };

  // Handle edit product
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  // Handle product form submit
  const handleProductSubmit = async (productData: any) => {
    try {
      if (editingProduct) {
        // Update existing product
        await actions.updateProduct(editingProduct.id, productData);
      } else {
        // Add new product
        await actions.addProduct(productData);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  };

  // Filter stock movements for selected product or show all for global history
  const filteredMovements = selectedProduct
    ? stockMovements.filter(movement => movement.product_variant_id === selectedProduct.id)
    : stockMovements; // Show all movements for global history

  if (inventoryLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading inventory...</span>
          </div>
        </div>
      </div>
    );
  }

  if (inventoryError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Error loading inventory: {inventoryError}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your product inventory and stock levels</p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.refreshData()}
            disabled={inventoryLoading}
            className="rounded-none"
          >
            {inventoryLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-none"
            >
              <List className="h-4 w-4 mr-2" />
              Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </Button>
          </div>

          <Button
            onClick={handleGlobalHistory}
            variant="outline"
            className="rounded-none"
          >
            <Activity className="h-4 w-4 mr-2" />
            History
          </Button>

          <Button onClick={handleAddProduct} className="rounded-none">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 rounded-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 rounded-none h-10 w-full"
              />
            </div>

            <Select
              value={selectedCategories.includes('all') ? 'all' : selectedCategories[0]}
              onValueChange={(value) => setSelectedCategories(value === 'all' ? ['all'] : [value])}
            >
              <SelectTrigger className="w-[180px] rounded-none h-10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatuses.includes('all') ? 'all' : selectedStatuses[0]}
              onValueChange={(value) => setSelectedStatuses(value === 'all' ? ['all'] : [value])}
            >
              <SelectTrigger className="w-[150px] rounded-none h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedSuppliers.includes('all') ? 'all' : selectedSuppliers[0]}
              onValueChange={(value) => setSelectedSuppliers(value === 'all' ? ['all'] : [value])}
            >
              <SelectTrigger className="w-[180px] rounded-none h-10">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>
                    {supplier === 'all' ? 'All Suppliers' : supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategories(['all']);
                setSelectedStatuses(['all']);
                setSelectedSuppliers(['all']);
              }}
              className="rounded-none"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="rounded-none">
        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {inventoryData.length === 0
                  ? "No products in inventory. Add some products to get started."
                  : "No products match your current filters. Try adjusting your search criteria."
                }
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                      onClick={() => handleSort('product_name')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Product</span>
                        {getSortIcon('product_name')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                      onClick={() => handleSort('sku')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>SKU</span>
                        {getSortIcon('sku')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Category</span>
                        {getSortIcon('category')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                      onClick={() => handleSort('current_stock')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Stock</span>
                        {getSortIcon('current_stock')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                      onClick={() => handleSort('cost_per_unit')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Cost</span>
                        {getSortIcon('cost_per_unit')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                      onClick={() => handleSort('total_value')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Value</span>
                        {getSortIcon('total_value')}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div
                            className="relative h-12 w-12 overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            onClick={() => handleImagePreview(item.image_url, item.product_name)}
                          >
                            {item.image_url && item.image_url !== '/api/placeholder/60/60' ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/api/placeholder/60/60';
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                                <Package className="h-6 w-6 text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono border-r border-border/50 text-center">{item.sku}</TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="flex justify-center">
                          <Badge variant="outline" className="rounded-none">{item.category}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="text-sm">
                          <div className="font-medium">{item.current_stock}</div>
                          <div className="text-muted-foreground text-xs">
                            Avail: {item.available_stock}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="flex justify-center">
                          <Badge
                            variant={
                              item.status === 'in_stock'
                                ? 'default'
                                : item.status === 'low_stock'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="rounded-none"
                          >
                            {item.status === 'in_stock'
                              ? 'In Stock'
                              : item.status === 'low_stock'
                              ? 'Low Stock'
                              : 'Out of Stock'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">₹{item.cost_per_unit.toLocaleString()}</TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="text-sm">
                          <div className="font-medium">₹{item.total_value.toLocaleString()}</div>
                          <div className="text-muted-foreground text-xs">
                            {item.cost_per_unit} × {item.current_stock}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(item)}
                            className="text-xs rounded-none"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewMovements(item)}
                            className="text-xs rounded-none"
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            History
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecordMovement(item)}
                            className="text-xs rounded-none"
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Move
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredData.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow rounded-none">
                  <CardContent className="p-4">
                    <div
                      className="aspect-square mb-3 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => handleImagePreview(item.image_url, item.product_name)}
                    >
                      {item.image_url && item.image_url !== '/api/placeholder/60/60' ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          display: (!item.image_url || item.image_url === '/api/placeholder/60/60') ? 'flex' : 'none'
                        }}
                      >
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                      <Badge
                        className="absolute top-2 right-2 shadow-sm rounded-none"
                        variant={
                          item.status === 'in_stock'
                            ? 'default'
                            : item.status === 'low_stock'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {item.status === 'in_stock'
                          ? 'In Stock'
                          : item.status === 'low_stock'
                          ? 'Low Stock'
                          : 'Out of Stock'}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-sm mb-1 truncate">
                      {item.product_name}
                    </h3>

                    <p className="text-xs text-muted-foreground mb-2 font-mono">
                      {item.sku}
                    </p>

                    <div className="flex justify-between items-center text-sm mb-2">
                      <span>Stock: {item.current_stock}</span>
                      <Badge variant="outline" className="text-xs rounded-none">
                        {item.category}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-sm mb-2">
                      <span>Cost: <span className="font-medium">₹{item.cost_per_unit.toLocaleString()}</span></span>
                      <span className="text-muted-foreground text-xs">
                        {item.location}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm mb-3">
                      <span>Value: <span className="font-medium text-green-600">₹{item.total_value.toLocaleString()}</span></span>
                      <span className="text-muted-foreground text-xs">
                        {item.cost_per_unit} × {item.current_stock}
                      </span>
                    </div>

                    {/* Action buttons for grid view */}
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(item)}
                        className="text-xs flex-1 rounded-none"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMovements(item)}
                        className="text-xs flex-1 rounded-none"
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRecordMovement(item)}
                        className="text-xs flex-1 rounded-none"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Move
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Movements Dialog */}
      {selectedProduct && (
        <StockMovementsDialog
          open={movementsDialogOpen}
          onOpenChange={setMovementsDialogOpen}
          movements={filteredMovements}
          productName={selectedProduct.product_name}
        />
      )}


      {/* Stock Movement Form Dialog */}
      {selectedProduct && (
        <StockMovementForm
          open={movementFormOpen}
          onOpenChange={setMovementFormOpen}
          product={selectedProduct}
          onSubmit={handleMovementSubmit}
          loading={recordingMovement}
        />
      )}

      {/* Add/Edit Product Modal */}
      <InventoryProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        inventoryItem={editingProduct}
        onSubmit={handleProductSubmit}
        loading={inventoryLoading}
      />

      {/* Image Preview Modal */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 rounded-none">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-lg font-semibold">
              {previewProductName}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Product Image Preview
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt={previewProductName}
                className="max-w-full max-h-[60vh] object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Package className="h-16 w-16 mb-4" />
                <p>No image available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}