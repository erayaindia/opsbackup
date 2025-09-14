import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadInvoiceFile, FileUploadResult } from '@/lib/fileUpload';

// Simplified types for our inventory system (completely independent)
export interface InventoryDetail {
  id: string;
  product_name: string;
  product_description?: string;
  product_image_url?: string;
  product_category: string;
  sku: string;
  barcode?: string;
  cost: number;
  price: number;
  supplier_name: string;
  supplier_contact?: string;
  warehouse_location: string;
  on_hand_qty: number;
  allocated_qty: number;
  available_qty: number;
  min_stock_level: number;
  reorder_point: number;
  reorder_quantity: number;
  attributes?: Record<string, any>;
  notes?: string;
  last_counted_date?: string;
  last_movement_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Legacy interface for backward compatibility
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
  created_at?: string;
  updated_at?: string;
}

export interface InventoryLog {
  id: string;
  inventory_detail_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
  quantity: number;
  unit_cost?: number;
  from_location?: string;
  to_location?: string;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  performed_by?: string;
  notes?: string;
  invoice_file_url?: string;
  invoice_file_name?: string;
  invoice_file_size?: number;
  occurred_at: string;
  created_at: string;
  inventory_detail?: {
    sku: string;
    product?: {
      name: string;
    };
  };
}

// Legacy interface for backward compatibility
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
  invoice_file_url?: string;
  invoice_file_name?: string;
  invoice_file_size?: number;
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

// Simplified alerts (computed from inventory data)
export interface InventoryAlert {
  id: string;
  inventory_detail_id: string;
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  current_stock: number;
  threshold: number;
  message: string;
  auto_reorder_suggested: boolean;
  suggested_qty?: number;
  created_at: string;
  inventory_detail: {
    sku: string;
    supplier_name: string;
    warehouse_location: string;
    product?: {
      name: string;
    };
  };
  // Legacy compatibility fields
  product_variant_id?: string;
  warehouse_id?: string;
  product_variant?: {
    sku: string;
    product: {
      name: string;
    };
  };
  warehouse?: {
    name: string;
  };
}

export const useInventory = () => {
  const [user, setUser] = useState<any>(null);
  const [inventoryDetails, setInventoryDetails] = useState<InventoryDetail[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Legacy compatibility - transform to old format
  const [products, setProducts] = useState<ProductVariantWithDetails[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementWithDetails[]>([]);

  // Fetch simplified inventory details
  const fetchInventoryDetails = async () => {
    try {
      setLoading(true);

      // Try new independent structure first, fallback to old structure
      let inventoryData, inventoryError;

      // Try new independent structure
      const { data: newData, error: newError } = await supabase
        .from('inventory_details')
        .select(`
          id,
          product_name,
          product_description,
          product_image_url,
          product_category,
          sku,
          barcode,
          cost,
          price,
          supplier_name,
          supplier_contact,
          warehouse_location,
          on_hand_qty,
          allocated_qty,
          available_qty,
          min_stock_level,
          reorder_point,
          reorder_quantity,
          attributes,
          notes,
          last_counted_date,
          last_movement_date,
          created_at,
          updated_at,
          deleted_at
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (newError && newError.code === '42703') {
        // Column doesn't exist yet, try old structure
        console.log('⚠️ Using old database structure - migration not yet applied');
        const { data: oldData, error: oldError } = await supabase
          .from('inventory_details')
          .select(`
            id,
            product_id,
            sku,
            barcode,
            cost,
            price,
            warehouse_id,
            on_hand_qty,
            allocated_qty,
            available_qty,
            min_stock_level,
            reorder_point,
            reorder_quantity,
            attributes,
            notes,
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
              category:categories (
                id,
                name
              )
            )
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        inventoryData = oldData;
        inventoryError = oldError;
      } else {
        inventoryData = newData;
        inventoryError = newError;
      }

      if (inventoryError) {
        console.error('❌ inventory_details table error:', inventoryError.message);
        throw inventoryError;
      }

      console.log('✅ Successfully fetched inventory_details data:', inventoryData?.length, 'records');

      // Store simplified independent inventory data
      const inventoryDetails: InventoryDetail[] = inventoryData?.map(item => {
        // Check if this is new independent structure or old structure
        const isNewStructure = item.product_name !== undefined;

        if (isNewStructure) {
          // New independent structure
          return {
            id: item.id,
            product_name: item.product_name || 'Unknown Product',
            product_description: item.product_description,
            product_image_url: item.product_image_url || '/api/placeholder/60/60',
            product_category: item.product_category || 'Uncategorized',
            sku: item.sku,
            barcode: item.barcode,
            cost: item.cost || 0,
            price: item.price || 0,
            supplier_name: item.supplier_name || 'No Supplier',
            supplier_contact: item.supplier_contact,
            warehouse_location: item.warehouse_location || 'Main Warehouse',
            on_hand_qty: item.on_hand_qty || 0,
            allocated_qty: item.allocated_qty || 0,
            available_qty: item.available_qty || 0,
            min_stock_level: item.min_stock_level || 10,
            reorder_point: item.reorder_point || 5,
            reorder_quantity: item.reorder_quantity || 20,
            attributes: item.attributes || {},
            notes: item.notes,
            last_counted_date: item.last_counted_date,
            last_movement_date: item.last_movement_date,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
          };
        } else {
          // Old structure - transform from products table
          return {
            id: item.id,
            product_name: item.product?.name || 'Unknown Product',
            product_description: item.product?.description || '',
            product_image_url: item.product?.image_url || '/api/placeholder/60/60',
            product_category: item.product?.category?.name || 'Uncategorized',
            sku: item.sku,
            barcode: item.barcode,
            cost: item.cost || 0,
            price: item.price || 0,
            supplier_name: 'Default Supplier', // Old structure doesn't have supplier info
            supplier_contact: '',
            warehouse_location: 'Main Warehouse',
            on_hand_qty: item.on_hand_qty || 0,
            allocated_qty: item.allocated_qty || 0,
            available_qty: item.available_qty || 0,
            min_stock_level: item.min_stock_level || 10,
            reorder_point: item.reorder_point || 5,
            reorder_quantity: item.reorder_quantity || 20,
            attributes: item.attributes || {},
            notes: item.notes,
            last_counted_date: item.last_counted_date,
            last_movement_date: item.last_movement_date,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
          };
        }
      }) || [];

      setInventoryDetails(inventoryDetails);

      // Transform to legacy format for backward compatibility
      const transformedProducts: ProductVariantWithDetails[] = inventoryDetails.map(item => ({
        id: item.id,
        sku: item.sku,
        barcode: item.barcode,
        attributes: item.attributes || {},
        cost: item.cost,
        price: item.price,
        weight: undefined,
        min_stock_level: item.min_stock_level,
        reorder_point: item.reorder_point,
        reorder_quantity: item.reorder_quantity,
        status_id: undefined,
        product: {
          id: item.id, // Use inventory item ID since we don't have separate product ID
          name: item.product_name,
          description: item.product_description || '',
          image_url: item.product_image_url || '/api/placeholder/60/60',
          category: {
            id: 'category-' + item.product_category.toLowerCase().replace(/\s+/g, '-'),
            name: item.product_category
          },
        },
        current_stock: item.on_hand_qty,
        available_stock: item.available_qty,
        allocated_stock: item.allocated_qty,
        warehouse: {
          id: 'warehouse-1',
          name: item.warehouse_location,
          code: 'W001'
        },
        supplier: {
          id: 'supplier-1',
          name: item.supplier_name,
          contact_person: item.supplier_contact,
          email: undefined,
          phone: undefined
        },
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      console.log('Transformed inventory details for products:', transformedProducts.length);
      setProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch inventory logs (simplified movement tracking)
  const fetchInventoryLogs = async (limit = 50) => {
    console.log('🚀🚀🚀 fetchInventoryLogs CALLED 🚀🚀🚀');
    try {
      const { data, error } = await supabase
        .from('inventory_logs')
        .select(`
          id,
          inventory_detail_id,
          movement_type,
          quantity,
          unit_cost,
          from_location,
          to_location,
          reference_type,
          reference_id,
          reason,
          performed_by,
          invoice_file_url,
          invoice_file_name,
          invoice_file_size,
          notes,
          occurred_at,
          created_at
        `)
        .order('occurred_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Inventory logs table error:', error.message);
        setInventoryLogs([]);
        setStockMovements([]);
        return;
      }

      const logs: InventoryLog[] = data?.map(item => ({
        id: item.id,
        inventory_detail_id: item.inventory_detail_id,
        movement_type: item.movement_type,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        from_location: item.from_location,
        to_location: item.to_location,
        reference_type: item.reference_type,
        reference_id: item.reference_id,
        reason: item.reason,
        performed_by: item.performed_by,
        notes: item.notes,
        occurred_at: item.occurred_at,
        created_at: item.created_at,
        inventory_detail: item.inventory_detail ? {
          sku: item.inventory_detail.sku,
          product: item.inventory_detail.product ? {
            name: item.inventory_detail.product.name
          } : undefined
        } : undefined,
      })) || [];

      setInventoryLogs(logs);

      // Fetch inventory details manually since join doesn't work reliably
      const inventoryDetailIds = [...new Set(logs.map(item => item.inventory_detail_id))];

      const { data: inventoryDetailsData, error: detailsError } = await supabase
        .from('inventory_details')
        .select('id, sku, product_name, warehouse_location')
        .in('id', inventoryDetailIds);

      if (detailsError) {
        console.error('Error fetching inventory details:', detailsError);
      }

      // Create a map for quick lookup
      const inventoryDetailsMap = new Map();
      inventoryDetailsData?.forEach(detail => {
        inventoryDetailsMap.set(detail.id, detail);
      });

      console.log('=== DEBUG INVENTORY LOGS ===');
      console.log('inventoryDetailsData:', JSON.stringify(inventoryDetailsData, null, 2));
      console.log('inventoryDetailIds from logs:', JSON.stringify(inventoryDetailIds, null, 2));
      console.log('Map has entries:', inventoryDetailsMap.size);

      // Transform to legacy format for backward compatibility
      const transformedMovements: StockMovementWithDetails[] = logs.map(item => {
        const inventoryDetail = inventoryDetailsMap.get(item.inventory_detail_id);
        console.log(`=== MOVEMENT ${item.id?.substring(0, 8)} ===`);
        console.log(`Looking for ID: "${item.inventory_detail_id}"`);
        console.log(`Found detail:`, inventoryDetail);
        console.log(`Product name will be: "${inventoryDetail?.product_name || 'Unknown Product'}"`);
        console.log('=== END MOVEMENT ===');

        return {
          id: item.id,
          product_variant_id: item.inventory_detail_id,
          warehouse_id: 'warehouse-1',
          movement_type: item.movement_type,
          qty: item.quantity,
          unit_cost: item.unit_cost,
          reference_type: item.reference_type,
          reference_id: item.reference_id,
          user_id: item.performed_by,
          notes: item.notes,
          occurred_at: item.occurred_at,
          product_variant: {
            sku: inventoryDetail?.sku || `LEGACY-${item.inventory_detail_id?.substring(0, 8)}`,
            product: {
              name: inventoryDetail?.product_name || `Legacy Product (${item.inventory_detail_id?.substring(0, 8)})`
            }
          },
          warehouse: {
            name: inventoryDetail?.warehouse_location || item.from_location || item.to_location || 'Legacy Warehouse',
            code: 'LW001'
          },
          movement_type_detail: {
            code: item.movement_type,
            description: item.reason || 'Legacy inventory movement'
          }
        };
      });

      console.log('🔥🔥🔥 FINAL RESULT - transformedMovements:', transformedMovements);
      console.log('🔥🔥🔥 First movement product name:', transformedMovements[0]?.product_variant?.product?.name);
      setStockMovements(transformedMovements);
    } catch (err) {
      console.error('Error fetching inventory logs:', err);
      setInventoryLogs([]);
      setStockMovements([]);
    }
  };

  // Generate alerts from inventory data (computed, not stored)
  const generateAlerts = () => {
    const alerts: InventoryAlert[] = [];

    inventoryDetails.forEach(item => {
      const currentStock = item.on_hand_qty || 0;
      const threshold = item.min_stock_level || 0;
      const reorderPoint = item.reorder_point || 0;

      if (currentStock === 0) {
        alerts.push({
          id: `out-${item.id}`,
          inventory_detail_id: item.id,
          alert_type: 'OUT_OF_STOCK',
          priority: 'HIGH',
          current_stock: currentStock,
          threshold: threshold,
          message: `${item.product_name || item.sku} is out of stock`,
          auto_reorder_suggested: true,
          suggested_qty: item.reorder_quantity,
          created_at: new Date().toISOString(),
          inventory_detail: {
            sku: item.sku,
            supplier_name: item.supplier_name,
            warehouse_location: item.warehouse_location,
            product: {
              name: item.product_name
            }
          },
          // Legacy compatibility
          product_variant_id: item.id,
          warehouse_id: 'warehouse-1',
          product_variant: {
            sku: item.sku,
            product: {
              name: item.product_name || 'Unknown Product'
            }
          },
          warehouse: {
            name: item.warehouse_location
          }
        });
      } else if (currentStock <= reorderPoint) {
        alerts.push({
          id: `low-${item.id}`,
          inventory_detail_id: item.id,
          alert_type: 'LOW_STOCK',
          priority: 'MEDIUM',
          current_stock: currentStock,
          threshold: reorderPoint,
          message: `${item.product_name || item.sku} is below reorder point (${currentStock} <= ${reorderPoint})`,
          auto_reorder_suggested: true,
          suggested_qty: item.reorder_quantity,
          created_at: new Date().toISOString(),
          inventory_detail: {
            sku: item.sku,
            supplier_name: item.supplier_name,
            warehouse_location: item.warehouse_location,
            product: {
              name: item.product_name
            }
          },
          // Legacy compatibility
          product_variant_id: item.id,
          warehouse_id: 'warehouse-1',
          product_variant: {
            sku: item.sku,
            product: {
              name: item.product_name || 'Unknown Product'
            }
          },
          warehouse: {
            name: item.warehouse_location
          }
        });
      }
    });

    setAlerts(alerts);
  };

  // Generate alerts when inventory data changes
  useEffect(() => {
    generateAlerts();
  }, [inventoryDetails]);

  // Add new inventory item (completely independent)
  const addInventoryItem = async (inventoryData: Partial<InventoryDetail>) => {
    try {
      const { data: result, error } = await supabase
        .from('inventory_details')
        .insert({
          product_name: inventoryData.product_name || 'Unknown Product',
          product_description: inventoryData.product_description,
          product_image_url: inventoryData.product_image_url,
          product_category: inventoryData.product_category || 'Uncategorized',
          sku: inventoryData.sku,
          barcode: inventoryData.barcode,
          cost: inventoryData.cost || 0,
          price: inventoryData.price || 0,
          supplier_name: inventoryData.supplier_name || 'No Supplier',
          supplier_contact: inventoryData.supplier_contact,
          warehouse_location: inventoryData.warehouse_location || 'Main Warehouse',
          on_hand_qty: inventoryData.on_hand_qty || 0,
          allocated_qty: inventoryData.allocated_qty || 0,
          min_stock_level: inventoryData.min_stock_level || 10,
          reorder_point: inventoryData.reorder_point || 5,
          reorder_quantity: inventoryData.reorder_quantity || 20,
          attributes: inventoryData.attributes || {},
          notes: inventoryData.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchInventoryDetails(); // Refresh the list
      return result;
    } catch (err) {
      console.error('Error adding inventory item:', err);
      throw err;
    }
  };

  // Legacy function for backward compatibility
  const addProduct = async (productData: any) => {
    return addInventoryItem({
      product_name: productData.product_name || productData.name || 'Unknown Product',
      product_description: productData.product_description || productData.description,
      product_image_url: productData.product_image_url || productData.image_url,
      product_category: productData.product_category || productData.category || 'Uncategorized',
      sku: productData.sku,
      barcode: productData.barcode,
      cost: productData.cost,
      price: productData.price,
      supplier_name: productData.supplier_name || 'Default Supplier',
      supplier_contact: productData.supplier_contact,
      warehouse_location: productData.warehouse_location || 'Main Warehouse',
      on_hand_qty: productData.on_hand_qty || 0,
      allocated_qty: productData.allocated_qty || 0,
      min_stock_level: productData.min_stock_level || 10,
      reorder_point: productData.reorder_point || 5,
      reorder_quantity: productData.reorder_quantity || 20,
      attributes: productData.attributes || {},
      notes: productData.notes,
    });
  };

  // Update inventory item
  const updateInventoryItem = async (id: string, updates: Partial<InventoryDetail>) => {
    try {
      const updateData: any = {};

      // Only update fields that are provided
      if (updates.product_name !== undefined) updateData.product_name = updates.product_name;
      if (updates.product_description !== undefined) updateData.product_description = updates.product_description;
      if (updates.product_image_url !== undefined) updateData.product_image_url = updates.product_image_url;
      if (updates.product_category !== undefined) updateData.product_category = updates.product_category;
      if (updates.sku !== undefined) updateData.sku = updates.sku;
      if (updates.barcode !== undefined) updateData.barcode = updates.barcode;
      if (updates.cost !== undefined) updateData.cost = updates.cost;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.supplier_name !== undefined) updateData.supplier_name = updates.supplier_name;
      if (updates.supplier_contact !== undefined) updateData.supplier_contact = updates.supplier_contact;
      if (updates.warehouse_location !== undefined) updateData.warehouse_location = updates.warehouse_location;
      if (updates.on_hand_qty !== undefined) updateData.on_hand_qty = updates.on_hand_qty;
      if (updates.allocated_qty !== undefined) updateData.allocated_qty = updates.allocated_qty;
      if (updates.min_stock_level !== undefined) updateData.min_stock_level = updates.min_stock_level;
      if (updates.reorder_point !== undefined) updateData.reorder_point = updates.reorder_point;
      if (updates.reorder_quantity !== undefined) updateData.reorder_quantity = updates.reorder_quantity;
      if (updates.attributes !== undefined) updateData.attributes = updates.attributes;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error } = await supabase
        .from('inventory_details')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchInventoryDetails(); // Refresh the list
    } catch (err) {
      console.error('Error updating inventory item:', err);
      throw err;
    }
  };

  // Legacy function for backward compatibility
  const updateProduct = async (id: string, updates: any) => {
    return updateInventoryItem(id, {
      product_name: updates.product_name,
      product_description: updates.product_description,
      product_image_url: updates.product_image_url,
      product_category: updates.product_category,
      sku: updates.sku,
      barcode: updates.barcode,
      cost: updates.cost,
      price: updates.price,
      supplier_name: updates.supplier_name,
      supplier_contact: updates.supplier_contact,
      warehouse_location: updates.warehouse_location,
      on_hand_qty: updates.on_hand_qty,
      allocated_qty: updates.allocated_qty,
      min_stock_level: updates.min_stock_level,
      reorder_point: updates.reorder_point,
      reorder_quantity: updates.reorder_quantity,
      attributes: updates.attributes,
      notes: updates.notes,
    });
  };

  // Delete inventory item (soft delete)
  const deleteInventoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_details')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await fetchInventoryDetails(); // Refresh the list
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      throw err;
    }
  };

  // Record inventory movement (simplified)
  const recordInventoryMovement = async (movement: {
    inventory_detail_id: string;
    movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
    quantity: number;
    unit_cost?: number;
    from_location?: string;
    to_location?: string;
    reference_type?: string;
    reference_id?: string;
    reason?: string;
    notes?: string;
    invoice_file?: File;
  }) => {
    console.log('🚀 recordInventoryMovement called');
    console.log('🚀 Movement type:', movement.movement_type);
    console.log('🚀 Invoice file received:', movement.invoice_file);
    console.log('🚀 File details:', {
      name: movement.invoice_file?.name,
      size: movement.invoice_file?.size,
      type: movement.invoice_file?.type
    });

    try {
      // Insert movement log first to get the ID
      const { data, error } = await supabase
        .from('inventory_logs')
        .insert({
          inventory_detail_id: movement.inventory_detail_id,
          movement_type: movement.movement_type,
          quantity: movement.quantity,
          unit_cost: movement.unit_cost,
          from_location: movement.from_location,
          to_location: movement.to_location,
          reference_type: movement.reference_type,
          reference_id: movement.reference_id,
          reason: movement.reason,
          performed_by: user?.id,
          notes: movement.notes,
          occurred_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Handle file upload if provided (for Stock In movements)
      if (movement.invoice_file && movement.movement_type === 'IN') {
        console.log('🚀 Starting file upload process...');
        try {
          console.log('🚀 Calling uploadInvoiceFile...');
          const uploadResult = await uploadInvoiceFile(movement.invoice_file, data.id);
          console.log('✅ File upload successful:', uploadResult);

          // Update the movement log with file information
          console.log('🚀 Updating database with file info...');
          const { error: updateError } = await supabase
            .from('inventory_logs')
            .update({
              invoice_file_url: uploadResult.url,
              invoice_file_name: uploadResult.name,
              invoice_file_size: uploadResult.size
            })
            .eq('id', data.id);

          if (updateError) {
            console.error('❌ Error updating movement with file info:', updateError);
            // Continue anyway, don't fail the entire operation
          } else {
            console.log('✅ Database updated with file info successfully');
          }
        } catch (fileError) {
          console.error('❌ Error uploading invoice file:', fileError);
          // Don't fail the entire movement, just log the error
        }
      } else {
        console.log('⚠️ No file upload needed:', {
          hasFile: !!movement.invoice_file,
          isStockIn: movement.movement_type === 'IN'
        });
      }

      if (error) throw error;

      console.log('Inventory movement recorded successfully:', data);

      // Update inventory quantities based on movement type
      const { data: currentData, error: fetchError } = await supabase
        .from('inventory_details')
        .select('on_hand_qty, allocated_qty')
        .eq('id', movement.inventory_detail_id)
        .single();

      if (fetchError) throw fetchError;

      const currentOnHand = currentData.on_hand_qty || 0;
      let newOnHand = currentOnHand;

      switch (movement.movement_type) {
        case 'IN':
          newOnHand = currentOnHand + movement.quantity;
          break;
        case 'OUT':
          newOnHand = Math.max(0, currentOnHand - movement.quantity);
          break;
        case 'ADJUST':
          newOnHand = movement.quantity; // Set to exact quantity
          break;
        case 'TRANSFER':
          // For transfers, this might need more complex logic
          break;
      }

      // Update inventory quantities (trigger will handle available_qty calculation)
      const { error: updateError } = await supabase
        .from('inventory_details')
        .update({
          on_hand_qty: newOnHand,
        })
        .eq('id', movement.inventory_detail_id);

      if (updateError) throw updateError;

      // Refresh data after successful movement
      await Promise.all([fetchInventoryDetails(), fetchInventoryLogs()]);
      return data;
    } catch (err) {
      console.error('Error recording inventory movement:', err);
      throw err;
    }
  };

  // Legacy function for backward compatibility
  const recordStockMovement = async (movement: any) => {
    return recordInventoryMovement({
      inventory_detail_id: movement.product_variant_id,
      movement_type: movement.movement_type,
      quantity: movement.qty,
      unit_cost: movement.unit_cost,
      from_location: movement.from_location_id,
      to_location: movement.to_location_id,
      reference_type: movement.reference_type,
      reference_id: movement.reference_id,
      reason: movement.reason,
      notes: movement.notes,
      invoice_file: movement.invoice_file,
    });
  };

  // Simplified alert management (alerts are computed, not stored)
  const acknowledgeAlert = async (alertId: string) => {
    // For computed alerts, we don't store acknowledgment state
    // This could be enhanced to store alert states in a separate table if needed
    console.log('Alert acknowledged:', alertId);
    // For now, just trigger a refresh to recalculate alerts
    generateAlerts();
  };

  const resolveAlert = async (alertId: string) => {
    // For computed alerts, resolution typically means updating the inventory
    // This is just a placeholder - actual resolution would update stock levels
    console.log('Alert resolved:', alertId);
    generateAlerts();
  };

  // Get current user and initial data fetch
  useEffect(() => {
    const initUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        await Promise.all([
          fetchInventoryDetails(),
          fetchInventoryLogs()
        ]);
        // Alerts are generated automatically when inventory data loads
      }
    };

    initUser();
  }, []);

  return {
    // New simplified data
    inventoryDetails,
    inventoryLogs,
    // Legacy compatibility
    products,
    stockMovements,
    alerts,
    loading,
    error,
    actions: {
      // New simplified actions
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      recordInventoryMovement,
      // Legacy compatibility
      addProduct,
      updateProduct,
      recordStockMovement,
      acknowledgeAlert,
      resolveAlert,
      refreshData: () => Promise.all([fetchInventoryDetails(), fetchInventoryLogs()])
    }
  };
};