import React, { useState, useEffect, useMemo } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Checkbox
} from "@/components/ui/checkbox";
import {
  Switch
} from "@/components/ui/switch";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronDown,
  Save,
  X,
  BookOpen,
  FilterX,
  SlidersHorizontal,
  PieChart as PieChartIcon,
  Bell,
  BellOff,
  Zap,
  ShieldAlert,
  Upload,
  Image as ImageIcon,
  Camera
} from "lucide-react";

// Types are imported from @/types/inventory

export default function Inventory() {
  // Use the inventory hook for real data
  const { products: inventoryProducts, loading: inventoryLoading, error: inventoryError } = useInventory();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all']);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(['all']);
  const [stockRange, setStockRange] = useState<{min: number | ''; max: number | ''}>({min: '', max: ''});
  const [priceRange, setPriceRange] = useState<{min: number | ''; max: number | ''}>({min: '', max: ''});
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedSearchOptions, setAdvancedSearchOptions] = useState<AdvancedSearchOptions>({
    searchIn: ['product_name', 'sku'],
    caseSensitive: false,
    exactMatch: false,
    useRegex: false
  });
  const [useFuzzySearch, setUseFuzzySearch] = useState(true);
  const [fuzzyThreshold, setFuzzyThreshold] = useState(0.3);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  
  // Bulk operations state
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<'stock_in' | 'stock_out' | 'update_threshold' | 'update_category' | 'update_supplier' | 'update_status'>('stock_in');
  const [bulkValue, setBulkValue] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkNewCategory, setBulkNewCategory] = useState('');
  const [bulkNewSupplier, setBulkNewSupplier] = useState('');
  const [bulkNewStatus, setBulkNewStatus] = useState<InventoryItem['status']>('in_stock');
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  
  // Stock prediction and auto-reorder state
  const [stockPredictions, setStockPredictions] = useState<StockPrediction[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [showPredictionPanel, setShowPredictionPanel] = useState(false);
  const [selectedPredictionPeriod, setSelectedPredictionPeriod] = useState<30 | 60 | 90>(30);
  
  // Audit log state
  const [auditLogs, setAuditLogs] = useState<InventoryLog[]>([]);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [auditFilter, setAuditFilter] = useState<'all' | 'stock_in' | 'stock_out' | 'adjustment' | 'transfer' | 'damage' | 'return'>('all');
  const [auditDateRange, setAuditDateRange] = useState<{from: string; to: string}>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    to: new Date().toISOString().split('T')[0] // today
  });
  
  // Smart alert system state
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'overstocked' | 'threshold_breach'>('all');
  const [alertPriority, setAlertPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  
  // Add Product modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    sku: '',
    category: 'custom_jewelry' as InventoryItem['category'],
    supplier_name: '',
    current_stock: 0,
    threshold: 10,
    cost_per_unit: 0,
    description: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isStockUpdateOpen, setIsStockUpdateOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockUpdateType, setStockUpdateType] = useState<'in' | 'out'>('in');
  const [stockUpdateQuantity, setStockUpdateQuantity] = useState('');
  const [stockUpdateReason, setStockUpdateReason] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');
  const [tempThresholdValue, setTempThresholdValue] = useState<string>('');
  
  // Barcode scanning state
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  
  // Shopify sync state
  const [isShopifySyncing, setIsShopifySyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('lastShopifySync'));
  
  // New state for enhanced table features
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

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
        product_name: product.product?.name || 'Unknown Product',
        sku: product.sku || 'NO-SKU',
        category: product.product?.category?.name || 'uncategorized',
        supplier_id: product.supplier?.id || '',
        supplier_name: product.supplier?.name || 'Unknown Supplier',
        base_stock: currentStock,
        current_stock: currentStock,
        reserved_stock: product.allocated_stock || 0,
        available_stock: product.available_stock || currentStock,
        threshold: threshold,
        status: status,
        cost_per_unit: product.cost || 0,
        description: product.product?.description || '',
        location: product.warehouse?.name || 'Unknown Location',
        image_url: product.product?.image_url || '/api/placeholder/60/60',
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        created_by: 'system',
        updated_by: 'system'
      };
    });
  }, [inventoryProducts]);

  // Keep setInventoryData for backward compatibility with existing functions
  const [, setInventoryData] = useState<InventoryItem[]>([]);
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
      cost_per_unit: 15000,
      description: 'Premium 18K gold chain necklace with intricate design, perfect for weddings and special occasions',
      location: 'Warehouse-A-Shelf-12',
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
      cost_per_unit: 2500,
      description: '925 sterling silver earrings with traditional Rajasthani craftsmanship and oxidized finish',
      location: 'Warehouse-B-Shelf-05',
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
      cost_per_unit: 75,
      description: 'Luxury velvet-lined jewelry gift box with magnetic closure and embossed logo',
      location: 'Storage-C-Section-08',
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
      cost_per_unit: 85000,
      description: 'Brilliant cut 1.5 carat diamond solitaire ring in 18K white gold setting with GIA certification',
      location: 'Vault-A-Secure-01',
      image_url: '/api/placeholder/60/60',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T14:20:00Z',
      created_by: 'admin',
      updated_by: 'Neha Patel'
    },
    {
      id: '5',
      product_name: 'Rose Gold Bracelet',
      sku: 'RGB-14K-005',
      category: 'non_custom_jewelry',
      supplier_id: 'sup-005',
      supplier_name: 'Chennai Jewelry Works',
      base_stock: 75,
      current_stock: 8,
      reserved_stock: 2,
      available_stock: 6,
      threshold: 10,
      status: 'low_stock',
      cost_per_unit: 12000,
      description: 'Elegant 14K rose gold bracelet with delicate chain links and secure clasp',
      location: 'Warehouse-A-Shelf-08',
      image_url: '/api/placeholder/60/60',
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-16T12:15:00Z',
      created_by: 'admin',
      updated_by: 'Arjun Reddy'
    },
    {
      id: '6',
      product_name: 'Silk Jewelry Pouch',
      sku: 'SJP-RED-006',
      category: 'packaging',
      supplier_id: 'sup-003',
      supplier_name: 'Delhi Packaging Co',
      base_stock: 1000,
      current_stock: 750,
      reserved_stock: 25,
      available_stock: 725,
      threshold: 100,
      status: 'in_stock',
      cost_per_unit: 25,
      description: 'Premium silk jewelry pouch with drawstring closure in vibrant red color',
      location: 'Storage-C-Section-12',
      image_url: '/api/placeholder/60/60',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-14T09:30:00Z',
      created_by: 'admin',
      updated_by: 'Kavitha Nair'
    },
    {
      id: '7',
      product_name: 'Pearl Pendant Set',
      sku: 'PPS-WHT-007',
      category: 'custom_jewelry',
      supplier_id: 'sup-006',
      supplier_name: 'Hyderabad Pearl Center',
      base_stock: 60,
      current_stock: 0,
      reserved_stock: 0,
      available_stock: 0,
      threshold: 15,
      status: 'out_of_stock',
      cost_per_unit: 8500,
      description: 'Freshwater pearl pendant set with matching earrings in sterling silver setting',
      location: 'Warehouse-B-Shelf-15',
      image_url: '/api/placeholder/60/60',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-13T16:45:00Z',
      created_by: 'admin',
      updated_by: 'Meera Shah'
    },
    {
      id: '8',
      product_name: 'Gold Polishing Cloth',
      sku: 'GPC-PRO-008',
      category: 'accessories',
      supplier_id: 'sup-007',
      supplier_name: 'Professional Tools Ltd',
      base_stock: 500,
      current_stock: 125,
      reserved_stock: 15,
      available_stock: 110,
      threshold: 50,
      status: 'in_stock',
      cost_per_unit: 45,
      description: 'Professional-grade gold and silver polishing cloth for jewelry maintenance',
      location: 'Storage-D-Bin-03',
      image_url: '/api/placeholder/60/60',
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-15T11:20:00Z',
      created_by: 'admin',
      updated_by: 'Ravi Kumar'
    }
  ]);

  // Initialize default filter presets
  React.useEffect(() => {
    if (savedPresets.length === 0) {
      setSavedPresets([
        {
          id: 'default-low-stock',
          name: 'Low Stock Alert',
          filters: {
            search: '',
            categories: ['all'] as (InventoryCategory | 'all')[],
            statuses: ['low_stock', 'out_of_stock'] as (InventoryStatus | 'all')[],
            suppliers: ['all'],
            locations: []
          },
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'jewelry-only',
          name: 'Jewelry Items',
          filters: {
            search: '',
            categories: ['custom_jewelry', 'non_custom_jewelry'] as (InventoryCategory | 'all')[],
            statuses: ['all'] as (InventoryStatus | 'all')[],
            suppliers: ['all'],
            locations: []
          },
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
  }, [savedPresets.length]);

  // Enhanced table helper functions
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowSelection = (itemId: string, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(itemId);
    } else {
      newSelectedRows.delete(itemId);
    }
    setSelectedRows(newSelectedRows);
  };

  const toggleExpandRow = (itemId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(itemId)) {
      newExpandedRows.delete(itemId);
    } else {
      newExpandedRows.add(itemId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredData.map(item => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const getSortedData = () => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField as keyof InventoryItem];
      const bValue = b[sortField as keyof InventoryItem];
      
      // Handle numeric fields
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  };

  const categories = ['all', 'custom_jewelry', 'non_custom_jewelry', 'packaging', 'raw_materials', 'tools_equipment', 'accessories', 'gift_items'];
  const statuses = ['all', 'in_stock', 'low_stock', 'out_of_stock', 'discontinued', 'on_order', 'reserved'];
  const suppliers = ['all', ...Array.from(new Set(inventoryData.map(item => item.supplier_name || 'Unknown')))];

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
    const totalValue = inventoryData.reduce((sum, item) => sum + (item.current_stock * (item.cost_per_unit || 0)), 0);
    const totalSKUs = inventoryData.length;
    const totalStockUnits = inventoryData.reduce((sum, item) => sum + item.current_stock, 0);
    const averageStockValue = totalSKUs > 0 ? totalValue / totalSKUs : 0;
    const criticalItems = inventoryData.filter(item => item.current_stock <= item.threshold * 0.5).length;
    const overStocked = inventoryData.filter(item => item.current_stock > item.threshold * 3).length;
    
    return { 
      inStock, 
      lowStock, 
      outOfStock, 
      totalValue, 
      totalItems: inventoryData.length, 
      totalSKUs, 
      totalStockUnits,
      averageStockValue,
      criticalItems,
      overStocked
    };
  };

  const stats = getStockHealthStats();

  // Analytics data for charts
  const getAnalyticsData = () => {
    // Category breakdown
    const categoryData = categories.filter(cat => cat !== 'all').map(category => {
      const items = inventoryData.filter(item => item.category === category);
      const value = items.reduce((sum, item) => sum + (item.current_stock * (item.cost_per_unit || 0)), 0);
      const count = items.length;
      return {
        name: formatCategoryName(category),
        value: value / 100000, // Convert to lakhs
        count,
        percentage: Math.round((count / inventoryData.length) * 100)
      };
    });

    // Stock status distribution
    const statusData = [
      { name: 'In Stock', value: stats.inStock, color: '#22c55e', percentage: Math.round((stats.inStock / stats.totalItems) * 100) },
      { name: 'Low Stock', value: stats.lowStock, color: '#f59e0b', percentage: Math.round((stats.lowStock / stats.totalItems) * 100) },
      { name: 'Out of Stock', value: stats.outOfStock, color: '#ef4444', percentage: Math.round((stats.outOfStock / stats.totalItems) * 100) }
    ];

    // Stock trends (simulated monthly data)
    const stockTrends = [
      { month: 'Jan', totalValue: 45, stockIn: 120, stockOut: 95, netChange: 25 },
      { month: 'Feb', totalValue: 52, stockIn: 140, stockOut: 110, netChange: 30 },
      { month: 'Mar', totalValue: 48, stockIn: 100, stockOut: 130, netChange: -30 },
      { month: 'Apr', totalValue: 61, stockIn: 180, stockOut: 120, netChange: 60 },
      { month: 'May', totalValue: 55, stockIn: 150, stockOut: 160, netChange: -10 },
      { month: 'Jun', totalValue: 67, stockIn: 200, stockOut: 140, netChange: 60 }
    ];

    // Top suppliers by value
    const supplierData = Array.from(new Set(inventoryData.map(item => item.supplier_name)))
      .filter(supplier => supplier)
      .map(supplier => {
        const items = inventoryData.filter(item => item.supplier_name === supplier);
        const totalValue = items.reduce((sum, item) => sum + (item.current_stock * (item.cost_per_unit || 0)), 0);
        const totalItems = items.length;
        return {
          name: supplier!,
          value: totalValue / 100000, // Convert to lakhs
          items: totalItems,
          avgValue: totalItems > 0 ? totalValue / totalItems : 0
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Stock health radial data
    const stockHealthData = [
      {
        name: 'Stock Health',
        healthy: Math.round(((stats.inStock / stats.totalItems) * 100)),
        warning: Math.round(((stats.lowStock / stats.totalItems) * 100)),
        critical: Math.round(((stats.outOfStock / stats.totalItems) * 100))
      }
    ];

    return {
      categoryData,
      statusData,
      stockTrends,
      supplierData,
      stockHealthData
    };
  };

  const analyticsData = getAnalyticsData();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Setup Fuse.js for fuzzy search
  const fuseOptions = useMemo(() => ({
    keys: advancedSearchOptions.searchIn.map(field => {
      switch(field) {
        case 'product_name': return 'product_name';
        case 'sku': return 'sku';
        case 'description': return 'description';
        case 'supplier_name': return 'supplier_name';
        default: return field;
      }
    }),
    threshold: fuzzyThreshold,
    ignoreCase: !advancedSearchOptions.caseSensitive,
    includeScore: true,
    includeMatches: true,
    findAllMatches: true,
    minMatchCharLength: 2
  }), [advancedSearchOptions.searchIn, fuzzyThreshold, advancedSearchOptions.caseSensitive]);

  const fuse = useMemo(() => new Fuse(inventoryData, fuseOptions), [inventoryData, fuseOptions]);

  // Advanced filtering function with fuzzy search
  const getFilteredData = () => {
    let dataToFilter = inventoryData;
    
    // Apply search filter first
    if (searchTerm.trim()) {
      if (useFuzzySearch && !advancedSearchOptions.exactMatch && !advancedSearchOptions.useRegex) {
        // Use fuzzy search
        const fuzzyResults = fuse.search(searchTerm);
        dataToFilter = fuzzyResults.map(result => result.item);
      } else {
        // Use traditional search
        const searchValue = advancedSearchOptions.caseSensitive ? searchTerm : searchTerm.toLowerCase();
        const fieldsToSearch = advancedSearchOptions.searchIn;
        
        dataToFilter = inventoryData.filter(item => {
          return fieldsToSearch.some(field => {
            let fieldValue = '';
            switch(field) {
              case 'product_name':
                fieldValue = item.product_name;
                break;
              case 'sku':
                fieldValue = item.sku;
                break;
              case 'description':
                fieldValue = item.description || '';
                break;
              case 'supplier_name':
                fieldValue = item.supplier_name || '';
                break;
            }
            
            if (!advancedSearchOptions.caseSensitive) {
              fieldValue = fieldValue.toLowerCase();
            }
            
            if (advancedSearchOptions.exactMatch) {
              return fieldValue === searchValue;
            } else if (advancedSearchOptions.useRegex) {
              try {
                return new RegExp(searchValue).test(fieldValue);
              } catch {
                return fieldValue.includes(searchValue);
              }
            } else {
              return fieldValue.includes(searchValue);
            }
          });
        });
      }
    }
    
    // Apply other filters
    return dataToFilter.filter(item => {
      // Category filter
      const matchesCategory = selectedCategories.includes('all') || 
                             selectedCategories.includes(item.category);
      
      // Status filter  
      const matchesStatus = selectedStatuses.includes('all') || 
                           selectedStatuses.includes(item.status);
      
      // Supplier filter
      const matchesSupplier = selectedSuppliers.includes('all') || 
                             selectedSuppliers.includes(item.supplier_name || 'Unknown');
      
      // Stock range filter
      const matchesStockRange = (!stockRange.min || item.current_stock >= stockRange.min) &&
                               (!stockRange.max || item.current_stock <= stockRange.max);
      
      // Price range filter
      const matchesPriceRange = (!priceRange.min || (item.cost_per_unit || 0) >= priceRange.min) &&
                               (!priceRange.max || (item.cost_per_unit || 0) <= priceRange.max);
      
      return matchesCategory && matchesStatus && matchesSupplier && 
             matchesStockRange && matchesPriceRange;
    });
  };
  
  const filteredData = getFilteredData();

  // Get search suggestions for auto-complete
  const getSearchSuggestions = (query: string, limit: number = 5) => {
    if (!query.trim() || query.length < 2) return [];
    
    const suggestions = new Set<string>();
    const results = fuse.search(query);
    
    results.slice(0, limit * 2).forEach(result => {
      const item = result.item;
      advancedSearchOptions.searchIn.forEach(field => {
        let value = '';
        switch(field) {
          case 'product_name': value = item.product_name; break;
          case 'sku': value = item.sku; break;
          case 'description': value = item.description || ''; break;
          case 'supplier_name': value = item.supplier_name || ''; break;
        }
        if (value && value.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(value);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, limit);
  };

  // Bulk operations functions
  const getSelectedItems = () => {
    return inventoryData.filter(item => selectedRows.has(item.id));
  };

  const applyBulkOperation = () => {
    if (selectedRows.size === 0) return;

    const selectedItems = getSelectedItems();
    const updatedData = inventoryData.map(item => {
      if (!selectedRows.has(item.id)) return item;

      const updatedItem = { ...item };
      const currentTime = new Date().toISOString();

      switch (bulkOperation) {
        case 'stock_in': {
          const addQuantity = parseInt(bulkValue) || 0;
          updatedItem.current_stock += addQuantity;
          updatedItem.available_stock = updatedItem.current_stock - updatedItem.reserved_stock;
          if (updatedItem.current_stock > updatedItem.threshold) {
            updatedItem.status = 'in_stock';
          }
          break;
        }

        case 'stock_out': {
          const subtractQuantity = parseInt(bulkValue) || 0;
          updatedItem.current_stock = Math.max(0, updatedItem.current_stock - subtractQuantity);
          updatedItem.available_stock = updatedItem.current_stock - updatedItem.reserved_stock;
          if (updatedItem.current_stock === 0) {
            updatedItem.status = 'out_of_stock';
          } else if (updatedItem.current_stock <= updatedItem.threshold) {
            updatedItem.status = 'low_stock';
          }
          break;
        }

        case 'update_threshold': {
          const newThreshold = parseInt(bulkValue) || 0;
          updatedItem.threshold = newThreshold;
          if (updatedItem.current_stock <= newThreshold) {
            updatedItem.status = updatedItem.current_stock === 0 ? 'out_of_stock' : 'low_stock';
          } else {
            updatedItem.status = 'in_stock';
          }
          break;
        }

        case 'update_category': {
          if (bulkNewCategory && categories.includes(bulkNewCategory)) {
            updatedItem.category = bulkNewCategory as InventoryItem['category'];
          }
          break;
        }

        case 'update_supplier': {
          if (bulkNewSupplier) {
            updatedItem.supplier_name = bulkNewSupplier;
            updatedItem.supplier_id = `sup-${Date.now()}`;
          }
          break;
        }

        case 'update_status': {
          updatedItem.status = bulkNewStatus;
          break;
        }
      }

      updatedItem.updated_at = currentTime;
      updatedItem.updated_by = 'Current User';
      return updatedItem;
    });

    setInventoryData(updatedData);
    setSelectedRows(new Set());
    setIsBulkEditOpen(false);
    setBulkValue('');
    setBulkReason('');
    setBulkNewCategory('');
    setBulkNewSupplier('');
    setBulkNewStatus('in_stock');
    setShowBulkPreview(false);
  };

  const getBulkOperationPreview = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) return [];

    return selectedItems.map(item => {
      const preview = { ...item };
      
      switch (bulkOperation) {
        case 'stock_in': {
          const addQty = parseInt(bulkValue) || 0;
          preview.current_stock += addQty;
          preview.available_stock = preview.current_stock - preview.reserved_stock;
          break;
        }
        case 'stock_out': {
          const subtractQty = parseInt(bulkValue) || 0;
          preview.current_stock = Math.max(0, preview.current_stock - subtractQty);
          preview.available_stock = preview.current_stock - preview.reserved_stock;
          break;
        }
        case 'update_threshold': {
          preview.threshold = parseInt(bulkValue) || 0;
          break;
        }
        case 'update_category': {
          if (bulkNewCategory) preview.category = bulkNewCategory as InventoryItem['category'];
          break;
        }
        case 'update_supplier': {
          if (bulkNewSupplier) preview.supplier_name = bulkNewSupplier;
          break;
        }
        case 'update_status': {
          preview.status = bulkNewStatus;
          break;
        }
      }
      return preview;
    });
  };

  const exportSelectedItems = (format: 'csv' | 'json' | 'excel') => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) return;

    const dataToExport = selectedItems.map(item => ({
      'Product Name': item.product_name,
      'SKU': item.sku,
      'Category': formatCategoryName(item.category),
      'Supplier': item.supplier_name || 'Unknown',
      'Current Stock': item.current_stock,
      'Available Stock': item.available_stock,
      'Reserved Stock': item.reserved_stock,
      'Threshold': item.threshold,
      'Status': formatStatusName(item.status),
      'Cost Per Unit': item.cost_per_unit || 0,
      'Total Value': (item.current_stock * (item.cost_per_unit || 0)),
      'Location': item.location || '',
      'Last Updated': new Date(item.updated_at).toLocaleDateString(),
      'Updated By': item.updated_by
    }));

    if (format === 'json') {
      const jsonData = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-export-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvHeaders = Object.keys(dataToExport[0]).join(',');
      const csvRows = dataToExport.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-export-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Mock sales history data (in real app, this would come from Supabase)
  const generateMockSalesHistory = (productId: string): SalesHistory[] => {
    const history: SalesHistory[] = [];
    const now = new Date();
    
    // Generate 90 days of mock sales data
    for (let i = 90; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Create realistic sales patterns with some randomness
      const baseVelocity = Math.random() * 5 + 1; // 1-6 units per day base
      const seasonalFactor = 1 + Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.3; // Seasonal variation
      const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1.2; // Lower sales on weekends
      const randomFactor = 0.5 + Math.random(); // Random variation
      
      const dailySales = Math.max(0, Math.round(baseVelocity * seasonalFactor * weekendFactor * randomFactor));
      
      history.push({
        product_id: productId,
        date: date.toISOString().split('T')[0],
        quantity_sold: dailySales,
        revenue: dailySales * 1000, // Mock revenue
        order_count: Math.ceil(dailySales / 2)
      });
    }
    
    return history;
  };

  // Stock prediction algorithm
  const calculateStockPrediction = (item: InventoryItem): StockPrediction => {
    const salesHistory = generateMockSalesHistory(item.id);
    const recentHistory = salesHistory.slice(-30); // Last 30 days
    const olderHistory = salesHistory.slice(-60, -30); // Previous 30 days
    
    // Calculate sales velocities
    const totalSales30Days = recentHistory.reduce((sum, day) => sum + day.quantity_sold, 0);
    const totalSales60Days = olderHistory.reduce((sum, day) => sum + day.quantity_sold, 0);
    
    const dailyVelocity = totalSales30Days / 30;
    const weeklyVelocity = dailyVelocity * 7;
    const monthlyVelocity = dailyVelocity * 30;
    
    // Trend analysis
    const recentAvg = totalSales30Days / 30;
    const olderAvg = totalSales60Days / 30;
    const trendChange = (recentAvg - olderAvg) / olderAvg;
    
    let trendDirection: 'increasing' | 'decreasing' | 'stable';
    if (trendChange > 0.1) trendDirection = 'increasing';
    else if (trendChange < -0.1) trendDirection = 'decreasing';
    else trendDirection = 'stable';
    
    // Seasonal factor (simplified)
    const currentMonth = new Date().getMonth();
    const seasonalFactors = [0.8, 0.9, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.3, 1.4, 1.2]; // Mock seasonal pattern
    const seasonalFactor = seasonalFactors[currentMonth];
    
    // Adjust velocity for trend and seasonality
    const adjustedDailyVelocity = dailyVelocity * (1 + trendChange) * seasonalFactor;
    
    // Predict days until stockout
    const daysUntilStockout = adjustedDailyVelocity > 0 ? 
      Math.max(0, Math.floor(item.current_stock / adjustedDailyVelocity)) : 999;
    
    // Confidence score based on data consistency
    const velocityVariance = recentHistory.reduce((sum, day) => 
      sum + Math.pow(day.quantity_sold - dailyVelocity, 2), 0) / recentHistory.length;
    const confidenceScore = Math.max(0.1, Math.min(1.0, 1 - (velocityVariance / (dailyVelocity + 1))));
    
    // Risk level determination
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (daysUntilStockout <= 7) riskLevel = 'critical';
    else if (daysUntilStockout <= 14) riskLevel = 'high';
    else if (daysUntilStockout <= 30) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Predict stock in future
    const predictedStockIn30Days = Math.max(0, item.current_stock - (adjustedDailyVelocity * 30));
    
    // Recommended reorder date (when stock hits threshold)
    const daysToThreshold = adjustedDailyVelocity > 0 ? 
      Math.max(0, Math.floor((item.current_stock - item.threshold) / adjustedDailyVelocity)) : 999;
    const reorderDate = new Date();
    reorderDate.setDate(reorderDate.getDate() + daysToThreshold - 7); // Order 7 days before hitting threshold
    
    // Recommended reorder quantity (to last 60 days)
    const recommendedQuantity = Math.ceil(adjustedDailyVelocity * 60);
    
    return {
      product_id: item.id,
      product_name: item.product_name,
      sku: item.sku,
      current_stock: item.current_stock,
      predicted_days_until_stockout: daysUntilStockout,
      daily_sales_velocity: adjustedDailyVelocity,
      weekly_sales_velocity: adjustedDailyVelocity * 7,
      monthly_sales_velocity: adjustedDailyVelocity * 30,
      seasonal_factor: seasonalFactor,
      trend_direction: trendDirection,
      confidence_score: confidenceScore,
      risk_level: riskLevel,
      predicted_stock_in_30_days: predictedStockIn30Days,
      recommended_reorder_date: reorderDate.toISOString(),
      recommended_reorder_quantity: recommendedQuantity,
      last_updated: new Date().toISOString()
    };
  };

  // Generate reorder suggestions
  const generateReorderSuggestions = (predictions: StockPrediction[]): ReorderSuggestion[] => {
    return predictions
      .filter(pred => pred.risk_level === 'high' || pred.risk_level === 'critical' || pred.predicted_days_until_stockout <= 30)
      .map(pred => {
        const item = inventoryData.find(i => i.id === pred.product_id)!;
        const leadTime = 7; // Mock 7-day lead time
        const safetyStock = Math.ceil(pred.daily_sales_velocity * leadTime * 1.5); // 1.5x lead time demand
        const suggestedQuantity = Math.max(
          pred.recommended_reorder_quantity,
          safetyStock + Math.ceil(pred.daily_sales_velocity * 30) // 30 days supply
        );
        
        let urgency: 'low' | 'medium' | 'high' | 'urgent';
        if (pred.predicted_days_until_stockout <= 7) urgency = 'urgent';
        else if (pred.predicted_days_until_stockout <= 14) urgency = 'high';
        else if (pred.predicted_days_until_stockout <= 21) urgency = 'medium';
        else urgency = 'low';
        
        const expectedStockoutDate = new Date();
        expectedStockoutDate.setDate(expectedStockoutDate.getDate() + pred.predicted_days_until_stockout);
        
        // Calculate potential savings (mock calculation)
        const currentValue = item.current_stock * (item.cost_per_unit || 0);
        const suggestedValue = suggestedQuantity * (item.cost_per_unit || 0);
        const savingsPotential = Math.max(0, currentValue - suggestedValue) * 0.1; // 10% savings estimate
        
        let reason = '';
        if (pred.risk_level === 'critical') {
          reason = `Critical: Stock will run out in ${pred.predicted_days_until_stockout} days`;
        } else if (pred.trend_direction === 'increasing') {
          reason = `Growing demand detected (${(pred.daily_sales_velocity * 30).toFixed(0)} units/month)`;
        } else {
          reason = `Low stock warning: ${pred.predicted_days_until_stockout} days remaining`;
        }
        
        return {
          product_id: pred.product_id,
          product_name: pred.product_name,
          sku: pred.sku,
          current_stock: pred.current_stock,
          suggested_quantity: suggestedQuantity,
          estimated_cost: suggestedQuantity * (item.cost_per_unit || 0),
          supplier_id: item.supplier_id,
          supplier_name: item.supplier_name || 'Unknown',
          lead_time_days: leadTime,
          sales_velocity: pred.daily_sales_velocity,
          priority_score: (4 - ['low', 'medium', 'high', 'urgent'].indexOf(urgency)) * 25,
          reason,
          urgency,
          expected_stockout_date: expectedStockoutDate.toISOString(),
          savings_potential: savingsPotential
        };
      })
      .sort((a, b) => b.priority_score - a.priority_score);
  };

  // Calculate predictions on component mount and when inventory changes
  React.useEffect(() => {
    const predictions = inventoryData.map(calculateStockPrediction);
    setStockPredictions(predictions);
    
    const suggestions = generateReorderSuggestions(predictions);
    setReorderSuggestions(suggestions);
  }, [inventoryData]);

  const handleStockUpdate = () => {
    if (!selectedItem || !stockUpdateQuantity) return;
    
    const quantity = parseInt(stockUpdateQuantity);
    const previousStock = selectedItem.current_stock;
    
    const updatedData = inventoryData.map(item => {
      if (item.id === selectedItem.id) {
        const newStock = stockUpdateType === 'in' 
          ? item.current_stock + quantity 
          : Math.max(0, item.current_stock - quantity);
        
        const newAvailable = newStock - item.reserved_stock;
        let newStatus: InventoryItem['status'] = 'in_stock';
        
        if (newStock === 0) newStatus = 'out_of_stock';
        else if (newStock <= item.threshold) newStatus = 'low_stock';
        
        // Add audit log
        addAuditLog({
          product_id: item.id,
          action_type: stockUpdateType === 'in' ? 'stock_in' : 'stock_out',
          quantity: quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          reason: stockUpdateReason || `Manual ${stockUpdateType === 'in' ? 'stock in' : 'stock out'}`,
          user_id: 'current-user',
          user_name: 'Current User',
          notes: stockUpdateReason
        });
        
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

  // Smart Alert System Functions
  const generateSmartAlerts = (): InventoryAlert[] => {
    const alerts: InventoryAlert[] = [];
    const now = new Date().toISOString();
    
    inventoryData.forEach(item => {
      const prediction = stockPredictions.find(p => p.product_id === item.id);
      
      // Low Stock Alert
      if (item.current_stock <= item.threshold && item.current_stock > 0) {
        alerts.push({
          id: `alert-low-${item.id}`,
          product_id: item.id,
          product_name: item.product_name,
          sku: item.sku,
          alert_type: 'low_stock',
          current_stock: item.current_stock,
          threshold: item.threshold,
          priority: item.current_stock <= item.threshold * 0.5 ? 'high' : 'medium',
          status: 'active',
          created_at: now,
          auto_reorder_suggested: prediction?.risk_level === 'high' || prediction?.risk_level === 'critical',
          suggested_quantity: prediction?.recommended_reorder_quantity || Math.ceil(item.threshold * 2)
        });
      }
      
      // Out of Stock Alert
      if (item.current_stock === 0) {
        alerts.push({
          id: `alert-out-${item.id}`,
          product_id: item.id,
          product_name: item.product_name,
          sku: item.sku,
          alert_type: 'out_of_stock',
          current_stock: item.current_stock,
          threshold: item.threshold,
          priority: 'critical',
          status: 'active',
          created_at: now,
          auto_reorder_suggested: true,
          suggested_quantity: prediction?.recommended_reorder_quantity || Math.ceil(item.threshold * 3)
        });
      }
      
      // Overstocked Alert
      if (item.current_stock > item.threshold * 5) {
        alerts.push({
          id: `alert-over-${item.id}`,
          product_id: item.id,
          product_name: item.product_name,
          sku: item.sku,
          alert_type: 'overstocked',
          current_stock: item.current_stock,
          threshold: item.threshold,
          priority: 'low',
          status: 'active',
          created_at: now,
          auto_reorder_suggested: false
        });
      }
      
      // Threshold Breach Alert (significant change from threshold)
      if (prediction && prediction.predicted_days_until_stockout <= 7 && item.current_stock > 0) {
        alerts.push({
          id: `alert-breach-${item.id}`,
          product_id: item.id,
          product_name: item.product_name,
          sku: item.sku,
          alert_type: 'threshold_breach',
          current_stock: item.current_stock,
          threshold: item.threshold,
          priority: 'critical',
          status: 'active',
          created_at: now,
          auto_reorder_suggested: true,
          suggested_quantity: prediction.recommended_reorder_quantity
        });
      }
    });
    
    return alerts.filter(alert => !dismissedAlerts.has(alert.id));
  };

  // Update alerts when inventory or predictions change
  React.useEffect(() => {
    const newAlerts = generateSmartAlerts();
    setAlerts(newAlerts);
  }, [inventoryData, stockPredictions, dismissedAlerts]);

  // Alert management functions
  const getFilteredAlerts = () => {
    return alerts.filter(alert => {
      const matchesType = alertFilter === 'all' || alert.alert_type === alertFilter;
      const matchesPriority = alertPriority === 'all' || alert.priority === alertPriority;
      return matchesType && matchesPriority;
    });
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged', acknowledged_by: 'Current User', acknowledged_at: new Date().toISOString() }
        : alert
    ));
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved', resolved_at: new Date().toISOString() }
        : alert
    ));
  };

  const getAlertStats = () => {
    const activeAlerts = alerts.filter(a => a.status === 'active');
    return {
      total: activeAlerts.length,
      critical: activeAlerts.filter(a => a.priority === 'critical').length,
      high: activeAlerts.filter(a => a.priority === 'high').length,
      medium: activeAlerts.filter(a => a.priority === 'medium').length,
      low: activeAlerts.filter(a => a.priority === 'low').length,
      autoReorderSuggested: activeAlerts.filter(a => a.auto_reorder_suggested).length
    };
  };

  const alertStats = getAlertStats();

  // Get priority color and icon
  const getPriorityDisplay = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { color: 'text-red-600', bg: 'bg-red-100 border-red-200', icon: AlertTriangle, label: 'CRITICAL' };
      case 'high':
        return { color: 'text-orange-600', bg: 'bg-orange-100 border-orange-200', icon: AlertTriangle, label: 'HIGH' };
      case 'medium':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100 border-yellow-200', icon: AlertTriangle, label: 'MEDIUM' };
      case 'low':
        return { color: 'text-blue-600', bg: 'bg-blue-100 border-blue-200', icon: AlertTriangle, label: 'LOW' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', icon: AlertTriangle, label: 'UNKNOWN' };
    }
  };

  // Add Product functions
  const handleAddProduct = async () => {
    if (!newProduct.product_name || !newProduct.sku) {
      alert('Product name and SKU are required');
      return;
    }

    // Check for duplicate SKU
    if (inventoryData.some(item => item.sku === newProduct.sku)) {
      alert('SKU already exists. Please use a unique SKU.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newId = `prod-${Date.now()}`;
      const currentTime = new Date().toISOString();
      
      // Handle image upload if provided
      let imageUrl = '/api/placeholder/60/60';
      if (productImage) {
        try {
          imageUrl = await simulateImageUpload(productImage);
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('Failed to upload product image. The product will be created without an image.');
          // Continue with default placeholder image
        }
      }
      
      const productToAdd: InventoryItem = {
        id: newId,
        product_name: newProduct.product_name,
        sku: newProduct.sku,
        category: newProduct.category,
        supplier_id: `sup-${Date.now()}`,
        supplier_name: newProduct.supplier_name || 'Unknown Supplier',
        base_stock: newProduct.current_stock,
        current_stock: newProduct.current_stock,
        reserved_stock: 0,
        available_stock: newProduct.current_stock,
        threshold: newProduct.threshold,
        status: newProduct.current_stock === 0 ? 'out_of_stock' : 
                newProduct.current_stock <= newProduct.threshold ? 'low_stock' : 'in_stock',
        cost_per_unit: newProduct.cost_per_unit,
        description: newProduct.description,
        location: newProduct.location,
        image_url: imageUrl,
        created_at: currentTime,
        updated_at: currentTime,
        created_by: 'Current User',
        updated_by: 'Current User'
      };

      // Add to inventory
      setInventoryData(prev => [productToAdd, ...prev]);
      
      // Add audit log
      addAuditLog({
        product_id: newId,
        action_type: 'stock_in',
        quantity: newProduct.current_stock,
        previous_stock: 0,
        new_stock: newProduct.current_stock,
        reason: 'New product added to inventory',
        user_id: 'current-user',
        user_name: 'Current User',
        notes: `Added new product: ${newProduct.product_name}`
      });
      
      // Reset form
      setNewProduct({
        product_name: '',
        sku: '',
        category: 'custom_jewelry',
        supplier_name: '',
        current_stock: 0,
        threshold: 10,
        cost_per_unit: 0,
        description: '',
        location: ''
      });
      setProductImage(null);
      setImagePreview(null);
      
      setIsAddProductOpen(false);
      
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSKU = () => {
    const prefix = newProduct.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const validateForm = () => {
    const errors = [];
    if (!newProduct.product_name.trim()) errors.push('Product name is required');
    if (!newProduct.sku.trim()) errors.push('SKU is required');
    if (newProduct.current_stock < 0) errors.push('Current stock cannot be negative');
    if (newProduct.threshold < 0) errors.push('Threshold cannot be negative');
    if (newProduct.cost_per_unit < 0) errors.push('Cost per unit cannot be negative');
    return errors;
  };

  // Image handling functions
  const handleImageSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image size should be less than 5MB. Please compress your image or select a smaller file.');
      return;
    }

    // Validate image dimensions
    const img = new Image();
    img.onload = function() {
      const maxDimension = 2048;
      if (img.width > maxDimension || img.height > maxDimension) {
        alert(`Image dimensions should not exceed ${maxDimension}x${maxDimension} pixels. Current size: ${img.width}x${img.height}`);
        return;
      }
      
      // All validations passed - set the image
      setProductImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.onerror = () => {
        alert('Failed to read image file. Please try again.');
        setProductImage(null);
        setImagePreview(null);
      };
      reader.readAsDataURL(file);
    };
    
    img.onerror = function() {
      alert('Invalid image file. Please select a different image.');
    };
    
    img.src = URL.createObjectURL(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setProductImage(null);
    setImagePreview(null);
  };

  const simulateImageUpload = async (file: File): Promise<string> => {
    // Simulate image upload to server with error handling
    // In real app, this would upload to cloud storage (AWS S3, Cloudinary, etc.)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 5% chance of upload failure for testing
        if (Math.random() < 0.05) {
          reject(new Error('Upload failed. Please try again.'));
          return;
        }
        
        // Return a mock URL - in real app this would be the actual uploaded URL
        const mockUrl = `/api/placeholder/400/400?filename=${encodeURIComponent(file.name)}&t=${Date.now()}`;
        resolve(mockUrl);
      }, 2000); // Simulate 2 second upload time
    });
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

  // Filter management functions
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategories(['all']);
    setSelectedStatuses(['all']);
    setSelectedSuppliers(['all']);
    setStockRange({min: '', max: ''});
    setPriceRange({min: '', max: ''});
    setActivePreset(null);
  };

  // Barcode scanning functions
  const handleBarcodeStart = () => {
    setIsScanning(true);
    setScannedCode('');
    // In a real implementation, this would start the camera and barcode detection
    // For demo purposes, we'll simulate a scan after 3 seconds
    setTimeout(() => {
      const simulatedBarcode = `${Date.now().toString().slice(-8)}`;
      setScannedCode(simulatedBarcode);
      setIsScanning(false);
    }, 3000);
  };

  const handleBarcodeSearch = () => {
    if (scannedCode) {
      const foundItem = inventoryData.find(item => 
        item.sku.includes(scannedCode) || item.product_name.toLowerCase().includes(scannedCode.toLowerCase())
      );
      
      if (foundItem) {
        setSearchTerm(foundItem.sku);
        setIsBarcodeModalOpen(false);
        setScannedCode('');
      } else {
        alert(`No product found with code: ${scannedCode}`);
      }
    }
  };

  const closeBarcodeModal = () => {
    setIsBarcodeModalOpen(false);
    setScannedCode('');
    setIsScanning(false);
  };

  // Shopify sync function
  const handleShopifySync = async () => {
    setIsShopifySyncing(true);
    
    try {
      // Simulate API call to Shopify
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In a real implementation, this would:
      // 1. Fetch products from Shopify API
      // 2. Compare with local inventory
      // 3. Update stock levels
      // 4. Handle new products/variants
      
      // Simulate updating some inventory items
      const updatedData = inventoryData.map(item => ({
        ...item,
        updated_at: new Date().toISOString(),
        updated_by: 'Shopify Sync'
      }));
      
      setInventoryData(updatedData);
      
      const syncTime = new Date().toISOString();
      setLastSyncTime(syncTime);
      localStorage.setItem('lastShopifySync', syncTime);
      
      alert('Shopify sync completed successfully!');
    } catch (error) {
      console.error('Shopify sync error:', error);
      alert('Failed to sync with Shopify. Please try again.');
    } finally {
      setIsShopifySyncing(false);
    }
  };

  const saveCurrentFilters = (name: string, isDefault: boolean = false) => {
    const newPreset: SavedFilterPreset = {
      id: Date.now().toString(),
      name,
      filters: {
        search: searchTerm,
        categories: selectedCategories as (InventoryCategory | 'all')[],
        statuses: selectedStatuses as (InventoryStatus | 'all')[],
        suppliers: selectedSuppliers,
        locations: [],
        stockRange: stockRange.min !== '' && stockRange.max !== '' ? {
          min: stockRange.min as number,
          max: stockRange.max as number
        } : undefined,
        priceRange: priceRange.min !== '' && priceRange.max !== '' ? {
          min: priceRange.min as number,
          max: priceRange.max as number
        } : undefined
      },
      isDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSavedPresets(prev => [...prev, newPreset]);
    setActivePreset(newPreset.id);
  };

  const loadFilterPreset = (preset: SavedFilterPreset) => {
    setSearchTerm(preset.filters.search);
    setSelectedCategories(preset.filters.categories as string[]);
    setSelectedStatuses(preset.filters.statuses as string[]);
    setSelectedSuppliers(preset.filters.suppliers);
    setStockRange({
      min: preset.filters.stockRange?.min || '',
      max: preset.filters.stockRange?.max || ''
    });
    setPriceRange({
      min: preset.filters.priceRange?.min || '',
      max: preset.filters.priceRange?.max || ''
    });
    setActivePreset(preset.id);
  };

  const deleteFilterPreset = (presetId: string) => {
    setSavedPresets(prev => prev.filter(p => p.id !== presetId));
    if (activePreset === presetId) {
      setActivePreset(null);
    }
  };

  // Multi-select helper functions
  const toggleSelection = (value: string, currentSelection: string[], setter: (values: string[]) => void) => {
    if (value === 'all') {
      setter(['all']);
    } else {
      let newSelection = currentSelection.filter(item => item !== 'all');
      if (currentSelection.includes(value)) {
        newSelection = newSelection.filter(item => item !== value);
      } else {
        newSelection = [...newSelection, value];
      }
      if (newSelection.length === 0) {
        newSelection = ['all'];
      }
      setter(newSelection);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (!selectedCategories.includes('all') && selectedCategories.length > 0) count++;
    if (!selectedStatuses.includes('all') && selectedStatuses.length > 0) count++;
    if (!selectedSuppliers.includes('all') && selectedSuppliers.length > 0) count++;
    if (stockRange.min !== '' || stockRange.max !== '') count++;
    if (priceRange.min !== '' || priceRange.max !== '') count++;
    return count;
  };

  const DashboardView = () => (
    <div className="space-y-8 px-4 pb-8">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Items</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalItems}</p>
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <TrendingUp className="h-3 w-3" />
                <span>+12% vs last month</span>
              </div>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">In Stock</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.inStock}</p>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>+8% vs last month</span>
              </div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Low Stock</p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.lowStock}</p>
              <div className="flex items-center gap-1 text-sm text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Needs attention</span>
              </div>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Out of Stock</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.outOfStock}</p>
              <div className="flex items-center gap-1 text-sm text-red-600">
                <XCircle className="h-3 w-3" />
                <span>Critical</span>
              </div>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Value</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
              <div className="flex items-center gap-1 text-sm text-purple-600">
                <TrendingUp className="h-3 w-3" />
                <span>+16% growth</span>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Avg. Item Value</p>
              <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">₹{(stats.averageStockValue / 1000).toFixed(0)}K</p>
              <div className="flex items-center gap-1 text-sm text-indigo-600">
                <BarChart3 className="h-3 w-3" />
                <span>Per SKU</span>
              </div>
            </div>
            <BarChart3 className="h-8 w-8 text-indigo-600" />
          </div>
        </Card>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stock Status Distribution */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Stock Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percentage}) => `${name}: ${percentage}%`}
                  >
                    {analyticsData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Value Breakdown */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Category Value Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis 
                    label={{ value: 'Value (₹L)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'value' ? `₹${value}L` : value,
                      name === 'value' ? 'Total Value' : 'Item Count'
                    ]}
                  />
                  <Bar dataKey="value" fill="#3b82f6" name="value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Trends and Supplier Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Stock Movement Trends */}
        <Card className="xl:col-span-2 border-0 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Stock Movement Trends (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.stockTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      const labels = {
                        totalValue: 'Total Value (₹L)',
                        stockIn: 'Stock In (units)',
                        stockOut: 'Stock Out (units)',
                        netChange: 'Net Change (units)'
                      };
                      return [value, labels[name as keyof typeof labels] || name];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalValue" stroke="#8884d8" name="totalValue" strokeWidth={2} />
                  <Line type="monotone" dataKey="stockIn" stroke="#22c55e" name="stockIn" strokeWidth={2} />
                  <Line type="monotone" dataKey="stockOut" stroke="#ef4444" name="stockOut" strokeWidth={2} />
                  <Line type="monotone" dataKey="netChange" stroke="#f59e0b" name="netChange" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Top Suppliers by Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.supplierData.map((supplier, index) => (
                <div key={supplier.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{supplier.name}</div>
                      <div className="text-xs text-muted-foreground">{supplier.items} items</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">₹{supplier.value.toFixed(1)}L</div>
                    <div className="text-xs text-muted-foreground">₹{(supplier.avgValue / 1000).toFixed(0)}K avg</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts with Enhanced UI */}
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Critical Inventory Alerts
            </div>
            <Badge variant="destructive" className="animate-pulse">
              {inventoryData.filter(item => item.status === 'out_of_stock' || item.status === 'low_stock').length} alerts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryData
              .filter(item => item.status === 'out_of_stock' || item.status === 'low_stock')
              .map(item => (
                <Card key={item.id} className={`border-l-4 ${
                  item.status === 'out_of_stock' 
                    ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10' 
                    : 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.product_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(item.status)}
                          <div className="text-xs">
                            <span className={`font-bold ${
                              item.status === 'out_of_stock' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {item.current_stock}
                            </span>
                            <span className="text-muted-foreground"> / {item.threshold}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-3 text-xs"
                            onClick={() => {
                              setSelectedItem(item);
                              setStockUpdateType('in');
                              setIsStockUpdateOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Restock
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
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
    <div className="px-4 py-8">
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
    <div className="px-4 pb-8">
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-card to-card/30">
          <CardHeader className="px-6 py-6 bg-muted/20 border-b">
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
            {/* Enhanced Bulk Actions Toolbar */}
            {selectedRows.size > 0 && (
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20 px-6 py-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {selectedRows.size}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-primary">
                          {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''} selected
                        </span>
                        <div className="text-xs text-muted-foreground">
                          Total value: ₹{(
                            getSelectedItems().reduce((sum, item) => 
                              sum + (item.current_stock * (item.cost_per_unit || 0)), 0
                            ) / 100000
                          ).toFixed(1)}L
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Quick Stock Actions */}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 bg-white/80 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                        onClick={() => {
                          setBulkOperation('stock_in');
                          setIsBulkEditOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Stock In
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 bg-white/80 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                        onClick={() => {
                          setBulkOperation('stock_out');
                          setIsBulkEditOpen(true);
                        }}
                      >
                        <Minus className="h-3 w-3 mr-1" />
                        Stock Out
                      </Button>
                      
                      {/* Advanced Actions Dropdown */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 bg-white/80">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="start">
                          <div className="space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-8"
                              onClick={() => {
                                setBulkOperation('update_threshold');
                                setIsBulkEditOpen(true);
                              }}
                            >
                              <AlertTriangle className="h-3 w-3 mr-2" />
                              Update Thresholds
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-8"
                              onClick={() => {
                                setBulkOperation('update_category');
                                setIsBulkEditOpen(true);
                              }}
                            >
                              <Package className="h-3 w-3 mr-2" />
                              Change Category
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-8"
                              onClick={() => {
                                setBulkOperation('update_supplier');
                                setIsBulkEditOpen(true);
                              }}
                            >
                              <Package className="h-3 w-3 mr-2" />
                              Change Supplier
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-8"
                              onClick={() => {
                                setBulkOperation('update_status');
                                setIsBulkEditOpen(true);
                              }}
                            >
                              <Settings className="h-3 w-3 mr-2" />
                              Update Status
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Export Options */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 bg-white/80">
                            <Download className="h-3 w-3 mr-1" />
                            Export
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="start">
                          <div className="space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-8"
                              onClick={() => exportSelectedItems('csv')}
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Export as CSV
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-8"
                              onClick={() => exportSelectedItems('json')}
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Export as JSON
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Danger Actions */}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 bg-white/80 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                        onClick={() => {
                          if (confirm(`Are you sure you want to archive ${selectedRows.size} item(s)?`)) {
                            const updatedData = inventoryData.map(item => 
                              selectedRows.has(item.id) 
                                ? { ...item, status: 'discontinued' as const, updated_at: new Date().toISOString(), updated_by: 'Current User' }
                                : item
                            );
                            setInventoryData(updatedData);
                            setSelectedRows(new Set());
                          }
                        }}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    onClick={() => setSelectedRows(new Set())}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Quick Stats for Selected Items */}
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>In Stock: {getSelectedItems().filter(i => i.status === 'in_stock').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      <span>Low Stock: {getSelectedItems().filter(i => i.status === 'low_stock').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-600" />
                      <span>Out of Stock: {getSelectedItems().filter(i => i.status === 'out_of_stock').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-blue-600" />
                      <span>Total Units: {getSelectedItems().reduce((sum, i) => sum + i.current_stock, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2 border-border/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 px-6 w-16">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="rounded border-border/50 text-primary focus:ring-primary/20 focus:ring-2"
                          checked={selectedRows.size === getSortedData().length && getSortedData().length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground py-4 px-6 w-80">
                      <button
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        onClick={() => handleSort('product_name')}
                      >
                        Product
                        {sortField === 'product_name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground py-4 px-6">
                      <button
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        onClick={() => handleSort('category')}
                      >
                        Category
                        {sortField === 'category' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground py-4 px-6">
                      <button
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        onClick={() => handleSort('current_stock')}
                      >
                        Stock
                        {sortField === 'current_stock' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground py-4 px-6">
                      <button
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        onClick={() => handleSort('available_stock')}
                      >
                        Available
                        {sortField === 'available_stock' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground py-4 px-6">
                      <button
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        onClick={() => handleSort('reserved_stock')}
                      >
                        Reserved
                        {sortField === 'reserved_stock' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground py-4 px-6">
                      <button
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        {sortField === 'status' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUpDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-center font-semibold text-foreground py-4 px-6 w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {getSortedData().map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TableRow 
                      className={`group hover:bg-muted/30 transition-colors border-b last:border-b-0 cursor-pointer h-12 ${
                        selectedRows.has(item.id) ? 'bg-primary/5 border-primary/20' : 
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                      }`}
                      onClick={() => toggleExpandRow(item.id)}
                    >
                    <TableCell className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="rounded border-border/50 text-primary focus:ring-primary/20 focus:ring-2 w-3 h-3"
                          checked={selectedRows.has(item.id)}
                          onChange={(e) => handleRowSelection(item.id, e.target.checked)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-1 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 overflow-hidden border border-muted/20 flex-shrink-0">
                          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground text-sm leading-tight truncate">{item.product_name}</div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded text-xs">
                              {item.sku}
                            </span>
                            <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ml-auto ${
                              expandedRows.has(item.id) ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-1 px-3">
                      <Badge variant={item.category === 'custom_jewelry' ? 'default' : 'secondary'} className="text-xs font-medium">
                        {formatCategoryName(item.category)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                      <span 
                        className={`text-sm font-semibold ${
                          item.current_stock <= item.threshold ? 'text-red-600' : 'text-foreground'
                        }`}
                      >
                        {item.current_stock}
                      </span>
                    </TableCell>
                    <TableCell className="py-1 px-3">
                      <span className="text-sm font-medium text-foreground">
                        {item.current_stock - item.reserved_stock}
                      </span>
                    </TableCell>
                    <TableCell className="py-1 px-3">
                      <span className="text-sm text-muted-foreground">
                        {item.reserved_stock}
                      </span>
                    </TableCell>
                    <TableCell className="py-1 px-3">
                      <Badge variant={item.status === 'in_stock' ? 'default' : item.status === 'low_stock' ? 'destructive' : 'secondary'} className="text-xs">
                        {item.status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
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
                    </TableCell>
                  </TableRow>
                  
                  {/* Expandable Row */}
                  {expandedRows.has(item.id) && (
                    <TableRow className="border-0">
                      <TableCell colSpan={8} className="py-0">
                        <div className="bg-muted/20 border-t border-border/30 px-6 py-6 animate-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Supplier Information */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                Supplier Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Supplier:</span>
                                  <span className="font-medium text-foreground">{item.supplier_name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Base Stock:</span>
                                  <span className="font-medium text-foreground">{item.base_stock}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Threshold:</span>
                                  <span className={`font-medium ${
                                    item.current_stock <= item.threshold ? 'text-red-600' : 'text-foreground'
                                  }`}>{item.threshold}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Stock Analytics */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Stock Analytics
                              </h4>
                              <div className="space-y-3">
                                {/* Stock level progress bar */}
                                <div>
                                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Stock Level</span>
                                    <span>{(() => {
                                      const maxStock = Math.max(item.threshold * 2, item.current_stock + 10);
                                      const percentage = Math.round((item.current_stock / maxStock) * 100);
                                      return `${percentage}%`;
                                    })()}</span>
                                  </div>
                                  <div className="w-full bg-muted/30 rounded-full h-2">
                                    {(() => {
                                      const maxStock = Math.max(item.threshold * 2, item.current_stock + 10);
                                      const stockPercentage = Math.min(100, Math.max(5, (item.current_stock / maxStock) * 100));
                                      return (
                                        <div 
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            item.current_stock <= item.threshold 
                                              ? 'bg-red-500' 
                                              : item.current_stock <= item.threshold * 1.5 
                                                ? 'bg-yellow-500' 
                                                : 'bg-green-500'
                                          }`}
                                          style={{ 
                                            width: `${stockPercentage}%` 
                                          }}
                                        />
                                      );
                                    })()}
                                  </div>
                                </div>
                                {/* Stock distribution */}
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-muted-foreground">Available:</span>
                                    <span className="font-bold text-green-600">{item.available_stock}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span className="text-muted-foreground">Reserved:</span>
                                    <span className="font-bold text-yellow-600">{item.reserved_stock}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Recent Activity */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Recent Activity
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last Updated:</span>
                                  <span className="font-medium text-foreground">
                                    {new Date(item.updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Updated By:</span>
                                  <span className="font-medium text-foreground">{item.updated_by}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Created:</span>
                                  <span className="font-medium text-foreground">
                                    {new Date(item.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded Actions */}
                          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
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
                              <Button size="sm" variant="outline" className="h-8 px-3">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit Product
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 px-3">
                                <QrCode className="h-3 w-3 mr-1" />
                                View QR Code
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              onClick={() => toggleExpandRow(item.id)}
                            >
                              <ChevronRight className="h-4 w-4 rotate-90" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
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
                      <span>Updated {(() => new Date(item.updated_at).toLocaleDateString())()}</span>
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
      <div className="w-full">
        {/* Header with sticky search and filters */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="px-4 py-8 pb-6">
            {/* Page Title */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1 max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground leading-tight">Inventory Management</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground">Live tracking enabled</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Package className="h-2 w-2 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Real-time updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-2 w-2 text-green-600 dark:text-green-400" />
                    </div>
                    <span>Multi-location support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-2 w-2 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Advanced analytics</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="px-6 shadow-sm"
                    onClick={() => setIsBarcodeModalOpen(true)}
                  >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan Barcode
                </Button>
                  <Button variant="outline" size="default" className="px-6 shadow-sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="px-6 shadow-sm"
                    onClick={handleShopifySync}
                    disabled={isShopifySyncing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isShopifySyncing ? 'animate-spin' : ''}`} />
                    {isShopifySyncing ? 'Syncing...' : 'Sync Shopify'}
                  </Button>
                </div>
                {lastSyncTime && (
                  <div className="text-xs text-muted-foreground text-right">
                    Last sync: {new Date(lastSyncTime).toLocaleString()}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="px-6 shadow-sm"
                    onClick={() => setShowPredictionPanel(!showPredictionPanel)}
                  >
                    <TrendingUp className={`h-4 w-4 mr-2 ${
                      reorderSuggestions.filter(s => s.urgency === 'urgent').length > 0 ? 'text-red-500 animate-pulse' : ''
                    }`} />
                    Stock Predictions
                    {reorderSuggestions.filter(s => s.urgency === 'urgent' || s.urgency === 'high').length > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white animate-pulse">
                        {reorderSuggestions.filter(s => s.urgency === 'urgent' || s.urgency === 'high').length}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 shadow-sm"
                    onClick={() => setIsAddProductOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="px-6 shadow-sm"
                    onClick={() => setShowAuditPanel(!showAuditPanel)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Audit Logs
                  <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                    {auditLogs.length}
                  </Badge>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="px-6 shadow-sm relative"
                    onClick={() => setShowAlertsPanel(!showAlertsPanel)}
                  >
                    <Bell className={`h-4 w-4 mr-2 ${
                      alertStats.critical > 0 ? 'text-red-500 animate-bounce' : 
                      alertStats.high > 0 ? 'text-orange-500 animate-pulse' : ''
                    }`} />
                    Smart Alerts
                    {alertStats.total > 0 && (
                      <Badge className={`ml-2 ${
                        alertStats.critical > 0 ? 'bg-red-500 text-white animate-pulse' :
                        alertStats.high > 0 ? 'bg-orange-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                      {alertStats.total}
                    </Badge>
                  )}
                  {alertStats.critical > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Search and Filters */}
            <Card className="border-0 shadow-lg rounded-2xl bg-card/50">
              <CardContent className="px-6 py-8 space-y-6">
                {/* Top Row - Search and View Toggles */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Advanced Search */}
                    <div className="relative flex-1 max-w-lg">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Search products, SKU, description..."
                        value={searchTerm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchTerm(value);
                          if (useFuzzySearch && value.length >= 2) {
                            const suggestions = getSearchSuggestions(value);
                            setSearchSuggestions(suggestions);
                            setShowSearchSuggestions(suggestions.length > 0);
                          } else {
                            setShowSearchSuggestions(false);
                          }
                        }}
                        onFocus={() => {
                          if (useFuzzySearch && searchTerm.length >= 2) {
                            const suggestions = getSearchSuggestions(searchTerm);
                            setSearchSuggestions(suggestions);
                            setShowSearchSuggestions(suggestions.length > 0);
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding suggestions to allow clicking on them
                          setTimeout(() => setShowSearchSuggestions(false), 150);
                        }}
                        className="pl-12 pr-16 h-12 text-base rounded-xl border-2 focus:border-primary"
                      />
                      {/* Search Suggestions Dropdown */}
                      {showSearchSuggestions && searchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto animate-in fade-in-0 slide-in-from-top-2">
                          <div className="p-2 space-y-1">
                            {searchSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/60 transition-colors text-sm"
                                onClick={() => {
                                  setSearchTerm(suggestion);
                                  setShowSearchSuggestions(false);
                                }}
                              >
                                <span className="font-medium">{suggestion}</span>
                              </button>
                            ))}
                          </div>
                          <div className="border-t border-border/50 px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                            {useFuzzySearch && (
                              <span className="flex items-center gap-1">
                                <Search className="h-3 w-3" />
                                Fuzzy search enabled - showing smart suggestions
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-12 p-0 hover:bg-muted/60"
                          >
                            <SlidersHorizontal className={`h-4 w-4 ${useFuzzySearch ? 'text-primary' : ''}`} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm">Search Options</h4>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs font-medium">Search In:</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {[
                                    {key: 'product_name', label: 'Product Name'},
                                    {key: 'sku', label: 'SKU'},
                                    {key: 'description', label: 'Description'},
                                    {key: 'supplier_name', label: 'Supplier'}
                                  ].map(({key, label}) => (
                                    <div key={key} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={key}
                                        checked={advancedSearchOptions.searchIn.includes(key as keyof InventoryItem)}
                                        onCheckedChange={(checked) => {
                                          setAdvancedSearchOptions(prev => ({
                                            ...prev,
                                            searchIn: checked 
                                              ? [...prev.searchIn, key as keyof InventoryItem]
                                              : prev.searchIn.filter(field => field !== key)
                                          }));
                                        }}
                                      />
                                      <Label htmlFor={key} className="text-xs">{label}</Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Fuzzy Search</Label>
                                    <Badge variant="outline" className="text-xs px-1">Smart</Badge>
                                  </div>
                                  <Switch
                                    checked={useFuzzySearch}
                                    onCheckedChange={setUseFuzzySearch}
                                    disabled={advancedSearchOptions.exactMatch || advancedSearchOptions.useRegex}
                                  />
                                </div>
                                {useFuzzySearch && (
                                  <div className="space-y-2">
                                    <Label className="text-xs">Search Sensitivity: {Math.round((1 - fuzzyThreshold) * 100)}%</Label>
                                    <input
                                      type="range"
                                      min="0.1"
                                      max="0.8"
                                      step="0.1"
                                      value={fuzzyThreshold}
                                      onChange={(e) => setFuzzyThreshold(parseFloat(e.target.value))}
                                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>Strict</span>
                                      <span>Loose</span>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Case Sensitive</Label>
                                  <Switch
                                    checked={advancedSearchOptions.caseSensitive}
                                    onCheckedChange={(checked) => 
                                      setAdvancedSearchOptions(prev => ({...prev, caseSensitive: checked}))
                                    }
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Exact Match</Label>
                                  <Switch
                                    checked={advancedSearchOptions.exactMatch}
                                    onCheckedChange={(checked) => {
                                      setAdvancedSearchOptions(prev => ({...prev, exactMatch: checked}));
                                      if (checked) setUseFuzzySearch(false);
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Use Regex</Label>
                                  <Switch
                                    checked={advancedSearchOptions.useRegex}
                                    onCheckedChange={(checked) => {
                                      setAdvancedSearchOptions(prev => ({...prev, useRegex: checked}));
                                      if (checked) setUseFuzzySearch(false);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`h-12 px-4 ${showAdvancedFilters ? 'bg-primary/10 border-primary/30' : ''}`}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {getActiveFiltersCount() > 0 && (
                          <Badge className="ml-2 h-5 w-5 text-xs p-0 flex items-center justify-center">
                            {getActiveFiltersCount()}
                          </Badge>
                        )}
                      </Button>
                      
                      {getActiveFiltersCount() > 0 && (
                        <Button
                          variant="ghost"
                          size="default"
                          onClick={clearAllFilters}
                          className="h-12 px-4 text-muted-foreground hover:text-foreground"
                        >
                          <FilterX className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* View Mode Toggles */}
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

                {/* Advanced Filters Row */}
                {showAdvancedFilters && (
                  <div className="space-y-4 pt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                    {/* Filter Presets */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Presets:</Label>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        {savedPresets.map(preset => (
                          <Button
                            key={preset.id}
                            variant={activePreset === preset.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => loadFilterPreset(preset)}
                            className="h-8"
                          >
                            {preset.name}
                            {preset.isDefault && <Badge className="ml-1 h-4 text-xs px-1">Default</Badge>}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFilterPreset(preset.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Button>
                        ))}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                              <Plus className="h-3 w-3 mr-1" />
                              Save Current
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Save Filter Preset</DialogTitle>
                              <DialogDescription>
                                Save the current filter settings for quick access later.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="preset-name">Preset Name</Label>
                                <Input
                                  id="preset-name"
                                  placeholder="e.g., Low Stock Items"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const name = (e.target as HTMLInputElement).value;
                                      if (name.trim()) {
                                        saveCurrentFilters(name.trim());
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => {
                                  const input = document.getElementById('preset-name') as HTMLInputElement;
                                  if (input?.value.trim()) {
                                    saveCurrentFilters(input.value.trim());
                                    input.value = '';
                                  }
                                }}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save Preset
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Multi-Select Filters Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                      {/* Categories Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Categories</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-10">
                              <span className="truncate">
                                {selectedCategories.includes('all') 
                                  ? 'All Categories'
                                  : selectedCategories.length === 1 
                                    ? formatCategoryName(selectedCategories[0])
                                    : `${selectedCategories.length} selected`
                                }
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56" align="start">
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {categories.map(category => (
                                <div key={category} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`cat-${category}`}
                                    checked={selectedCategories.includes(category)}
                                    onCheckedChange={() => toggleSelection(category, selectedCategories, setSelectedCategories)}
                                  />
                                  <Label htmlFor={`cat-${category}`} className="text-sm">
                                    {formatCategoryName(category)}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Status</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-10">
                              <span className="truncate">
                                {selectedStatuses.includes('all') 
                                  ? 'All Statuses'
                                  : selectedStatuses.length === 1 
                                    ? formatStatusName(selectedStatuses[0])
                                    : `${selectedStatuses.length} selected`
                                }
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56" align="start">
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {statuses.map(status => (
                                <div key={status} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`stat-${status}`}
                                    checked={selectedStatuses.includes(status)}
                                    onCheckedChange={() => toggleSelection(status, selectedStatuses, setSelectedStatuses)}
                                  />
                                  <Label htmlFor={`stat-${status}`} className="text-sm">
                                    {formatStatusName(status)}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Suppliers Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Suppliers</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-10">
                              <span className="truncate">
                                {selectedSuppliers.includes('all') 
                                  ? 'All Suppliers'
                                  : selectedSuppliers.length === 1 
                                    ? selectedSuppliers[0]
                                    : `${selectedSuppliers.length} selected`
                                }
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56" align="start">
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {suppliers.map(supplier => (
                                <div key={supplier} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`sup-${supplier}`}
                                    checked={selectedSuppliers.includes(supplier)}
                                    onCheckedChange={() => toggleSelection(supplier, selectedSuppliers, setSelectedSuppliers)}
                                  />
                                  <Label htmlFor={`sup-${supplier}`} className="text-sm">
                                    {supplier}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Stock Range Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Stock Range</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={stockRange.min}
                            onChange={(e) => setStockRange(prev => ({ ...prev, min: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                            className="h-10"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={stockRange.max}
                            onChange={(e) => setStockRange(prev => ({ ...prev, max: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                            className="h-10"
                          />
                        </div>
                      </div>

                      {/* Price Range Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Price Range (₹)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                            className="h-10"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stock Prediction Panel */}
        {showPredictionPanel && (
          <Card className="mx-4 mb-8 border-0 shadow-xl rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    Stock Predictions & Reorder Intelligence
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">
                    AI-powered stock forecasting and automated reorder suggestions based on sales velocity analysis
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={selectedPredictionPeriod.toString()} onValueChange={(value) => setSelectedPredictionPeriod(parseInt(value) as 30 | 60 | 90)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowPredictionPanel(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Prediction Overview Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Critical Risk</div>
                        <div className="text-xl font-bold text-red-600">
                          {stockPredictions.filter(p => p.risk_level === 'critical').length}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">High Risk</div>
                        <div className="text-xl font-bold text-orange-600">
                          {stockPredictions.filter(p => p.risk_level === 'high').length}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Growing Demand</div>
                        <div className="text-xl font-bold text-blue-600">
                          {stockPredictions.filter(p => p.trend_direction === 'increasing').length}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Reorder Suggestions</div>
                        <div className="text-xl font-bold text-green-600">
                          {reorderSuggestions.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prediction Visualization */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Stock Risk Distribution */}
                  <Card className="bg-white/80 dark:bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PieChartIcon className="h-5 w-5 text-indigo-600" />
                        Stock Risk Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Low Risk', value: stockPredictions.filter(p => p.risk_level === 'low').length, color: '#22c55e' },
                                { name: 'Medium Risk', value: stockPredictions.filter(p => p.risk_level === 'medium').length, color: '#f59e0b' },
                                { name: 'High Risk', value: stockPredictions.filter(p => p.risk_level === 'high').length, color: '#f97316' },
                                { name: 'Critical Risk', value: stockPredictions.filter(p => p.risk_level === 'critical').length, color: '#ef4444' }
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({name, value}) => value > 0 ? `${name}: ${value}` : ''}
                            >
                              {[0,1,2,3].map((index) => (
                                <Cell key={`cell-${index}`} fill={['#22c55e', '#f59e0b', '#f97316', '#ef4444'][index]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sales Velocity vs Stock Chart */}
                  <Card className="bg-white/80 dark:bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        Sales Velocity vs Current Stock
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart
                            data={stockPredictions.slice(0, 20).map(p => ({
                              x: p.daily_sales_velocity,
                              y: p.current_stock,
                              name: p.product_name,
                              risk: p.risk_level,
                              color: {
                                'low': '#22c55e',
                                'medium': '#f59e0b', 
                                'high': '#f97316',
                                'critical': '#ef4444'
                              }[p.risk_level]
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="x" name="Daily Sales Velocity" />
                            <YAxis dataKey="y" name="Current Stock" />
                            <Tooltip 
                              formatter={(value, name) => [
                                name === 'x' ? `${value.toFixed(1)} units/day` : `${value} units`,
                                name === 'x' ? 'Sales Velocity' : 'Current Stock'
                              ]}
                              labelFormatter={(label, payload) => 
                                payload?.[0]?.payload?.name || 'Product'
                              }
                            />
                            <Scatter dataKey="y" fill="#8884d8" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Urgent Reorder Suggestions */}
                {reorderSuggestions.filter(s => s.urgency === 'urgent' || s.urgency === 'high').length > 0 && (
                  <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                        Urgent Reorder Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {reorderSuggestions
                          .filter(s => s.urgency === 'urgent' || s.urgency === 'high')
                          .slice(0, 4)
                          .map(suggestion => (
                            <div key={suggestion.product_id} className="bg-white/80 dark:bg-background/80 rounded-lg p-4 border">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{suggestion.product_name}</div>
                                  <div className="text-xs text-muted-foreground font-mono">{suggestion.sku}</div>
                                </div>
                                <Badge 
                                  className={`${suggestion.urgency === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-orange-100 text-orange-800 border-orange-200'} animate-pulse`}
                                >
                                  {suggestion.urgency.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Current Stock:</span>
                                  <span className="font-medium">{suggestion.current_stock} units</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Suggested Quantity:</span>
                                  <span className="font-medium text-green-600">{suggestion.suggested_quantity} units</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Sales Velocity:</span>
                                  <span className="font-medium">{suggestion.sales_velocity.toFixed(1)} units/day</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Estimated Cost:</span>
                                  <span className="font-medium">₹{Math.round(suggestion.estimated_cost / 1000)}K</span>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" className="h-7 px-3 text-xs">
                                    Create Purchase Order
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 px-3 text-xs">
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Predictions Table */}
                <Card className="bg-white/80 dark:bg-background/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                      Stock Predictions ({selectedPredictionPeriod} Days Forecast)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Product</th>
                            <th className="text-right p-2">Current Stock</th>
                            <th className="text-right p-2">Daily Velocity</th>
                            <th className="text-right p-2">Days Until Stockout</th>
                            <th className="text-center p-2">Risk Level</th>
                            <th className="text-center p-2">Trend</th>
                            <th className="text-right p-2">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockPredictions
                            .sort((a, b) => {
                              const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
                              return riskOrder[b.risk_level] - riskOrder[a.risk_level];
                            })
                            .slice(0, 10)
                            .map(prediction => (
                              <tr key={prediction.product_id} className="border-b hover:bg-muted/30">
                                <td className="p-2">
                                  <div>
                                    <div className="font-medium">{prediction.product_name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{prediction.sku}</div>
                                  </div>
                                </td>
                                <td className="text-right p-2 font-medium">{prediction.current_stock}</td>
                                <td className="text-right p-2">{prediction.daily_sales_velocity.toFixed(1)}</td>
                                <td className="text-right p-2">
                                  <span className={`font-medium ${
                                    prediction.predicted_days_until_stockout <= 7 ? 'text-red-600' :
                                    prediction.predicted_days_until_stockout <= 14 ? 'text-orange-600' :
                                    prediction.predicted_days_until_stockout <= 30 ? 'text-yellow-600' : 'text-green-600'
                                  }`}>
                                    {prediction.predicted_days_until_stockout > 999 ? '∞' : prediction.predicted_days_until_stockout}
                                  </span>
                                </td>
                                <td className="text-center p-2">
                                  <Badge className={`text-xs ${
                                    prediction.risk_level === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                                    prediction.risk_level === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    prediction.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    'bg-green-100 text-green-800 border-green-200'
                                  }`}>
                                    {prediction.risk_level.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="text-center p-2">
                                  <div className={`flex items-center justify-center gap-1 text-xs ${
                                    prediction.trend_direction === 'increasing' ? 'text-green-600' :
                                    prediction.trend_direction === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                                  }`}>
                                    {prediction.trend_direction === 'increasing' ? '↑' :
                                     prediction.trend_direction === 'decreasing' ? '↓' : '↔'}
                                    {prediction.trend_direction}
                                  </div>
                                </td>
                                <td className="text-right p-2">
                                  <div className={`text-xs font-medium ${
                                    prediction.confidence_score >= 0.8 ? 'text-green-600' :
                                    prediction.confidence_score >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {Math.round(prediction.confidence_score * 100)}%
                                  </div>
                                </td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comprehensive Audit Log Panel */}
        {showAuditPanel && (
          <Card className="mx-4 mb-8 border-0 shadow-xl rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center">
                      <History className="h-5 w-5 text-white" />
                    </div>
                    Inventory Audit Trail
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">
                    Complete history of all inventory movements, changes, and transactions with full traceability
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Date Range:</Label>
                    <Input
                      type="date"
                      value={auditDateRange.from}
                      onChange={(e) => setAuditDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-36 h-9"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={auditDateRange.to}
                      onChange={(e) => setAuditDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-36 h-9"
                    />
                  </div>
                  <Select value={auditFilter} onValueChange={(value: typeof auditFilter) => setAuditFilter(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="stock_in">Stock In</SelectItem>
                      <SelectItem value="stock_out">Stock Out</SelectItem>
                      <SelectItem value="adjustment">Adjustments</SelectItem>
                      <SelectItem value="transfer">Transfers</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="return">Returns</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAuditPanel(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Audit Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <History className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Total Logs</div>
                        <div className="text-xl font-bold text-blue-600">{auditStats.totalLogs}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Plus className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Stock In</div>
                        <div className="text-xl font-bold text-green-600">{auditStats.stockInCount}</div>
                        <div className="text-xs text-muted-foreground">{auditStats.totalStockIn} units</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <Minus className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Stock Out</div>
                        <div className="text-xl font-bold text-red-600">{auditStats.stockOutCount}</div>
                        <div className="text-xs text-muted-foreground">{auditStats.totalStockOut} units</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Edit className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Adjustments</div>
                        <div className="text-xl font-bold text-purple-600">{auditStats.adjustmentCount}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <ArrowUpDown className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Transfers</div>
                        <div className="text-xl font-bold text-orange-600">{auditStats.transferCount}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        auditStats.netChange >= 0 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <TrendingUp className={`h-4 w-4 ${
                          auditStats.netChange >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'
                        }`} />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Net Change</div>
                        <div className={`text-xl font-bold ${
                          auditStats.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {auditStats.netChange >= 0 ? '+' : ''}{auditStats.netChange}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Products</div>
                        <div className="text-xl font-bold text-indigo-600">{auditStats.uniqueProducts}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-background/60 backdrop-blur-sm rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
                        <Eye className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Users</div>
                        <div className="text-xl font-bold text-gray-600">{auditStats.uniqueUsers}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Activity Chart */}
                <Card className="bg-white/80 dark:bg-background/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-slate-600" />
                      Daily Activity Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Array.from({ length: 7 }, (_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - i);
                            const dayLogs = auditLogs.filter(log => {
                              const logDate = new Date(log.timestamp);
                              return logDate.toDateString() === date.toDateString();
                            });
                            return {
                              date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                              stockIn: dayLogs.filter(log => log.action_type === 'stock_in' || log.action_type === 'return').length,
                              stockOut: dayLogs.filter(log => log.action_type === 'stock_out' || log.action_type === 'damage').length,
                              adjustments: dayLogs.filter(log => log.action_type === 'adjustment').length,
                              transfers: dayLogs.filter(log => log.action_type === 'transfer').length
                            };
                          }).reverse()}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" fontSize={12} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="stockIn" stackId="a" fill="#22c55e" name="Stock In" />
                          <Bar dataKey="stockOut" stackId="a" fill="#ef4444" name="Stock Out" />
                          <Bar dataKey="adjustments" stackId="a" fill="#8b5cf6" name="Adjustments" />
                          <Bar dataKey="transfers" stackId="a" fill="#f59e0b" name="Transfers" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Audit Log Table */}
                <Card className="bg-white/80 dark:bg-background/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="h-5 w-5 text-slate-600" />
                        Detailed Audit Trail ({getFilteredAuditLogs().length} records)
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Export CSV
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background/95 backdrop-blur-sm border-b-2">
                          <tr>
                            <th className="text-left p-3 font-medium">Timestamp</th>
                            <th className="text-left p-3 font-medium">Product</th>
                            <th className="text-center p-3 font-medium">Action</th>
                            <th className="text-right p-3 font-medium">Quantity</th>
                            <th className="text-right p-3 font-medium">Before</th>
                            <th className="text-right p-3 font-medium">After</th>
                            <th className="text-left p-3 font-medium">Reason</th>
                            <th className="text-left p-3 font-medium">User</th>
                            <th className="text-left p-3 font-medium">Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredAuditLogs().slice(0, 50).map((log, index) => {
                            const product = inventoryData.find(p => p.id === log.product_id);
                            return (
                              <tr 
                                key={log.id} 
                                className={`border-b hover:bg-muted/30 transition-colors ${
                                  index % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                                }`}
                              >
                                <td className="p-3 text-xs font-mono">
                                  {new Date(log.timestamp).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="p-3">
                                  <div>
                                    <div className="font-medium text-sm">{product?.product_name || 'Unknown Product'}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{product?.sku || log.product_id}</div>
                                  </div>
                                </td>
                                <td className="text-center p-3">
                                  <Badge className={`text-xs ${
                                    log.action_type === 'stock_in' ? 'bg-green-100 text-green-800 border-green-200' :
                                    log.action_type === 'stock_out' ? 'bg-red-100 text-red-800 border-red-200' :
                                    log.action_type === 'adjustment' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                    log.action_type === 'transfer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    log.action_type === 'damage' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                    'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}>
                                    {log.action_type.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="text-right p-3 font-medium">
                                  <span className={`${
                                    log.action_type === 'stock_in' || log.action_type === 'return' ? 'text-green-600' :
                                    log.action_type === 'stock_out' || log.action_type === 'damage' ? 'text-red-600' :
                                    'text-blue-600'
                                  }`}>
                                    {log.action_type === 'stock_in' || log.action_type === 'return' ? '+' : 
                                     log.action_type === 'stock_out' || log.action_type === 'damage' ? '-' : ''}{log.quantity}
                                  </span>
                                </td>
                                <td className="text-right p-3 text-muted-foreground">{log.previous_stock}</td>
                                <td className="text-right p-3 font-medium">{log.new_stock}</td>
                                <td className="p-3 max-w-48">
                                  <div className="text-sm truncate" title={log.reason || 'No reason provided'}>
                                    {log.reason || <span className="text-muted-foreground italic">No reason</span>}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="text-sm font-medium">{log.user_name}</div>
                                  <div className="text-xs text-muted-foreground font-mono">{log.user_id}</div>
                                </td>
                                <td className="p-3">
                                  {log.reference_id ? (
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {log.reference_id}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">None</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {getFilteredAuditLogs().length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No audit logs found</p>
                          <p className="text-sm">Try adjusting your date range or filter criteria</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content based on view mode */}
        {viewMode === 'dashboard' && <DashboardView />}
        {viewMode === 'table' && <TableView />}
        {viewMode === 'grid' && <GridView />}

        {/* Bulk Edit Modal */}
        <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Bulk Edit - {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''}
              </DialogTitle>
              <DialogDescription>
                Apply changes to {selectedRows.size} selected items. Review the preview before confirming.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Operation Selection */}
              <div>
                <Label className="text-base font-medium">Select Operation</Label>
                <Select value={bulkOperation} onValueChange={(value: typeof bulkOperation) => setBulkOperation(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_in">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-green-600" />
                        Stock In - Add inventory
                      </div>
                    </SelectItem>
                    <SelectItem value="stock_out">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-red-600" />
                        Stock Out - Remove inventory
                      </div>
                    </SelectItem>
                    <SelectItem value="update_threshold">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Update Thresholds
                      </div>
                    </SelectItem>
                    <SelectItem value="update_category">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        Change Category
                      </div>
                    </SelectItem>
                    <SelectItem value="update_supplier">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-600" />
                        Change Supplier
                      </div>
                    </SelectItem>
                    <SelectItem value="update_status">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        Update Status
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Operation-specific inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(bulkOperation === 'stock_in' || bulkOperation === 'stock_out' || bulkOperation === 'update_threshold') && (
                  <div>
                    <Label htmlFor="bulk-value">
                      {bulkOperation === 'stock_in' ? 'Quantity to Add' : 
                       bulkOperation === 'stock_out' ? 'Quantity to Remove' : 
                       'New Threshold Value'}
                    </Label>
                    <Input
                      id="bulk-value"
                      type="number"
                      min="1"
                      placeholder={`Enter ${bulkOperation === 'update_threshold' ? 'threshold' : 'quantity'}...`}
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {bulkOperation === 'update_category' && (
                  <div>
                    <Label>New Category</Label>
                    <Select value={bulkNewCategory} onValueChange={setBulkNewCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => cat !== 'all').map(category => (
                          <SelectItem key={category} value={category}>
                            {formatCategoryName(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {bulkOperation === 'update_supplier' && (
                  <div>
                    <Label htmlFor="bulk-supplier">New Supplier</Label>
                    <Input
                      id="bulk-supplier"
                      placeholder="Enter supplier name..."
                      value={bulkNewSupplier}
                      onChange={(e) => setBulkNewSupplier(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {bulkOperation === 'update_status' && (
                  <div>
                    <Label>New Status</Label>
                    <Select value={bulkNewStatus} onValueChange={(value: InventoryStatus) => setBulkNewStatus(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.filter(status => status !== 'all').map(status => (
                          <SelectItem key={status} value={status}>
                            {formatStatusName(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Reason field for stock operations */}
                {(bulkOperation === 'stock_in' || bulkOperation === 'stock_out') && (
                  <div className="md:col-span-2">
                    <Label htmlFor="bulk-reason">Reason (Optional)</Label>
                    <Textarea
                      id="bulk-reason"
                      placeholder={bulkOperation === 'stock_in' ? 
                        "e.g., New shipment received, RTO processed..." : 
                        "e.g., Sale, Damage, Quality issue..."
                      }
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Preview Toggle */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showBulkPreview}
                    onCheckedChange={setShowBulkPreview}
                  />
                  <Label>Show Preview</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedRows.size} items will be updated
                </div>
              </div>

              {/* Preview Section */}
              {showBulkPreview && (
                <div className="border rounded-lg p-4 bg-muted/30 max-h-60 overflow-y-auto">
                  <h4 className="font-medium mb-3 text-sm">Preview Changes:</h4>
                  <div className="space-y-2">
                    {getBulkOperationPreview().slice(0, 10).map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-background rounded border">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.product_name}</span>
                          <Badge variant="outline" className="text-xs px-1">{item.sku}</Badge>
                        </div>
                        <div className="text-right">
                          {bulkOperation === 'stock_in' || bulkOperation === 'stock_out' ? (
                            <span>Stock: {getSelectedItems().find(orig => orig.id === item.id)?.current_stock || 0} → {item.current_stock}</span>
                          ) : bulkOperation === 'update_threshold' ? (
                            <span>Threshold: {getSelectedItems().find(orig => orig.id === item.id)?.threshold || 0} → {item.threshold}</span>
                          ) : bulkOperation === 'update_category' ? (
                            <span>Category: {formatCategoryName(getSelectedItems().find(orig => orig.id === item.id)?.category || 'custom_jewelry')} → {formatCategoryName(item.category)}</span>
                          ) : bulkOperation === 'update_supplier' ? (
                            <span>Supplier: {getSelectedItems().find(orig => orig.id === item.id)?.supplier_name} → {item.supplier_name}</span>
                          ) : (
                            <span>Status: {formatStatusName(getSelectedItems().find(orig => orig.id === item.id)?.status || 'in_stock')} → {formatStatusName(item.status)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {getBulkOperationPreview().length > 10 && (
                      <div className="text-center text-muted-foreground text-xs py-2">
                        ... and {getBulkOperationPreview().length - 10} more items
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={applyBulkOperation} 
                disabled={
                  (bulkOperation === 'stock_in' || bulkOperation === 'stock_out' || bulkOperation === 'update_threshold') && !bulkValue ||
                  bulkOperation === 'update_category' && !bulkNewCategory ||
                  bulkOperation === 'update_supplier' && !bulkNewSupplier
                }
                className="min-w-24"
              >
                Apply Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Product Modal */}
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add New Product
              </DialogTitle>
              <DialogDescription>
                Create a new product in your inventory system. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name *</Label>
                    <Input
                      id="product-name"
                      placeholder="e.g., Gold Chain Necklace 18K"
                      value={newProduct.product_name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, product_name: e.target.value }))}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sku"
                        placeholder="e.g., GCN-18K-001"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                        className="border-2 focus:border-primary"
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewProduct(prev => ({ ...prev, sku: generateSKU() }))}
                        className="whitespace-nowrap"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newProduct.category} onValueChange={(value: InventoryCategory) => setNewProduct(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(cat => cat !== 'all').map(category => (
                          <SelectItem key={category} value={category}>
                            {formatCategoryName(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier Name</Label>
                    <Input
                      id="supplier"
                      placeholder="e.g., Mumbai Gold Suppliers"
                      value={newProduct.supplier_name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, supplier_name: e.target.value }))}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed product description, materials, specifications..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="border-2 focus:border-primary"
                  />
                </div>
              </div>

              {/* Product Image */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground border-b pb-2">Product Image</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Image Upload Area */}
                  <div className="space-y-3">
                    <Label>Product Photo</Label>
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                        isDragOver 
                          ? 'border-primary bg-primary/5 scale-105' 
                          : imagePreview 
                            ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
                      }`}
                      onDrop={handleImageDrop}
                      onDragOver={handleImageDragOver}
                      onDragLeave={handleImageDragLeave}
                    >
                      {imagePreview ? (
                        /* Image Preview */
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Product preview" 
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              className="bg-white/90 hover:bg-white text-black"
                            >
                              <Camera className="h-4 w-4 mr-1" />
                              Change
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={removeImage}
                              className="bg-red-500/90 hover:bg-red-600 text-white"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            <CheckCircle className="h-3 w-3 mr-1 inline" />
                            {(() => Math.round(productImage!.size / 1024))()}KB
                          </div>
                        </div>
                      ) : (
                        /* Upload Prompt */
                        <div className="text-center">
                          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                            isDragOver 
                              ? 'bg-primary text-primary-foreground animate-pulse' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isDragOver ? (
                              <Upload className="h-8 w-8 animate-bounce" />
                            ) : (
                              <ImageIcon className="h-8 w-8" />
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className={`text-sm font-medium ${
                              isDragOver ? 'text-primary' : 'text-foreground'
                            }`}>
                              {isDragOver ? 'Drop your image here!' : 'Upload product image'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Drag & drop or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Supports: JPG, PNG, WEBP • Max size: 5MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => document.getElementById('image-upload')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </Button>
                        </div>
                      )}
                      
                      {/* Hidden File Input */}
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageSelect(file);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Image Guidelines */}
                  <div className="space-y-3">
                    <Label>Image Guidelines</Label>
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Best Practices</p>
                          <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                            <li>• Use high-quality, well-lit photos</li>
                            <li>• Square aspect ratio (1:1) works best</li>
                            <li>• Show product from multiple angles if possible</li>
                            <li>• Use neutral/white background</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Settings className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Technical Specs</p>
                          <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                            <li>• Minimum: 400×400 pixels</li>
                            <li>• Recommended: 1000×1000 pixels</li>
                            <li>• Max file size: 5MB</li>
                            <li>• Formats: JPG, PNG, WEBP</li>
                          </ul>
                        </div>
                      </div>
                      
                      {productImage && (
                        <div className="flex items-start gap-3 pt-2 border-t border-border/50">
                          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ImageIcon className="h-3 w-3 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Current Image</p>
                            <div className="text-xs text-muted-foreground space-y-1 mt-1">
                              <div>Name: {productImage.name}</div>
                              <div>Size: {(() => Math.round(productImage.size / 1024))()}KB</div>
                              <div>Type: {productImage.type}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock & Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground border-b pb-2">Stock & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-stock">Initial Stock</Label>
                    <Input
                      id="current-stock"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newProduct.current_stock}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Low Stock Threshold</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      placeholder="10"
                      value={newProduct.threshold}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, threshold: parseInt(e.target.value) || 0 }))}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost-per-unit">Cost Per Unit (₹)</Label>
                    <Input
                      id="cost-per-unit"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={newProduct.cost_per_unit}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Storage Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Warehouse-A-Shelf-12"
                      value={newProduct.location}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, location: e.target.value }))}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground border-b pb-2">Preview</h3>
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 bg-muted/10">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-base">
                        {newProduct.product_name || 'Product Name'}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {newProduct.sku || 'SKU'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCategoryName(newProduct.category)} • {newProduct.supplier_name || 'No supplier'}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>Stock: <strong>{newProduct.current_stock}</strong></span>
                        <span>Threshold: <strong>{newProduct.threshold}</strong></span>
                        <span>Cost: <strong>₹{newProduct.cost_per_unit}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${newProduct.current_stock === 0 ? 'bg-red-100 text-red-800' : newProduct.current_stock <= newProduct.threshold ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {newProduct.current_stock === 0 ? 'Out of Stock' : newProduct.current_stock <= newProduct.threshold ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddProductOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddProduct}
                disabled={isSubmitting || !newProduct.product_name || !newProduct.sku}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* Barcode Scanning Modal */}
        <Dialog open={isBarcodeModalOpen} onOpenChange={setIsBarcodeModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Barcode Scanner
              </DialogTitle>
              <DialogDescription>
                Scan a barcode to quickly find products in your inventory
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Scanner Interface */}
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                {isScanning ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Scanning for barcode...</p>
                    <p className="text-xs text-muted-foreground">Point your camera at the barcode</p>
                  </div>
                ) : scannedCode ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <QrCode className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-600">Barcode Detected!</p>
                      <p className="text-sm text-muted-foreground mt-1">Code: {scannedCode}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <QrCode className="h-16 w-16 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">Ready to Scan</p>
                      <p className="text-sm text-muted-foreground">Click "Start Scanning" to begin</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Input */}
              <div className="space-y-2">
                <Label htmlFor="manual-code">Or enter code manually:</Label>
                <Input
                  id="manual-code"
                  type="text"
                  placeholder="Enter barcode or SKU..."
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={closeBarcodeModal}>
                Cancel
              </Button>
              {!isScanning && !scannedCode && (
                <Button onClick={handleBarcodeStart} className="bg-blue-600 hover:bg-blue-700">
                  <QrCode className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              )}
              {scannedCode && (
                <Button onClick={handleBarcodeSearch} className="bg-green-600 hover:bg-green-700">
                  Search Product
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}