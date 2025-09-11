import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types for our inventory system
export interface ProductVariantWithDetails {
  id: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, any>;
  cost?: number;
  price?: number;
  weight?: number;
  min_stock_level: number;
  reorder_point: number;
  reorder_quantity: number;
  status_id?: number;
  product: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    category?: {
      id: string;
      name: string;
    };
  };
  current_stock: number;
  available_stock: number;
  allocated_stock: number;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  supplier?: {
    id: string;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
  };
}

export interface StockMovementWithDetails {
  id: string;
  product_variant_id: string;
  warehouse_id: string;
  movement_type: string;
  qty: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  user_id?: string;
  notes?: string;
  occurred_at: string;
  product_variant: {
    sku: string;
    product: {
      name: string;
    };
  };
  warehouse: {
    name: string;
    code: string;
  };
  movement_type_detail: {
    code: string;
    description?: string;
  };
}

export interface InventoryAlert {
  id: string;
  product_variant_id: string;
  warehouse_id: string;
  alert_type: string;
  priority: string;
  current_stock?: number;
  threshold?: number;
  message?: string;
  auto_reorder_suggested: boolean;
  suggested_qty?: number;
  status: string;
  created_at: string;
  product_variant: {
    sku: string;
    product: {
      name: string;
    };
  };
  warehouse: {
    name: string;
  };
}

export const useInventory = () => {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<ProductVariantWithDetails[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementWithDetails[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products with current stock
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Get products with their variants and current stock levels
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products (
            id,
            name,
            description,
            image_url,
            category:categories (
              id,
              name
            )
          ),
          inventory_balances (
            on_hand_qty,
            allocated_qty,
            available_qty,
            warehouse:warehouses (
              id,
              name,
              code
            )
          ),
          supplier_prices (
            supplier:suppliers (
              id,
              name,
              contact_person,
              email,
              phone
            )
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include current stock and warehouse
      const transformedProducts: ProductVariantWithDetails[] = data?.map(item => ({
        ...item,
        current_stock: item.inventory_balances?.[0]?.on_hand_qty || 0,
        available_stock: item.inventory_balances?.[0]?.available_qty || 0,
        allocated_stock: item.inventory_balances?.[0]?.allocated_qty || 0,
        warehouse: item.inventory_balances?.[0]?.warehouse,
        supplier: item.supplier_prices?.[0]?.supplier,
      })) || [];

      setProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent stock movements
  const fetchStockMovements = async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product_variant:product_variants (
            sku,
            product:products (
              name
            )
          ),
          warehouse:warehouses (
            name,
            code
          ),
          movement_type_detail:movement_types (
            code,
            description
          )
        `)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setStockMovements(data || []);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch active alerts
  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          product_variant:product_variants (
            sku,
            product:products (
              name
            )
          ),
          warehouse:warehouses (
            name
          ),
          alert_type_detail:alert_types!alert_type_id (
            code,
            description
          ),
          priority_detail:priorities!priority_id (
            code,
            description
          ),
          status_detail:statuses!status_id (
            code,
            description
          )
        `)
        .not('status_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedAlerts: InventoryAlert[] = data?.map(item => ({
        ...item,
        alert_type: item.alert_type_detail?.code || 'unknown',
        priority: item.priority_detail?.code || 'medium',
        status: item.status_detail?.code || 'active'
      })) || [];

      setAlerts(transformedAlerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Add new product variant
  const addProduct = async (productData: {
    name: string;
    description?: string;
    category_id: string;
    warehouse_id: string;
    supplier_id: string;
    sku: string;
    barcode?: string;
    cost: number;
    min_stock_level?: number;
    reorder_point?: number;
    reorder_quantity?: number;
    attributes?: Record<string, any>;
  }) => {
    try {
      // First, create or get the product
      const { data: productResult, error: productError } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          description: productData.description,
          category_id: productData.category_id,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Then create the product variant
      const { data: variantResult, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: productResult.id,
          sku: productData.sku,
          barcode: productData.barcode,
          cost: productData.cost,
          min_stock_level: productData.min_stock_level || 0,
          reorder_point: productData.reorder_point || 0,
          reorder_quantity: productData.reorder_quantity || 0,
          attributes: productData.attributes || {},
        })
        .select()
        .single();

      if (variantError) throw variantError;

      // Create supplier relationship with cost information
      const { error: supplierPriceError } = await supabase
        .from('supplier_prices')
        .insert({
          product_variant_id: variantResult.id,
          supplier_id: productData.supplier_id,
          cost: productData.cost,
          currency: 'INR',
          effective_date: new Date().toISOString(),
          is_current: true,
        });

      if (supplierPriceError) {
        console.warn('Failed to create supplier price relationship:', supplierPriceError);
      }

      // Create initial inventory balance for the warehouse
      const { error: balanceError } = await supabase
        .from('inventory_balances')
        .insert({
          product_variant_id: variantResult.id,
          warehouse_id: productData.warehouse_id,
          location_id: null,
          on_hand_qty: 0,
          allocated_qty: 0,
          available_qty: 0,
        });

      if (balanceError) {
        console.warn('Failed to create initial inventory balance:', balanceError);
      }

      await fetchProducts(); // Refresh the list
      return variantResult;
    } catch (err) {
      console.error('Error adding product:', err);
      throw err;
    }
  };

  // Update product variant
  const updateProduct = async (id: string, updates: Partial<ProductVariantWithDetails>) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({
          sku: updates.sku,
          barcode: updates.barcode,
          cost: updates.cost,
          price: updates.price,
          min_stock_level: updates.min_stock_level,
          reorder_point: updates.reorder_point,
          reorder_quantity: updates.reorder_quantity,
          attributes: updates.attributes,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchProducts(); // Refresh the list
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  // Record stock movement
  const recordStockMovement = async (movement: {
    product_variant_id: string;
    warehouse_id: string;
    movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
    qty: number;
    unit_cost?: number;
    reference_type?: string;
    reference_id?: string;
    notes?: string;
    from_location_id?: string;
    to_location_id?: string;
  }) => {
    try {
      // Get movement type ID
      const { data: movementType } = await supabase
        .from('movement_types')
        .select('id')
        .eq('code', movement.movement_type)
        .single();

      if (!movementType) throw new Error('Invalid movement type');

      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          product_variant_id: movement.product_variant_id,
          warehouse_id: movement.warehouse_id,
          movement_type_id: movementType.id,
          qty: movement.qty,
          unit_cost: movement.unit_cost,
          reference_type: movement.reference_type,
          reference_id: movement.reference_id,
          notes: movement.notes,
          from_location_id: movement.from_location_id,
          to_location_id: movement.to_location_id,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh data after successful movement
      await fetchProducts();
      await fetchStockMovements();
      return data;
    } catch (err) {
      console.error('Error recording stock movement:', err);
      throw err;
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      // Get acknowledged status ID
      const { data: statusData } = await supabase
        .from('statuses')
        .select('id')
        .eq('domain', 'alert')
        .eq('code', 'acknowledged')
        .single();

      if (!statusData) throw new Error('Status not found');

      const { error } = await supabase
        .from('inventory_alerts')
        .update({
          status_id: statusData.id,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      await fetchAlerts(); // Refresh alerts
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      throw err;
    }
  };

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      // Get resolved status ID
      const { data: statusData } = await supabase
        .from('statuses')
        .select('id')
        .eq('domain', 'alert')
        .eq('code', 'resolved')
        .single();

      if (!statusData) throw new Error('Status not found');

      const { error } = await supabase
        .from('inventory_alerts')
        .update({
          status_id: statusData.id,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      await fetchAlerts(); // Refresh alerts
    } catch (err) {
      console.error('Error resolving alert:', err);
      throw err;
    }
  };

  // Get current user and initial data fetch
  useEffect(() => {
    const initUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        Promise.all([
          fetchProducts(),
          fetchStockMovements(),
          fetchAlerts()
        ]);
      }
    };
    
    initUser();
  }, []);

  return {
    products,
    stockMovements,
    alerts,
    loading,
    error,
    actions: {
      addProduct,
      updateProduct,
      recordStockMovement,
      acknowledgeAlert,
      resolveAlert,
      refreshData: () => Promise.all([fetchProducts(), fetchStockMovements(), fetchAlerts()])
    }
  };
};