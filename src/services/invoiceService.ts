import { supabase } from '@/integrations/supabase/client';

export interface InvoiceDetail {
  id: string;
  bill_number: string;
  vendor_name: string;
  vendor_gstin?: string;
  vendor_contact?: string;
  type: 'stock' | 'expense' | 'service' | 'capex';
  bill_date: string; // ISO date string from database
  due_date: string; // ISO date string from database
  status: 'draft' | 'pending' | 'approved' | 'part_paid' | 'paid' | 'void';
  grand_total: number;
  amount_paid: number;
  amount_due: number; // Calculated field
  subtotal: number;
  discount_amount: number;
  freight_amount: number;
  other_charges: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  tcs: number;
  tds: number;
  round_off: number;
  gst_scheme?: string;
  place_of_supply?: string;
  itc_eligible: boolean;
  currency: string;
  exchange_rate: number;
  reason?: string;
  notes_internal?: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  file_size?: number;
  created_by: string;
  created_at: string;
  approved_by?: string;
  updated_at?: string;
  organization_id?: string;
  is_deleted: boolean;
}

export interface CreateInvoiceData {
  bill_number: string;
  vendor_name: string;
  vendor_gstin?: string;
  vendor_contact?: string;
  type: 'stock' | 'expense' | 'service' | 'capex';
  bill_date: string;
  due_date: string;
  status?: 'draft' | 'pending' | 'approved' | 'part_paid' | 'paid' | 'void';
  grand_total: number;
  amount_paid?: number;
  subtotal: number;
  discount_amount?: number;
  freight_amount?: number;
  other_charges?: number;
  taxable_value: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  tcs?: number;
  tds?: number;
  round_off?: number;
  gst_scheme?: string;
  place_of_supply?: string;
  itc_eligible?: boolean;
  currency?: string;
  exchange_rate?: number;
  reason?: string;
  notes_internal?: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  file_size?: number;
  created_by: string;
  organization_id?: string;
}

export interface UpdateInvoiceData {
  vendor_name?: string;
  vendor_gstin?: string;
  vendor_contact?: string;
  type?: 'stock' | 'expense' | 'service' | 'capex';
  bill_date?: string;
  due_date?: string;
  status?: 'draft' | 'pending' | 'approved' | 'part_paid' | 'paid' | 'void';
  grand_total?: number;
  amount_paid?: number;
  subtotal?: number;
  discount_amount?: number;
  freight_amount?: number;
  other_charges?: number;
  taxable_value?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  tcs?: number;
  tds?: number;
  round_off?: number;
  gst_scheme?: string;
  place_of_supply?: string;
  itc_eligible?: boolean;
  currency?: string;
  exchange_rate?: number;
  reason?: string;
  notes_internal?: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  file_size?: number;
  approved_by?: string;
  updated_at?: string;
}

export interface InvoiceFilters {
  search?: string;
  type?: string;
  status?: string;
  vendor_name?: string;
  date_from?: string;
  date_to?: string;
  itc_eligible?: boolean;
  organization_id?: string;
}

export const invoiceService = {
  // Fetch all invoices with optional filters
  async fetchInvoices(filters?: InvoiceFilters): Promise<InvoiceDetail[]> {
    try {
      let query = supabase
        .from('invoice_details')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.type && filters.type !== 'all') {
          query = query.eq('type', filters.type);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.vendor_name && filters.vendor_name !== 'all') {
          query = query.eq('vendor_name', filters.vendor_name);
        }
        if (filters.date_from) {
          query = query.gte('bill_date', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('bill_date', filters.date_to);
        }
        if (filters.itc_eligible !== undefined) {
          query = query.eq('itc_eligible', filters.itc_eligible);
        }
        if (filters.organization_id) {
          query = query.eq('organization_id', filters.organization_id);
        }
        if (filters.search) {
          query = query.or(`bill_number.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%,reason.ilike.%${filters.search}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching invoices:', error);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchInvoices:', error);
      throw error;
    }
  },

  // Create a new invoice
  async createInvoice(invoiceData: CreateInvoiceData): Promise<InvoiceDetail> {
    try {
      const { data, error } = await supabase
        .from('invoice_details')
        .insert({
          ...invoiceData,
          status: invoiceData.status || 'draft',
          amount_paid: invoiceData.amount_paid || 0,
          discount_amount: invoiceData.discount_amount || 0,
          freight_amount: invoiceData.freight_amount || 0,
          other_charges: invoiceData.other_charges || 0,
          cgst: invoiceData.cgst || 0,
          sgst: invoiceData.sgst || 0,
          igst: invoiceData.igst || 0,
          tcs: invoiceData.tcs || 0,
          tds: invoiceData.tds || 0,
          round_off: invoiceData.round_off || 0,
          itc_eligible: invoiceData.itc_eligible || false,
          currency: invoiceData.currency || 'INR',
          exchange_rate: invoiceData.exchange_rate || 1.0,
          is_deleted: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invoice:', error);
        throw new Error(`Failed to create invoice: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createInvoice:', error);
      throw error;
    }
  },

  // Update an existing invoice
  async updateInvoice(id: string, updates: UpdateInvoiceData): Promise<InvoiceDetail> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('invoice_details')
        .update(updateData)
        .eq('id', id)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice:', error);
        throw new Error(`Failed to update invoice: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateInvoice:', error);
      throw error;
    }
  },

  // Soft delete an invoice
  async deleteInvoice(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoice_details')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting invoice:', error);
        throw new Error(`Failed to delete invoice: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteInvoice:', error);
      throw error;
    }
  },

  // Approve an invoice
  async approveInvoice(id: string, approvedBy: string): Promise<InvoiceDetail> {
    try {
      const { data, error } = await supabase
        .from('invoice_details')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) {
        console.error('Error approving invoice:', error);
        throw new Error(`Failed to approve invoice: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in approveInvoice:', error);
      throw error;
    }
  },

  // Mark payment for an invoice
  async markPayment(id: string, paymentAmount: number): Promise<InvoiceDetail> {
    try {
      // First get the current invoice to calculate new amounts
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoice_details')
        .select('grand_total, amount_paid')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch invoice: ${fetchError.message}`);
      }

      const newAmountPaid = (currentInvoice.amount_paid || 0) + paymentAmount;
      const newAmountDue = currentInvoice.grand_total - newAmountPaid;

      // Determine new status based on payment
      let newStatus: 'part_paid' | 'paid' = 'part_paid';
      if (newAmountDue <= 0) {
        newStatus = 'paid';
      }

      const { data, error } = await supabase
        .from('invoice_details')
        .update({
          amount_paid: Math.min(newAmountPaid, currentInvoice.grand_total),
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) {
        console.error('Error marking payment:', error);
        throw new Error(`Failed to mark payment: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in markPayment:', error);
      throw error;
    }
  },

  // Void an invoice
  async voidInvoice(id: string): Promise<InvoiceDetail> {
    try {
      const { data, error } = await supabase
        .from('invoice_details')
        .update({
          status: 'void',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) {
        console.error('Error voiding invoice:', error);
        throw new Error(`Failed to void invoice: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in voidInvoice:', error);
      throw error;
    }
  },

  // Get invoice by ID
  async getInvoiceById(id: string): Promise<InvoiceDetail | null> {
    try {
      const { data, error } = await supabase
        .from('invoice_details')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Invoice not found
        }
        console.error('Error fetching invoice by ID:', error);
        throw new Error(`Failed to fetch invoice: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getInvoiceById:', error);
      throw error;
    }
  },

  // Get invoice statistics
  async getInvoiceStats(organizationId?: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalValue: number;
    totalDue: number;
  }> {
    try {
      let query = supabase
        .from('invoice_details')
        .select('status, grand_total, amount_due, due_date')
        .eq('is_deleted', false);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching invoice stats:', error);
        throw new Error(`Failed to fetch invoice stats: ${error.message}`);
      }

      const invoices = data || [];
      const now = new Date();

      const stats = {
        total: invoices.length,
        paid: invoices.filter(inv => inv.status === 'paid').length,
        pending: invoices.filter(inv => inv.status === 'pending' || inv.status === 'approved').length,
        overdue: invoices.filter(inv =>
          inv.amount_due > 0 && new Date(inv.due_date) < now
        ).length,
        totalValue: invoices.reduce((sum, inv) => sum + inv.grand_total, 0),
        totalDue: invoices.reduce((sum, inv) => sum + inv.amount_due, 0)
      };

      return stats;
    } catch (error) {
      console.error('Error in getInvoiceStats:', error);
      throw error;
    }
  },

  // Get unique vendors for filter dropdown
  async getUniqueVendors(organizationId?: string): Promise<string[]> {
    try {
      let query = supabase
        .from('invoice_details')
        .select('vendor_name')
        .eq('is_deleted', false);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching unique vendors:', error);
        throw new Error(`Failed to fetch vendors: ${error.message}`);
      }

      const vendors = [...new Set((data || []).map(item => item.vendor_name))];
      return vendors.filter(vendor => vendor && vendor.trim() !== '');
    } catch (error) {
      console.error('Error in getUniqueVendors:', error);
      throw error;
    }
  }
};