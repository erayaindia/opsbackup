import { supabase } from "@/integrations/supabase/client";

export interface Vendor {
  id: string;
  name: string;
  gstin?: string;
  email?: string;
  phone?: string;
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

// Backward compatibility
export type Supplier = Vendor;

// Get all active vendors
export const getVendors = async (): Promise<Vendor[]> => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getVendors:', error);
    throw error;
  }
};

// Backward compatibility
export const getSuppliers = getVendors;

// Get vendor by ID
export const getVendorById = async (id: string): Promise<Vendor> => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getVendorById:', error);
    throw error;
  }
};

// Backward compatibility
export const getSupplierById = getVendorById;

// Search vendors by name
export const searchVendors = async (query: string): Promise<Vendor[]> => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('status', 'active')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);

    if (error) {
      console.error('Error searching vendors:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchVendors:', error);
    throw error;
  }
};

// Backward compatibility
export const searchSuppliers = searchVendors;