import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Bill {
  id: string;
  type: 'stock' | 'expense';
  bill_number: string;
  bill_date: string;
  due_date?: string;
  tracking_id?: string;
  vendor_id: string;
  vendor_name?: string;
  po_id?: string;
  grn_id?: string;
  reason?: string;
  status: 'pending' | 'paid';
  subtotal: number;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface CreateBillData {
  type: 'stock' | 'expense';
  bill_number: string;
  bill_date: string;
  due_date?: string;
  tracking_id?: string;
  vendor_id: string;
  po_id?: string;
  grn_id?: string;
  reason?: string;
  status?: 'pending' | 'paid';
  items: Omit<BillItem, 'id' | 'bill_id'>[];
}

export const useBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    getUser();
  }, []);

  // Fetch all bills with vendor information
  const fetchBills = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          vendor:suppliers (
            id,
            name,
            default_terms
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedBills = data?.map(bill => ({
        ...bill,
        vendor_name: bill.vendor?.name || 'Unknown Vendor'
      })) || [];

      setBills(transformedBills);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Create new bill with items
  const createBill = async (billData: CreateBillData) => {
    try {
      setLoading(true);
      
      // Create the bill
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert({
          type: billData.type,
          bill_number: billData.bill_number,
          bill_date: billData.bill_date,
          due_date: billData.due_date,
          tracking_id: billData.tracking_id,
          vendor_id: billData.vendor_id,
          po_id: billData.po_id,
          grn_id: billData.grn_id,
          reason: billData.reason,
          status: billData.status || 'pending',
          created_by: user?.id,
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items if any
      if (billData.items && billData.items.length > 0) {
        const itemsToInsert = billData.items.map(item => ({
          bill_id: bill.id,
          description: item.description,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase
          .from('bill_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      await fetchBills(); // Refresh the list
      return bill;
    } catch (err) {
      console.error('Error creating bill:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update bill status
  const updateBillStatus = async (billId: string, status: 'pending' | 'paid') => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ 
          status,
          approved_by: status === 'paid' ? user?.id : null 
        })
        .eq('id', billId);

      if (error) throw error;

      await fetchBills(); // Refresh the list
    } catch (err) {
      console.error('Error updating bill status:', err);
      throw err;
    }
  };

  // Get bill with items
  const getBillWithItems = async (billId: string) => {
    try {
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select(`
          *,
          vendor:suppliers (
            id,
            name,
            default_terms
          )
        `)
        .eq('id', billId)
        .single();

      if (billError) throw billError;

      const { data: items, error: itemsError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)
        .order('created_at');

      if (itemsError) throw itemsError;

      return {
        ...bill,
        vendor_name: bill.vendor?.name || 'Unknown Vendor',
        items: items || []
      };
    } catch (err) {
      console.error('Error fetching bill with items:', err);
      throw err;
    }
  };

  // Check if bill number is unique for vendor
  const checkBillNumberUnique = async (vendorId: string, billNumber: string, excludeBillId?: string) => {
    try {
      let query = supabase
        .from('bills')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('bill_number', billNumber);

      if (excludeBillId) {
        query = query.neq('id', excludeBillId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.length === 0;
    } catch (err) {
      console.error('Error checking bill number uniqueness:', err);
      return false;
    }
  };

  // Delete bill
  const deleteBill = async (billId: string) => {
    try {
      // Items will be deleted automatically due to CASCADE
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId);

      if (error) throw error;

      await fetchBills(); // Refresh the list
    } catch (err) {
      console.error('Error deleting bill:', err);
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchBills();
    }
  }, [user]);

  return {
    bills,
    loading,
    error,
    actions: {
      fetchBills,
      createBill,
      updateBillStatus,
      getBillWithItems,
      checkBillNumberUnique,
      deleteBill,
      refreshBills: fetchBills,
    }
  };
};