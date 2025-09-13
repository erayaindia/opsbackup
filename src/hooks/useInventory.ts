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

  // Fetch inventory details with product information from database
  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Fetch from inventory_details table (now includes all stock data)
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_details')
        .select(`
          id,
          product_id,
          sku,
          barcode,
          attributes,
          cost,
          price,
          weight,
          min_stock_level,
          reorder_point,
          reorder_quantity,
          status_id,
          on_hand_qty,
          allocated_qty,
          available_qty,
          warehouse_id,
          last_counted_date,
          last_movement_date,
          created_at,
          updated_at,
          deleted_at,
          product:products (
            id,
            name,
            description,
            image_url,
            internal_code,
            working_title,
            category:categories (
              id,
              name
            )
          ),
          warehouse:warehouses!warehouse_id (
            id,
            name,
            code
          ),
          supplier_prices (
            supplier:suppliers (
              id,
              name,
              contact_person,
              email,
              phone
            ),
            unit_cost,
            moq
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (inventoryError) {
        console.error('❌ inventory_details table error, using products table only:', inventoryError.message);
        console.error('❌ Full error details:', inventoryError);

        // Fallback to products table if inventory_details doesn't exist
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            image_url,
            internal_code,
            working_title,
            created_at,
            updated_at,
            categories (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        // Transform products to match inventory format (temporary fallback)
        const transformedProducts: ProductVariantWithDetails[] = products?.map(item => ({
          id: item.id,
          sku: item.internal_code || `SKU-${item.id.slice(0, 8)}`,
          barcode: undefined,
          attributes: {},
          cost: 0, // Will be set when inventory_details is created
          price: 0, // Will be set when inventory_details is created
          weight: undefined,
          min_stock_level: 10,
          reorder_point: 5,
          reorder_quantity: 20,
          status_id: undefined,
          product: {
            id: item.id,
            name: item.name || item.working_title || 'Unnamed Product',
            description: item.description,
            image_url: item.image_url || '/api/placeholder/60/60',
            category: item.categories ? {
              id: item.categories.id,
              name: item.categories.name
            } : {
              id: 'uncategorized',
              name: 'Uncategorized'
            },
          },
          current_stock: 0, // No inventory data yet
          available_stock: 0,
          allocated_stock: 0,
          warehouse: {
            id: 'default-warehouse',
            name: 'Main Warehouse',
            code: 'MW001'
          },
          supplier: {
            id: 'no-supplier',
            name: 'No Supplier Assigned',
            contact_person: 'N/A',
            email: 'N/A',
            phone: 'N/A'
          },
          created_at: item.created_at,
          updated_at: item.updated_at,
        })) || [];

        setProducts(transformedProducts);
        return;
      }

      console.log('✅ Successfully fetched inventory_details data:', inventoryData?.length, 'records');

      // Transform real inventory details data
      const transformedProducts: ProductVariantWithDetails[] = inventoryData?.map(item => {
        // Stock data is now directly in inventory_details
        const totalStock = item.on_hand_qty || 0;
        const totalAllocated = item.allocated_qty || 0;
        const totalAvailable = item.available_qty || 0;

        // Get primary supplier (first one or the one with lowest cost)
        const primarySupplierPrice = item.supplier_prices?.sort((a, b) => (a.unit_cost || 0) - (b.unit_cost || 0))[0];

        return {
          id: item.id,
          sku: item.sku,
          barcode: item.barcode,
          attributes: item.attributes || {},
          cost: item.cost || primarySupplierPrice?.unit_cost || 0,
          price: item.price || 0,
          weight: item.weight,
          min_stock_level: item.min_stock_level || 0,
          reorder_point: item.reorder_point || 0,
          reorder_quantity: item.reorder_quantity || 0,
          status_id: item.status_id,
          product: {
            id: item.product?.id || '',
            name: item.product?.name || item.product?.working_title || 'Unknown Product',
            description: item.product?.description,
            image_url: item.product?.image_url || '/api/placeholder/60/60',
            category: item.product?.category ? {
              id: item.product.category.id,
              name: item.product.category.name
            } : {
              id: 'uncategorized',
              name: 'Uncategorized'
            },
          },
          current_stock: totalStock,
          available_stock: totalAvailable,
          allocated_stock: totalAllocated,
          warehouse: item.warehouse ? {
            id: item.warehouse.id,
            name: item.warehouse.name,
            code: item.warehouse.code || 'N/A'
          } : {
            id: 'no-warehouse',
            name: 'No Warehouse Assigned',
            code: 'N/A'
          },
          supplier: primarySupplierPrice?.supplier ? {
            id: primarySupplierPrice.supplier.id,
            name: primarySupplierPrice.supplier.name,
            contact_person: primarySupplierPrice.supplier.contact_person,
            email: primarySupplierPrice.supplier.email,
            phone: primarySupplierPrice.supplier.phone
          } : {
            id: 'no-supplier',
            name: 'No Supplier Assigned',
            contact_person: 'N/A',
            email: 'N/A',
            phone: 'N/A'
          },
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }) || [];

      console.log('Fetched inventory details for products:', transformedProducts.length);
      setProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent stock movements from database
  const fetchStockMovements = async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          id,
          product_variant_id,
          warehouse_id,
          movement_type_id,
          qty,
          unit_cost,
          reference_type,
          reference_id,
          notes,
          occurred_at,
          created_at
        `)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Stock movements table error:', error.message);
        setStockMovements([]);
        return;
      }

      // Transform to match expected format (simplified)
      const transformedMovements: StockMovementWithDetails[] = data?.map(item => ({
        id: item.id,
        product_variant_id: item.product_variant_id,
        warehouse_id: item.warehouse_id,
        movement_type: 'UNKNOWN', // Will be resolved later
        qty: item.qty,
        unit_cost: item.unit_cost,
        reference_type: item.reference_type,
        reference_id: item.reference_id,
        user_id: item.user_id,
        notes: item.notes,
        occurred_at: item.occurred_at,
        product_variant: {
          sku: 'UNKNOWN',
          product: {
            name: 'Product Movement'
          }
        },
        warehouse: {
          name: 'Warehouse',
          code: 'N/A'
        },
        movement_type_detail: {
          code: 'UNKNOWN',
          description: 'Movement recorded'
        }
      })) || [];

      setStockMovements(transformedMovements);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      setStockMovements([]);
    }
  };

  // Fetch active alerts (placeholder until inventory tables exist)
  const fetchAlerts = async () => {
    try {
      // For now, return empty array since inventory_alerts table doesn't exist
      console.log('Inventory alerts table not available yet, returning empty array');
      setAlerts([]);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setAlerts([]);
    }
  };

  // Add new inventory detail for existing product
  const addProduct = async (productData: {
    product_id?: string; // Link to existing product
    name?: string; // For creating new product
    description?: string;
    category_id?: string;
    warehouse_id: string;
    supplier_id: string;
    sku: string;
    barcode?: string;
    cost: number;
    price?: number;
    min_stock_level?: number;
    reorder_point?: number;
    reorder_quantity?: number;
    attributes?: Record<string, any>;
  }) => {
    try {
      let productId = productData.product_id;

      // If no product_id provided, create a new product
      if (!productId && productData.name) {
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
        productId = productResult.id;
      }

      if (!productId) {
        throw new Error('Either product_id or name must be provided');
      }

      // Create the inventory detail (renamed from product variant)
      const { data: inventoryResult, error: inventoryError } = await supabase
        .from('inventory_details')
        .insert({
          product_id: productId,
          sku: productData.sku,
          barcode: productData.barcode,
          cost: productData.cost,
          price: productData.price,
          min_stock_level: productData.min_stock_level || 0,
          reorder_point: productData.reorder_point || 0,
          reorder_quantity: productData.reorder_quantity || 0,
          attributes: productData.attributes || {},
        })
        .select()
        .single();

      if (inventoryError) throw inventoryError;

      // Create supplier relationship with cost information
      const { error: supplierPriceError } = await supabase
        .from('supplier_prices')
        .insert({
          inventory_detail_id: inventoryResult.id, // Updated reference
          supplier_id: productData.supplier_id,
          unit_cost: productData.cost,
          currency: 'INR',
          valid_from: new Date().toISOString().split('T')[0], // Today's date
        });

      if (supplierPriceError) {
        console.warn('Failed to create supplier price relationship:', supplierPriceError);
      }


      await fetchProducts(); // Refresh the list
      return inventoryResult;
    } catch (err) {
      console.error('Error adding inventory detail:', err);
      throw err;
    }
  };

  // Update inventory detail
  const updateProduct = async (id: string, updates: Partial<ProductVariantWithDetails>) => {
    try {
      const { error } = await supabase
        .from('inventory_details')
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
      console.error('Error updating inventory detail:', err);
      throw err;
    }
  };

  // Record stock movement in database
  // Update inventory quantities in inventory_details table
  const updateInventoryQuantities = async (inventoryDetailId: string, movementType: string, qty: number) => {
    try {
      // Get current quantities
      const { data: currentData, error: fetchError } = await supabase
        .from('inventory_details')
        .select('on_hand_qty, allocated_qty, available_qty')
        .eq('id', inventoryDetailId)
        .single();

      if (fetchError) throw fetchError;

      const currentOnHand = currentData.on_hand_qty || 0;
      const currentAllocated = currentData.allocated_qty || 0;

      let newOnHand = currentOnHand;
      let newAvailable = 0;

      // Calculate new quantities based on movement type
      switch (movementType) {
        case 'IN':
          newOnHand = currentOnHand + qty;
          break;
        case 'OUT':
          newOnHand = Math.max(0, currentOnHand - qty);
          break;
        case 'ADJUST':
          newOnHand = qty; // Set to exact quantity
          break;
        case 'TRANSFER':
          // For transfers, this might need more complex logic depending on direction
          newOnHand = currentOnHand; // Keep same for now
          break;
      }

      // Available = on_hand - allocated
      newAvailable = Math.max(0, newOnHand - currentAllocated);

      // Update the inventory_details record
      const { error: updateError } = await supabase
        .from('inventory_details')
        .update({
          on_hand_qty: newOnHand,
          available_qty: newAvailable,
          last_movement_date: new Date().toISOString()
        })
        .eq('id', inventoryDetailId);

      if (updateError) throw updateError;

      console.log(`✅ Updated inventory quantities for ${inventoryDetailId}:`, {
        movement: `${movementType} ${qty}`,
        old_qty: currentOnHand,
        new_qty: newOnHand,
        available: newAvailable
      });

    } catch (error) {
      console.error('Error updating inventory quantities:', error);
      throw error;
    }
  };

  const recordStockMovement = async (movement: {
    product_variant_id: string; // This is actually inventory_detail_id now
    warehouse_id: string;
    movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
    qty: number;
    unit_cost?: number;
    reference_type?: string;
    reference_id?: string;
    notes?: string;
    from_location_id?: string;
    to_location_id?: string;
    lot_id?: string;
    reason_code_id?: number;
  }) => {
    try {
      // Get movement type ID from the database
      const { data: movementTypeData, error: movementTypeError } = await supabase
        .from('movement_types')
        .select('id')
        .eq('code', movement.movement_type)
        .single();

      if (movementTypeError) {
        console.warn('Movement types table error, using fallback:', movementTypeError.message);
        // Fallback - show demo message
        alert(`Stock movement recorded: ${movement.movement_type} ${movement.qty} units. (Demo mode - database tables not fully set up)`);
        return { id: 'demo-movement-' + Date.now() };
      }

      if (!movementTypeData) {
        throw new Error(`Movement type '${movement.movement_type}' not found`);
      }

      // Insert stock movement (using product_variant_id - matches existing table structure)
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          product_variant_id: movement.product_variant_id, // Use existing column name
          warehouse_id: movement.warehouse_id,
          lot_id: movement.lot_id,
          from_location_id: movement.from_location_id,
          to_location_id: movement.to_location_id,
          movement_type_id: movementTypeData.id,
          qty: movement.qty,
          unit_cost: movement.unit_cost,
          reference_type: movement.reference_type,
          reference_id: movement.reference_id,
          reason_code_id: movement.reason_code_id,
          user_id: user?.id,
          notes: movement.notes,
          occurred_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Stock movement recorded successfully:', data);

      // Skip manual update - database trigger handles this automatically
      // await updateInventoryQuantities(movement.product_variant_id, movement.movement_type, movement.qty);

      // Refresh data after successful movement
      await Promise.all([fetchProducts(), fetchStockMovements()]);
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