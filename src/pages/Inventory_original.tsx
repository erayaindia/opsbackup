import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryItem, ViewMode, StockUpdateType } from "@/types/inventory";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package,
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  Edit,
  QrCode,
  AlertTriangle,
  TrendingUp,
  Grid3X3,
  List,
  BarChart3,
  RefreshCw,
  Eye,
  Settings,
  Archive,
  PackageX,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  Checkbox
} from "lucide-react";

// Types are imported from @/types/inventory

export default function Inventory() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isStockUpdateOpen, setIsStockUpdateOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockUpdateType, setStockUpdateType] = useState<'in' | 'out'>('in');
  const [stockUpdateQuantity, setStockUpdateQuantity] = useState('');
  const [stockUpdateReason, setStockUpdateReason] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');
  const [tempThresholdValue, setTempThresholdValue] = useState<string>('');

  // Mock data - in real app, this would come from Supabase
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([
    {
      id: '1',
      product_name: 'Gold Chain Necklace 18K',
      sku: 'GCN-18K-001',
      category: 'custom_jewelry',
      supplier_id: 'sup-001',
      supplier_name: 'Mumbai Gold Suppliers',
      base_stock: 100,
      current_stock: 25,
      reserved_stock: 5,
      available_stock: 20,
      threshold: 15,
      status: 'low_stock',
      image_url: '/api/placeholder/60/60',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      created_by: 'admin',
      updated_by: 'Rajesh Kumar'
    },
    {
      id: '2',
      product_name: 'Silver Earrings Set',
      sku: 'SES-925-002',
      category: 'non_custom_jewelry',
      supplier_id: 'sup-002',
      supplier_name: 'Jaipur Silver Works',
      base_stock: 200,
      current_stock: 150,
      reserved_stock: 10,
      available_stock: 140,
      threshold: 30,
      status: 'in_stock',
      image_url: '/api/placeholder/60/60',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-14T15:45:00Z',
      created_by: 'admin',
      updated_by: 'Priya Sharma'
    },
    {
      id: '3',
      product_name: 'Jewelry Gift Box Premium',
      sku: 'JGB-PRM-003',
      category: 'packaging',
      supplier_id: 'sup-003',
      supplier_name: 'Delhi Packaging Co',
      base_stock: 500,
      current_stock: 0,
      reserved_stock: 0,
      available_stock: 0,
      threshold: 50,
      status: 'out_of_stock',
      image_url: '/api/placeholder/60/60',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-12T09:15:00Z',
      created_by: 'admin',
      updated_by: 'Amit Singh'
    },
    {
      id: '4',
      product_name: 'Diamond Ring 1.5ct',
      sku: 'DR-15CT-004',
      category: 'custom_jewelry',
      supplier_id: 'sup-004',
      supplier_name: 'Surat Diamond Hub',
      base_stock: 50,
      current_stock: 35,
      reserved_stock: 3,
      available_stock: 32,
      threshold: 10,
      status: 'in_stock',
      image_url: '/api/placeholder/60/60',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T14:20:00Z',
      created_by: 'admin',
      updated_by: 'Neha Patel'
    }
  ]);

  const categories = ['all', 'custom_jewelry', 'non_custom_jewelry', 'packaging', 'raw_materials'];
  const statuses = ['all', 'in_stock', 'low_stock', 'out_of_stock', 'discontinued'];

  const formatCategoryName = (category: string) => {
    switch (category) {
      case 'all': return 'All Categories';
      case 'custom_jewelry': return 'Custom Jewelry';
      case 'non_custom_jewelry': return 'Non-Custom Jewelry';
      case 'packaging': return 'Packaging';
      case 'raw_materials': return 'Raw Materials';
      default: return category;
    }
  };

  const formatStatusName = (status: string) => {
    switch (status) {
      case 'all': return 'All Statuses';
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      case 'discontinued': return 'Discontinued';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return (
          <Badge className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800 px-3 py-1">
            <CheckCircle className="h-3 w-3 mr-1.5" />
            In Stock
          </Badge>
        );
      case 'low_stock':
        return (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 px-3 py-1">
            <AlertTriangle className="h-3 w-3 mr-1.5" />
            Low Stock
          </Badge>
        );
      case 'out_of_stock':
        return (
          <Badge className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 px-3 py-1">
            <XCircle className="h-3 w-3 mr-1.5" />
            Out of Stock
          </Badge>
        );
      case 'discontinued':
        return (
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 px-3 py-1">
            <Archive className="h-3 w-3 mr-1.5" />
            Discontinued
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="h-3 w-3 mr-1.5" />
            Unknown
          </Badge>
        );
    }
  };

  const getStockHealthStats = () => {
    const inStock = inventoryData.filter(item => item.status === 'in_stock').length;
    const lowStock = inventoryData.filter(item => item.status === 'low_stock').length;
    const outOfStock = inventoryData.filter(item => item.status === 'out_of_stock').length;
    const totalValue = inventoryData.reduce((sum, item) => sum + (item.current_stock * 100), 0); // Assuming ₹100 per unit
    const totalSKUs = inventoryData.length;
    const totalStockUnits = inventoryData.reduce((sum, item) => sum + item.current_stock, 0);
    
    return { inStock, lowStock, outOfStock, totalValue, totalItems: inventoryData.length, totalSKUs, totalStockUnits };
  };

  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleStockUpdate = () => {
    if (!selectedItem || !stockUpdateQuantity) return;
    
    const quantity = parseInt(stockUpdateQuantity);
    const updatedData = inventoryData.map(item => {
      if (item.id === selectedItem.id) {
        const newStock = stockUpdateType === 'in' 
          ? item.current_stock + quantity 
          : Math.max(0, item.current_stock - quantity);
        
        const newAvailable = newStock - item.reserved_stock;
        let newStatus: InventoryItem['status'] = 'in_stock';
        
        if (newStock === 0) newStatus = 'out_of_stock';
        else if (newStock <= item.threshold) newStatus = 'low_stock';
        
        return {
          ...item,
          current_stock: newStock,
          available_stock: newAvailable,
          status: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: 'Current User'
        };
      }
      return item;
    });
    
    setInventoryData(updatedData);
    setIsStockUpdateOpen(false);
    setStockUpdateQuantity('');
    setStockUpdateReason('');
    setSelectedItem(null);
  };

  const handleInlineStockEdit = (itemId: string, currentStock: number) => {
    setEditingStockId(itemId);
    setTempStockValue(currentStock.toString());
  };

  const handleInlineThresholdEdit = (itemId: string, currentThreshold: number) => {
    setEditingThresholdId(itemId);
    setTempThresholdValue(currentThreshold.toString());
  };

  const saveInlineStockEdit = (itemId: string) => {
    const newStock = parseInt(tempStockValue);
    if (isNaN(newStock) || newStock < 0) return;

    const updatedData = inventoryData.map(item => {
      if (item.id === itemId) {
        const newAvailable = newStock - item.reserved_stock;
        let newStatus: InventoryItem['status'] = 'in_stock';
        
        if (newStock === 0) newStatus = 'out_of_stock';
        else if (newStock <= item.threshold) newStatus = 'low_stock';

        return {
          ...item,
          current_stock: newStock,
          available_stock: newAvailable,
          status: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: 'Current User'
        };
      }
      return item;
    });

    setInventoryData(updatedData);
    setEditingStockId(null);
    setTempStockValue('');
  };

  const saveInlineThresholdEdit = (itemId: string) => {
    const newThreshold = parseInt(tempThresholdValue);
    if (isNaN(newThreshold) || newThreshold < 0) return;

    const updatedData = inventoryData.map(item => {
      if (item.id === itemId) {
        let newStatus = item.status;
        if (item.current_stock <= newThreshold) {
          newStatus = item.current_stock === 0 ? 'out_of_stock' : 'low_stock';
        } else {
          newStatus = 'in_stock';
        }

        return {
          ...item,
          threshold: newThreshold,
          status: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: 'Current User'
        };
      }
      return item;
    });

    setInventoryData(updatedData);
    setEditingThresholdId(null);
    setTempThresholdValue('');
  };

  const stats = getStockHealthStats();

  const DashboardView = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalItems}</p>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">12%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm font-medium text-muted-foreground">In Stock</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.inStock}</p>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">8%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.lowStock}</p>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                <span className="text-red-600">24%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              </div>
              <p className="text-3xl font-bold text-foreground">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">16%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inventoryData.filter(item => item.status === 'out_of_stock' || item.status === 'low_stock').map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img src={item.image_url} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(item.status)}
                  <div className="text-right">
                    <div className="font-medium">{item.current_stock} units</div>
                    <div className="text-sm text-muted-foreground">Threshold: {item.threshold}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredData.map(item => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <img src={item.image_url} alt={item.product_name} className="w-16 h-16 rounded-lg object-cover" />
                {getStatusBadge(item.status)}
              </div>
              
              <div>
                <h3 className="font-semibold truncate">{item.product_name}</h3>
                <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Current Stock:</span>
                  <span className="font-medium">{item.current_stock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available:</span>
                  <span className="font-medium text-green-600">{item.available_stock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reserved:</span>
                  <span className="font-medium text-yellow-600">{item.reserved_stock}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedItem(item);
                    setStockUpdateType('in');
                    setIsStockUpdateOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Stock In
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedItem(item);
                    setStockUpdateType('out');
                    setIsStockUpdateOpen(true);
                  }}
                >
                  <Minus className="h-3 w-3 mr-1" />
                  Stock Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableKPICards = () => (
    <div className="px-8 py-8">
      {/* Section Divider */}
      <div className="border-t mb-8"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <Package className="h-7 w-7 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span>Products</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-base font-medium text-muted-foreground">Total SKUs</p>
              <p className="text-4xl font-bold text-foreground">{stats.totalSKUs}</p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-green-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Value</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-base font-medium text-muted-foreground">Stock Value</p>
              <p className="text-4xl font-bold text-foreground">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">+16%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-yellow-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Items</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-base font-medium text-muted-foreground">Low Stock</p>
              <p className="text-4xl font-bold text-yellow-600">{stats.lowStock}</p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                <span className="text-red-600 font-medium">+24%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-200">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                <XCircle className="h-7 w-7 text-red-600" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <XCircle className="h-3 w-3" />
                  <span>Critical</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-base font-medium text-muted-foreground">Out of Stock</p>
              <p className="text-4xl font-bold text-red-600">{stats.outOfStock}</p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                <span className="text-red-600 font-medium">+8%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const TableView = () => (
    <div>
      <TableKPICards />
      
      {/* Section Divider */}
      <div className="px-8">
        <div className="border-t mb-8"></div>
      </div>

      <div className="px-8 pb-8">
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-card to-card/30">
          <CardHeader className="px-8 py-6 bg-muted/20 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">Inventory Items</CardTitle>
                <p className="text-muted-foreground mt-1">Manage your product inventory and stock levels</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">{filteredData.length} items</span>
                </div>
                <Button variant="outline" size="sm" className="px-4">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b bg-muted/10">
                    <TableHead className="font-semibold text-foreground py-6 px-8 w-80">Product</TableHead>
                    <TableHead className="font-semibold text-foreground py-6">Category</TableHead>
                    <TableHead className="font-semibold text-foreground py-6">Stock</TableHead>
                    <TableHead className="font-semibold text-foreground py-6">Available</TableHead>
                    <TableHead className="font-semibold text-foreground py-6">Reserved</TableHead>
                    <TableHead className="font-semibold text-foreground py-6">Status</TableHead>
                    <TableHead className="text-center font-semibold text-foreground py-6 w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow 
                    key={item.id} 
                    className={`hover:bg-muted/30 transition-colors border-b last:border-b-0 ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                    }`}
                  >
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted/50 overflow-hidden border-2 border-muted/20">
                          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground text-base leading-tight">{item.product_name}</div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono text-muted-foreground bg-muted/80 px-2 py-1 rounded-md text-xs">
                              {item.sku}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Threshold: {editingThresholdId === item.id ? (
                              <Input
                                value={tempThresholdValue}
                                onChange={(e) => setTempThresholdValue(e.target.value)}
                                className="w-16 h-6 text-xs inline-block ml-1"
                                type="number"
                                min="0"
                                autoFocus
                                onBlur={() => saveInlineThresholdEdit(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineThresholdEdit(item.id);
                                  if (e.key === 'Escape') {
                                    setEditingThresholdId(null);
                                    setTempThresholdValue('');
                                  }
                                }}
                              />
                            ) : (
                              <span 
                                className="cursor-pointer hover:bg-muted px-1 py-0.5 rounded font-medium"
                                onClick={() => handleInlineThresholdEdit(item.id, item.threshold)}
                                title="Click to edit threshold"
                              >
                                {item.threshold}
                              </span>
                            )}
                            <span className="ml-2 text-xs">
                              {item.supplier_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-6">
                      <div className="text-sm font-medium text-foreground bg-muted/30 px-3 py-2 rounded-lg w-fit">
                        {formatCategoryName(item.category)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-6">
                      {editingStockId === item.id ? (
                        <Input
                          value={tempStockValue}
                          onChange={(e) => setTempStockValue(e.target.value)}
                          className="w-20 h-8 text-sm"
                          type="number"
                          min="0"
                          autoFocus
                          onBlur={() => saveInlineStockEdit(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveInlineStockEdit(item.id);
                            if (e.key === 'Escape') {
                              setEditingStockId(null);
                              setTempStockValue('');
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span 
                            className={`text-2xl font-bold cursor-pointer hover:bg-muted px-2 py-1 rounded-lg transition-colors ${
                              item.current_stock <= item.threshold ? 'text-red-600' : 'text-foreground'
                            }`}
                            onClick={() => handleInlineStockEdit(item.id, item.current_stock)}
                            title="Click to edit stock"
                          >
                            {item.current_stock}
                          </span>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                              onClick={() => {
                                setSelectedItem(item);
                                setStockUpdateType('in');
                                setIsStockUpdateOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                              onClick={() => {
                                setSelectedItem(item);
                                setStockUpdateType('out');
                                setIsStockUpdateOpen(true);
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="py-6">
                      <span className="text-xl font-bold text-green-600">{item.available_stock}</span>
                    </TableCell>
                    
                    <TableCell className="py-6">
                      <span className="text-xl font-bold text-yellow-600">{item.reserved_stock}</span>
                    </TableCell>
                    
                    <TableCell className="py-6">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    
                    <TableCell className="text-center py-6">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800"
                          title="Stock History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800"
                          title="More Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-4 space-y-4">
              {filteredData.map((item, index) => (
                <Card key={item.id} className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Product Info Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-muted/50 overflow-hidden border-2 border-muted/20 flex-shrink-0">
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-base leading-tight truncate">{item.product_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-muted-foreground bg-muted/80 px-2 py-1 rounded text-xs">
                            {item.sku}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatCategoryName(item.category)}
                        </div>
                      </div>
                    </div>

                    {/* Stock Numbers */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Current</div>
                        {editingStockId === item.id ? (
                          <Input
                            value={tempStockValue}
                            onChange={(e) => setTempStockValue(e.target.value)}
                            className="w-full h-8 text-center text-sm mt-1"
                            type="number"
                            min="0"
                            autoFocus
                            onBlur={() => saveInlineStockEdit(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineStockEdit(item.id);
                              if (e.key === 'Escape') {
                                setEditingStockId(null);
                                setTempStockValue('');
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className={`text-xl font-bold cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors ${
                              item.current_stock <= item.threshold ? 'text-red-600' : 'text-foreground'
                            }`}
                            onClick={() => handleInlineStockEdit(item.id, item.current_stock)}
                            title="Tap to edit stock"
                          >
                            {item.current_stock}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Available</div>
                        <div className="text-xl font-bold text-green-600">{item.available_stock}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Reserved</div>
                        <div className="text-xl font-bold text-yellow-600">{item.reserved_stock}</div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 px-3 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                          onClick={() => {
                            setSelectedItem(item);
                            setStockUpdateType('in');
                            setIsStockUpdateOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Stock In
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 px-3 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          onClick={() => {
                            setSelectedItem(item);
                            setStockUpdateType('out');
                            setIsStockUpdateOpen(true);
                          }}
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Stock Out
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800"
                          title="More"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                      <span>
                        Threshold: {editingThresholdId === item.id ? (
                          <Input
                            value={tempThresholdValue}
                            onChange={(e) => setTempThresholdValue(e.target.value)}
                            className="w-12 h-5 text-xs inline-block ml-1"
                            type="number"
                            min="0"
                            autoFocus
                            onBlur={() => saveInlineThresholdEdit(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineThresholdEdit(item.id);
                              if (e.key === 'Escape') {
                                setEditingThresholdId(null);
                                setTempThresholdValue('');
                              }
                            }}
                          />
                        ) : (
                          <span 
                            className="cursor-pointer hover:bg-muted px-1 rounded font-medium"
                            onClick={() => handleInlineThresholdEdit(item.id, item.threshold)}
                            title="Tap to edit threshold"
                          >
                            {item.threshold}
                          </span>
                        )}
                      </span>
                      <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
    </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header with sticky search and filters */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="p-8 pb-6">
            {/* Page Title */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Inventory</h1>
                <p className="text-muted-foreground text-lg">
                  Track, update, and manage stock across all products
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="default" className="px-6">
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan Barcode
                </Button>
                <Button variant="outline" size="default" className="px-6">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="default" className="px-6">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Shopify
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>

            {/* Search and Filters Row */}
            <Card className="border-0 shadow-lg rounded-2xl bg-card/50">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Search products, SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 text-base rounded-xl border-2 focus:border-primary"
                      />
                    </div>
                    
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-56 h-12 rounded-xl border-2">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {formatCategoryName(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-56 h-12 rounded-xl border-2">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {formatStatusName(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-8 bg-muted/50 rounded-xl p-2">
                    <Button
                      size="default"
                      variant="ghost"
                      className={`px-4 py-2 rounded-lg ${viewMode === 'dashboard' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setViewMode('dashboard')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button
                      size="default"
                      variant="ghost"
                      className={`px-4 py-2 rounded-lg ${viewMode === 'table' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setViewMode('table')}
                    >
                      <List className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      size="default"
                      variant="ghost"
                      className={`px-4 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'dashboard' && <DashboardView />}
        {viewMode === 'table' && <TableView />}
        {viewMode === 'grid' && <GridView />}

        {/* Stock Update Modal */}
        <Dialog open={isStockUpdateOpen} onOpenChange={setIsStockUpdateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Stock {stockUpdateType === 'in' ? 'In' : 'Out'} - {selectedItem?.product_name}
              </DialogTitle>
              <DialogDescription>
                Update stock levels for {selectedItem?.sku}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Current Stock: {selectedItem?.current_stock} units</Label>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity..."
                  value={stockUpdateQuantity}
                  onChange={(e) => setStockUpdateQuantity(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder={stockUpdateType === 'in' ? "e.g., New shipment received, RTO processed..." : "e.g., Sale, Damage, Quality issue..."}
                  value={stockUpdateReason}
                  onChange={(e) => setStockUpdateReason(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStockUpdateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStockUpdate} disabled={!stockUpdateQuantity}>
                Update Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}