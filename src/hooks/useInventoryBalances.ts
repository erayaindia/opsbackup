import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InventoryBalance {
  id: string;
  product_variant_id: string;
  warehouse_id: string;
  location_id?: string;
  on_hand_qty: number;
  allocated_qty: number;
  available_qty: number;
  last_counted_at?: string;
  created_at?: string;
  // Related data from joins
  product_variant?: {
    id: string;
    sku: string;
    barcode?: string;
    cost?: number;
    price?: number;
    min_stock_level: number;
    reorder_point: number;
    reorder_quantity: number;
    attributes: Record<string, any>;
    product: {
      id: string;
      name: string;
      description?: string;
      category_id?: string;
      categories?: {
        id: string;
        name: string;
      };
    };
  };
  warehouse?: {
    id: string;
    name: string;
    code: string;
    location?: string;
  };
}

export const useInventoryBalances = () => {
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('inventory_balances')
        .select(`
          id,
          product_variant_id,
          warehouse_id,
          location_id,
          on_hand_qty,
          allocated_qty,
          available_qty,
          last_counted_at,
          created_at,
          product_variants:product_variant_id (
            id,
            sku,
            barcode,
            cost,
            price,
            min_stock_level,
            reorder_point,
            reorder_quantity,
            attributes,
            products:product_id (
              id,
              name,
              description,
              category_id,
              categories:category_id (
                id,
                name
              )
            )
          ),
          warehouses:warehouse_id (
            id,
            name,
            code,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching inventory balances:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Transform the data to match our interface
      const transformedData: InventoryBalance[] = (data || []).map(item => ({
        id: item.id,
        product_variant_id: item.product_variant_id,
        warehouse_id: item.warehouse_id,
        location_id: item.location_id,
        on_hand_qty: item.on_hand_qty,
        allocated_qty: item.allocated_qty,
        available_qty: item.available_qty,
        last_counted_at: item.last_counted_at,
        created_at: item.created_at,
        product_variant: item.product_variants ? {
          id: item.product_variants.id,
          sku: item.product_variants.sku,
          barcode: item.product_variants.barcode,
          cost: item.product_variants.cost,
          price: item.product_variants.price,
          min_stock_level: item.product_variants.min_stock_level,
          reorder_point: item.product_variants.reorder_point,
          reorder_quantity: item.product_variants.reorder_quantity,
          attributes: item.product_variants.attributes || {},
          product: {
            id: item.product_variants.products?.id || '',
            name: item.product_variants.products?.name || 'Unknown Product',
            description: item.product_variants.products?.description,
            category_id: item.product_variants.products?.category_id,
            categories: item.product_variants.products?.categories
          }
        } : undefined,
        warehouse: item.warehouses ? {
          id: item.warehouses.id,
          name: item.warehouses.name,
          code: item.warehouses.code,
          location: item.warehouses.location
        } : undefined
      }));

      setInventoryBalances(transformedData);

    } catch (err) {
      console.error('Unexpected error fetching inventory balances:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryBalances();
  }, []);

  // Helper functions
  const getLowStockItems = (threshold?: number) => {
    return inventoryBalances.filter(item => {
      const minLevel = item.product_variant?.min_stock_level || item.product_variant?.reorder_point || threshold || 10;
      return item.available_qty <= minLevel;
    });
  };

  const getOutOfStockItems = () => {
    return inventoryBalances.filter(item => item.available_qty <= 0);
  };

  const getTotalProducts = () => {
    return inventoryBalances.length;
  };

  const getTotalStockValue = () => {
    return inventoryBalances.reduce((total, item) => {
      const cost = item.product_variant?.cost || 0;
      return total + (cost * item.on_hand_qty);
    }, 0);
  };

  const getInventoryAlerts = () => {
    const lowStock = getLowStockItems();
    const outOfStock = getOutOfStockItems();

    return [
      ...outOfStock.map(item => ({
        id: `out-${item.id}`,
        product: item.product_variant?.product.name || 'Unknown Product',
        sku: item.product_variant?.sku || 'N/A',
        stock: item.available_qty,
        threshold: item.product_variant?.min_stock_level || 0,
        status: 'critical' as const,
        warehouse: item.warehouse?.name || 'Unknown Warehouse'
      })),
      ...lowStock.map(item => ({
        id: `low-${item.id}`,
        product: item.product_variant?.product.name || 'Unknown Product',
        sku: item.product_variant?.sku || 'N/A',
        stock: item.available_qty,
        threshold: item.product_variant?.min_stock_level || 0,
        status: 'warning' as const,
        warehouse: item.warehouse?.name || 'Unknown Warehouse'
      }))
    ];
  };

  return {
    inventoryBalances,
    loading,
    error,
    refetch: fetchInventoryBalances,
    // Helper functions
    getLowStockItems,
    getOutOfStockItems,
    getTotalProducts,
    getTotalStockValue,
    getInventoryAlerts,
    // Legacy compatibility - transform to old product format
    products: inventoryBalances.map(item => ({
      id: item.product_variant_id,
      sku: item.product_variant?.sku || '',
      product_name: item.product_variant?.product.name || 'Unknown Product',
      product_category: item.product_variant?.product.categories?.name || 'Uncategorized',
      on_hand_qty: item.on_hand_qty,
      available_qty: item.available_qty,
      allocated_qty: item.allocated_qty,
      min_stock_level: item.product_variant?.min_stock_level || 0,
      reorder_point: item.product_variant?.reorder_point || 0,
      cost: item.product_variant?.cost || 0,
      price: item.product_variant?.price || 0,
      warehouse_location: item.warehouse?.name || 'Unknown Warehouse',
      supplier_name: 'N/A', // This would need to come from supplier table
      last_counted_date: item.last_counted_at,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.created_at || new Date().toISOString(),
    })),
    alerts: getInventoryAlerts()
  };
};