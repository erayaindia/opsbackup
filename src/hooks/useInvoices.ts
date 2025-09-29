import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invoiceService, InvoiceDetail, CreateInvoiceData, UpdateInvoiceData, InvoiceFilters } from '@/services/invoiceService';

// Transform database data to UI format
export interface Bill {
  id: string;
  bill_number: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_gstin: string;
  vendor_contact: string;
  type: 'stock' | 'expense' | 'service' | 'capex';
  bill_date: Date;
  due_date: Date;
  status: 'draft' | 'pending' | 'approved' | 'part_paid' | 'paid' | 'void';
  grand_total: number;
  amount_paid: number;
  amount_due: number;
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
  gst_scheme: string;
  place_of_supply: string;
  itc_eligible: boolean;
  currency: string;
  exchange_rate: number;
  reason: string;
  notes_internal: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  file_size?: number;
  created_by: string;
  created_at: Date;
  approved_by?: string;
  updated_at?: Date;
  organization_id?: string;
  is_deleted: boolean;
  verified: boolean;
}

export interface InvoiceStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalValue: number;
  totalDue: number;
}

export const useInvoices = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalValue: 0,
    totalDue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Transform database invoice to UI bill format
  const transformInvoiceToBill = (invoice: InvoiceDetail): Bill => ({
    id: invoice.id,
    bill_number: invoice.bill_number,
    vendor_id: invoice.vendor_id,
    vendor_name: invoice.vendor_name,
    vendor_gstin: invoice.vendor_gstin || '',
    vendor_contact: invoice.vendor_contact || '',
    type: invoice.type,
    bill_date: new Date(invoice.bill_date),
    due_date: new Date(invoice.due_date),
    status: invoice.status,
    grand_total: invoice.grand_total,
    amount_paid: invoice.amount_paid,
    amount_due: invoice.amount_due,
    subtotal: invoice.subtotal,
    discount_amount: invoice.discount_amount,
    freight_amount: invoice.freight_amount,
    other_charges: invoice.other_charges,
    taxable_value: invoice.taxable_value,
    cgst: invoice.cgst,
    sgst: invoice.sgst,
    igst: invoice.igst,
    tcs: invoice.tcs,
    tds: invoice.tds,
    round_off: invoice.round_off,
    gst_scheme: invoice.gst_scheme || '',
    place_of_supply: invoice.place_of_supply || '',
    itc_eligible: invoice.itc_eligible,
    currency: invoice.currency,
    exchange_rate: invoice.exchange_rate,
    reason: invoice.reason || '',
    notes_internal: invoice.notes_internal || '',
    file_url: invoice.file_url,
    file_type: invoice.file_type,
    file_name: invoice.file_name,
    file_size: invoice.file_size,
    created_by: invoice.created_by,
    created_at: new Date(invoice.created_at),
    approved_by: invoice.approved_by,
    updated_at: invoice.updated_at ? new Date(invoice.updated_at) : undefined,
    organization_id: invoice.organization_id,
    is_deleted: invoice.is_deleted,
    verified: invoice.verified
  });

  // Transform UI bill to database format for creation
  const transformBillToCreateData = (bill: Partial<Bill>): CreateInvoiceData => ({
    bill_number: bill.bill_number!,
    vendor_name: bill.vendor_name!,
    vendor_gstin: bill.vendor_gstin,
    vendor_contact: bill.vendor_contact,
    type: bill.type!,
    bill_date: bill.bill_date!.toISOString().split('T')[0], // Convert to YYYY-MM-DD
    due_date: bill.due_date!.toISOString().split('T')[0], // Convert to YYYY-MM-DD
    status: bill.status || 'draft',
    grand_total: bill.grand_total!,
    amount_paid: bill.amount_paid || 0,
    subtotal: bill.subtotal!,
    discount_amount: bill.discount_amount || 0,
    freight_amount: bill.freight_amount || 0,
    other_charges: bill.other_charges || 0,
    taxable_value: bill.taxable_value!,
    cgst: bill.cgst || 0,
    sgst: bill.sgst || 0,
    igst: bill.igst || 0,
    tcs: bill.tcs || 0,
    tds: bill.tds || 0,
    round_off: bill.round_off || 0,
    gst_scheme: bill.gst_scheme,
    place_of_supply: bill.place_of_supply,
    itc_eligible: bill.itc_eligible || false,
    currency: bill.currency || 'INR',
    exchange_rate: bill.exchange_rate || 1,
    reason: bill.reason,
    notes_internal: bill.notes_internal,
    file_url: bill.file_url,
    file_type: bill.file_type,
    file_name: bill.file_name,
    file_size: bill.file_size,
    created_by: bill.created_by || user?.id || 'system'
  });

  // Fetch all invoices
  const fetchInvoices = useCallback(async (filters?: InvoiceFilters) => {
    try {
      setLoading(true);
      setError(null);

      const invoices = await invoiceService.fetchInvoices(filters);
      const transformedBills = invoices.map(transformInvoiceToBill);

      setBills(transformedBills);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch invoice statistics
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await invoiceService.getInvoiceStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching invoice stats:', err);
      // Don't set error here as stats are not critical
    }
  }, []);

  // Fetch unique vendors
  const fetchVendors = useCallback(async () => {
    try {
      const vendorList = await invoiceService.getUniqueVendors();
      setVendors(vendorList);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      // Don't set error here as vendors are not critical
    }
  }, []);

  // Generate next sequential bill number
  const generateNextBillNumber = useCallback(async (): Promise<string> => {
    try {
      return await invoiceService.generateNextBillNumber();
    } catch (err) {
      console.error('Error generating bill number:', err);
      // Fallback to timestamp-based number if generation fails
      return Date.now().toString().slice(-6);
    }
  }, []);

  // Create a new invoice
  const createInvoice = useCallback(async (billData: Partial<Bill>): Promise<Bill> => {
    try {
      const createData = transformBillToCreateData(billData);
      const createdInvoice = await invoiceService.createInvoice(createData);
      const transformedBill = transformInvoiceToBill(createdInvoice);

      // Update local state
      setBills(prev => [transformedBill, ...prev]);

      // Refresh stats and vendors
      await Promise.all([fetchStats(), fetchVendors()]);

      return transformedBill;
    } catch (err) {
      console.error('Error creating invoice:', err);
      throw err;
    }
  }, [fetchStats, fetchVendors]);

  // Update an existing invoice
  const updateInvoice = useCallback(async (id: string, updates: Partial<Bill>): Promise<Bill> => {
    try {
      const updateData: UpdateInvoiceData = {};

      // Map UI fields to database fields
      if (updates.vendor_name !== undefined) updateData.vendor_name = updates.vendor_name;
      if (updates.vendor_gstin !== undefined) updateData.vendor_gstin = updates.vendor_gstin;
      if (updates.vendor_contact !== undefined) updateData.vendor_contact = updates.vendor_contact;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.bill_date !== undefined) updateData.bill_date = updates.bill_date.toISOString().split('T')[0];
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date.toISOString().split('T')[0];
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.grand_total !== undefined) updateData.grand_total = updates.grand_total;
      if (updates.amount_paid !== undefined) updateData.amount_paid = updates.amount_paid;
      if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
      if (updates.discount_amount !== undefined) updateData.discount_amount = updates.discount_amount;
      if (updates.freight_amount !== undefined) updateData.freight_amount = updates.freight_amount;
      if (updates.other_charges !== undefined) updateData.other_charges = updates.other_charges;
      if (updates.taxable_value !== undefined) updateData.taxable_value = updates.taxable_value;
      if (updates.cgst !== undefined) updateData.cgst = updates.cgst;
      if (updates.sgst !== undefined) updateData.sgst = updates.sgst;
      if (updates.igst !== undefined) updateData.igst = updates.igst;
      if (updates.tcs !== undefined) updateData.tcs = updates.tcs;
      if (updates.tds !== undefined) updateData.tds = updates.tds;
      if (updates.round_off !== undefined) updateData.round_off = updates.round_off;
      if (updates.gst_scheme !== undefined) updateData.gst_scheme = updates.gst_scheme;
      if (updates.place_of_supply !== undefined) updateData.place_of_supply = updates.place_of_supply;
      if (updates.itc_eligible !== undefined) updateData.itc_eligible = updates.itc_eligible;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.exchange_rate !== undefined) updateData.exchange_rate = updates.exchange_rate;
      if (updates.reason !== undefined) updateData.reason = updates.reason;
      if (updates.notes_internal !== undefined) updateData.notes_internal = updates.notes_internal;
      if (updates.file_url !== undefined) updateData.file_url = updates.file_url;
      if (updates.file_type !== undefined) updateData.file_type = updates.file_type;
      if (updates.file_name !== undefined) updateData.file_name = updates.file_name;
      if (updates.file_size !== undefined) updateData.file_size = updates.file_size;
      if (updates.verified !== undefined) updateData.verified = updates.verified;

      const updatedInvoice = await invoiceService.updateInvoice(id, updateData);
      const transformedBill = transformInvoiceToBill(updatedInvoice);

      // Update local state
      setBills(prev => prev.map(bill => bill.id === id ? transformedBill : bill));

      // Refresh stats
      await fetchStats();

      return transformedBill;
    } catch (err) {
      console.error('Error updating invoice:', err);
      throw err;
    }
  }, [fetchStats]);

  // Delete an invoice
  const deleteInvoice = useCallback(async (id: string): Promise<void> => {
    try {
      await invoiceService.deleteInvoice(id);

      // Update local state
      setBills(prev => prev.filter(bill => bill.id !== id));

      // Refresh stats
      await fetchStats();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      throw err;
    }
  }, [fetchStats]);

  // Approve an invoice
  const approveInvoice = useCallback(async (id: string): Promise<Bill> => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const approvedInvoice = await invoiceService.approveInvoice(id, user.id);
      const transformedBill = transformInvoiceToBill(approvedInvoice);

      // Update local state
      setBills(prev => prev.map(bill => bill.id === id ? transformedBill : bill));

      // Refresh stats
      await fetchStats();

      return transformedBill;
    } catch (err) {
      console.error('Error approving invoice:', err);
      throw err;
    }
  }, [user?.id, fetchStats]);

  // Mark payment for an invoice
  const markPayment = useCallback(async (id: string, paymentAmount: number): Promise<Bill> => {
    try {
      const updatedInvoice = await invoiceService.markPayment(id, paymentAmount);
      const transformedBill = transformInvoiceToBill(updatedInvoice);

      // Update local state
      setBills(prev => prev.map(bill => bill.id === id ? transformedBill : bill));

      // Refresh stats
      await fetchStats();

      return transformedBill;
    } catch (err) {
      console.error('Error marking payment:', err);
      throw err;
    }
  }, [fetchStats]);

  // Void an invoice
  const voidInvoice = useCallback(async (id: string): Promise<Bill> => {
    try {
      const voidedInvoice = await invoiceService.voidInvoice(id);
      const transformedBill = transformInvoiceToBill(voidedInvoice);

      // Update local state
      setBills(prev => prev.map(bill => bill.id === id ? transformedBill : bill));

      // Refresh stats
      await fetchStats();

      return transformedBill;
    } catch (err) {
      console.error('Error voiding invoice:', err);
      throw err;
    }
  }, [fetchStats]);

  // Toggle verification status
  const toggleVerification = useCallback(async (id: string, verified: boolean): Promise<Bill> => {
    try {
      const updatedInvoice = await invoiceService.updateInvoice(id, { verified });
      const transformedBill = transformInvoiceToBill(updatedInvoice);

      // Update local state
      setBills(prev => prev.map(bill => bill.id === id ? transformedBill : bill));

      return transformedBill;
    } catch (err) {
      console.error('Error toggling verification:', err);
      throw err;
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchInvoices(),
      fetchStats(),
      fetchVendors()
    ]);
  }, [fetchInvoices, fetchStats, fetchVendors]);

  // Initialize user and fetch initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch initial data
        if (currentUser) {
          await Promise.all([
            fetchInvoices(),
            fetchStats(),
            fetchVendors()
          ]);
        }
      } catch (err) {
        console.error('Error initializing invoice data:', err);
        setError('Failed to initialize invoice data');
      }
    };

    initializeData();
  }, [fetchInvoices, fetchStats, fetchVendors]);

  return {
    // Data
    bills,
    vendors,
    stats,
    loading,
    error,
    user,

    // Actions
    actions: {
      fetchInvoices,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      approveInvoice,
      markPayment,
      voidInvoice,
      toggleVerification,
      refreshData,
      generateNextBillNumber
    }
  };
};