export interface InventoryItem {
  id: string;
  product_name: string;
  sku: string;
  category: InventoryCategory;
  supplier_id: string;
  supplier_name?: string;
  base_stock: number;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  threshold: number;
  status: InventoryStatus;
  cost_per_unit?: number;
  total_value?: number;
  image_url?: string;
  description?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  action_type: 'stock_in' | 'stock_out' | 'adjustment' | 'transfer' | 'damage' | 'return';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  reference_id?: string; // Order ID, RTO ID, etc.
  user_id: string;
  user_name?: string;
  timestamp: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  lead_time_days?: number;
  rating?: number;
  status: 'active' | 'inactive' | 'blacklisted';
  created_at: string;
  updated_at: string;
}

export interface InventoryAlert {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstocked' | 'threshold_breach';
  current_stock: number;
  threshold: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  auto_reorder_suggested?: boolean;
  suggested_quantity?: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  from_location?: string;
  to_location?: string;
  reference_type?: 'purchase' | 'sale' | 'return' | 'damage' | 'transfer' | 'adjustment';
  reference_id?: string;
  unit_cost?: number;
  total_cost?: number;
  user_id: string;
  timestamp: string;
  notes?: string;
}

export type InventoryCategory = 
  | 'custom_jewelry'
  | 'non_custom_jewelry'
  | 'packaging'
  | 'raw_materials'
  | 'tools_equipment'
  | 'accessories'
  | 'gift_items';

export type InventoryStatus = 
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'discontinued'
  | 'on_order'
  | 'reserved';

export type ViewMode = 'table' | 'grid' | 'dashboard';

export type StockUpdateType = 'in' | 'out';

export interface InventoryFilters {
  search: string;
  categories: (InventoryCategory | 'all')[];
  statuses: (InventoryStatus | 'all')[];
  suppliers: string[];
  locations: string[];
  stockRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface SavedFilterPreset {
  id: string;
  name: string;
  filters: InventoryFilters;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdvancedSearchOptions {
  searchIn: ('product_name' | 'sku' | 'description' | 'supplier_name')[];
  caseSensitive: boolean;
  exactMatch: boolean;
  useRegex: boolean;
}

export interface InventoryStats {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  alertsCount: number;
  categoryBreakdown: Record<InventoryCategory, number>;
  turnoverRate: number;
  deadStockCount: number;
}

export interface StockPrediction {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  predicted_days_until_stockout: number;
  daily_sales_velocity: number;
  weekly_sales_velocity: number;
  monthly_sales_velocity: number;
  seasonal_factor: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  predicted_stock_in_30_days: number;
  recommended_reorder_date: string;
  recommended_reorder_quantity: number;
  last_updated: string;
}

export interface SalesHistory {
  product_id: string;
  date: string;
  quantity_sold: number;
  revenue: number;
  order_count: number;
}

export interface SeasonalPattern {
  month: number;
  factor: number; // 1.0 = average, > 1.0 = above average, < 1.0 = below average
}

export interface ReorderSuggestion {
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  suggested_quantity: number;
  estimated_cost: number;
  supplier_id: string;
  supplier_name: string;
  lead_time_days: number;
  sales_velocity: number;
  priority_score: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  expected_stockout_date: string;
  savings_potential: number;
}

export interface BulkStockUpdate {
  product_id: string;
  operation: 'add' | 'subtract' | 'set';
  quantity: number;
  reason: string;
}

// Database table definitions that would be added to Supabase
export interface InventoryTable {
  Row: InventoryItem;
  Insert: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'available_stock'>;
  Update: Partial<Omit<InventoryItem, 'id' | 'created_at'>>;
}

export interface InventoryLogsTable {
  Row: InventoryLog;
  Insert: Omit<InventoryLog, 'id' | 'timestamp'>;
  Update: Partial<Omit<InventoryLog, 'id' | 'timestamp'>>;
}

export interface SuppliersTable {
  Row: Supplier;
  Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
  Update: Partial<Omit<Supplier, 'id' | 'created_at'>>;
}

export interface InventoryAlertsTable {
  Row: InventoryAlert;
  Insert: Omit<InventoryAlert, 'id' | 'created_at'>;
  Update: Partial<Omit<InventoryAlert, 'id' | 'created_at'>>;
}