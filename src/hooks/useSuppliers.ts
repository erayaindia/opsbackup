import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Supplier {
  id: string;
  name: string;
  code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: Record<string, any>;
  payment_terms?: string;
  lead_time_days: number;
  minimum_order_value?: number;
  rating?: number;
  tax_id?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          *,
          status_detail:statuses (
            code,
            description
          )
        `)
        .eq('statuses.domain', 'supplier')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedSuppliers: Supplier[] = data?.map(item => ({
        ...item,
        status: item.status_detail?.code || 'active'
      })) || [];

      setSuppliers(transformedSuppliers);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = async (supplierData: {
    name: string;
    code?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: Record<string, any>;
    payment_terms?: string;
    lead_time_days?: number;
    minimum_order_value?: number;
    rating?: number;
    tax_id?: string;
    notes?: string;
  }) => {
    try {
      // Get active status ID
      const { data: statusData } = await supabase
        .from('statuses')
        .select('id')
        .eq('domain', 'supplier')
        .eq('code', 'active')
        .single();

      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplierData,
          status_id: statusData?.id,
          lead_time_days: supplierData.lead_time_days || 0,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchSuppliers(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error adding supplier:', err);
      throw err;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: updates.name,
          code: updates.code,
          contact_person: updates.contact_person,
          email: updates.email,
          phone: updates.phone,
          address: updates.address,
          payment_terms: updates.payment_terms,
          lead_time_days: updates.lead_time_days,
          minimum_order_value: updates.minimum_order_value,
          rating: updates.rating,
          tax_id: updates.tax_id,
          notes: updates.notes,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchSuppliers(); // Refresh the list
    } catch (err) {
      console.error('Error updating supplier:', err);
      throw err;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      // Get inactive status ID instead of hard delete
      const { data: statusData } = await supabase
        .from('statuses')
        .select('id')
        .eq('domain', 'supplier')
        .eq('code', 'inactive')
        .single();

      const { error } = await supabase
        .from('suppliers')
        .update({ status_id: statusData?.id })
        .eq('id', id);

      if (error) throw error;

      await fetchSuppliers(); // Refresh the list
    } catch (err) {
      console.error('Error deleting supplier:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    error,
    actions: {
      addSupplier,
      updateSupplier,
      deleteSupplier,
      refreshSuppliers: fetchSuppliers
    }
  };
};