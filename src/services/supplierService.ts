import { supabase } from "@/integrations/supabase/client";

export interface Supplier {
  id: string;
  name: string;
  gstin?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_person?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  payment_terms?: string;
  status: 'active' | 'inactive';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Get all active suppliers
export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSuppliers:', error);
    throw error;
  }
};

// Get supplier by ID
export const getSupplierById = async (id: string): Promise<Supplier> => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getSupplierById:', error);
    throw error;
  }
};

// Search suppliers by name
export const searchSuppliers = async (query: string): Promise<Supplier[]> => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'active')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);

    if (error) {
      console.error('Error searching suppliers:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchSuppliers:', error);
    throw error;
  }
};