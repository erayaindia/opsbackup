import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: Record<string, any>;
  manager_id?: string;
  capacity?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  warehouse_id: string;
  code: string;
  type?: 'zone' | 'rack' | 'shelf' | 'bin';
  parent_location_id?: string;
  capacity?: number;
  active: boolean;
  warehouse?: {
    name: string;
    code: string;
  };
  parent_location?: {
    code: string;
  };
}

export const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (warehouseId?: string) => {
    try {
      let query = supabase
        .from('locations')
        .select(`
          *,
          warehouse:warehouses (
            name,
            code
          ),
          parent_location:locations!parent_location_id (
            code
          )
        `)
        .eq('active', true);

      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data, error } = await query.order('code');

      if (error) throw error;

      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const addWarehouse = async (warehouseData: {
    name: string;
    code: string;
    address?: Record<string, any>;
    manager_id?: string;
    capacity?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .insert({
          ...warehouseData,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchWarehouses(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error adding warehouse:', err);
      throw err;
    }
  };

  const addLocation = async (locationData: {
    warehouse_id: string;
    code: string;
    type?: 'zone' | 'rack' | 'shelf' | 'bin';
    parent_location_id?: string;
    capacity?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          ...locationData,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchLocations(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error adding location:', err);
      throw err;
    }
  };

  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    try {
      const { error } = await supabase
        .from('warehouses')
        .update({
          name: updates.name,
          code: updates.code,
          address: updates.address,
          manager_id: updates.manager_id,
          capacity: updates.capacity,
          active: updates.active,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchWarehouses(); // Refresh the list
    } catch (err) {
      console.error('Error updating warehouse:', err);
      throw err;
    }
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({
          code: updates.code,
          type: updates.type,
          parent_location_id: updates.parent_location_id,
          capacity: updates.capacity,
          active: updates.active,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchLocations(); // Refresh the list
    } catch (err) {
      console.error('Error updating location:', err);
      throw err;
    }
  };

  const deactivateWarehouse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('warehouses')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchWarehouses(); // Refresh the list
    } catch (err) {
      console.error('Error deactivating warehouse:', err);
      throw err;
    }
  };

  const deactivateLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchLocations(); // Refresh the list
    } catch (err) {
      console.error('Error deactivating location:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchLocations();
  }, []);

  return {
    warehouses,
    locations,
    loading,
    error,
    actions: {
      addWarehouse,
      addLocation,
      updateWarehouse,
      updateLocation,
      deactivateWarehouse,
      deactivateLocation,
      refreshWarehouses: fetchWarehouses,
      refreshLocations: fetchLocations,
    }
  };
};