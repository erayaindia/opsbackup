import { supabase } from '@/integrations/supabase/client';

export interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  run_date: string;
  status: 'pending' | 'processed' | 'paid';
  base_salary: number;
  gross_pay: number;
  deductions_total: number;
  net_pay: number;
  payment_method?: 'bank_transfer' | 'upi' | 'cash';
  payment_date?: string;
  transaction_ref?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  // Joined fields
  employee_name?: string;
  employee_department?: string;
}

export interface CreatePayrollData {
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  gross_pay: number;
  deductions_total: number;
  net_pay: number;
  payment_method?: 'bank_transfer' | 'upi' | 'cash';
  notes?: string;
}

export interface UpdatePayrollData {
  status?: 'pending' | 'processed' | 'paid';
  base_salary?: number;
  gross_pay?: number;
  deductions_total?: number;
  net_pay?: number;
  payment_method?: 'bank_transfer' | 'upi' | 'cash';
  payment_date?: string;
  transaction_ref?: string;
  notes?: string;
}

export interface PayrollFilters {
  employee_id?: string;
  status?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
}

export interface PayrollStats {
  total_records: number;
  pending: number;
  processed: number;
  paid: number;
  total_gross_pay: number;
  total_net_pay: number;
  total_deductions: number;
}

export const payrollService = {
  // Fetch all payroll records with optional filters
  async fetchPayrollRecords(filters?: PayrollFilters): Promise<PayrollRecord[]> {
    try {
      // First get payroll records
      let query = supabase
        .from('payroll_records')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.employee_id) {
          query = query.eq('employee_id', filters.employee_id);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.payment_method && filters.payment_method !== 'all') {
          query = query.eq('payment_method', filters.payment_method);
        }
        if (filters.date_from) {
          query = query.gte('pay_period_start', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('pay_period_end', filters.date_to);
        }
      }

      const { data: payrollData, error: payrollError } = await query;

      if (payrollError) {
        console.error('Error fetching payroll records:', payrollError);
        throw new Error(`Failed to fetch payroll records: ${payrollError.message}`);
      }

      if (!payrollData || payrollData.length === 0) {
        return [];
      }

      // Get unique employee IDs
      const employeeIds = [...new Set(payrollData.map(record => record.employee_id))];

      // Fetch employee details
      const { data: employeesData, error: employeesError } = await supabase
        .from('app_users')
        .select('id, full_name, department')
        .in('id', employeeIds);

      if (employeesError) {
        console.error('Error fetching employee data:', employeesError);
        // Continue without employee names rather than failing
      }

      // Create employee lookup map
      const employeeMap = new Map();
      (employeesData || []).forEach(emp => {
        employeeMap.set(emp.id, {
          full_name: emp.full_name,
          department: emp.department
        });
      });

      // Transform data to include employee info
      return payrollData.map(record => {
        const employee = employeeMap.get(record.employee_id);
        return {
          ...record,
          employee_name: employee?.full_name || `Employee ${record.employee_id}`,
          employee_department: employee?.department || 'Unknown'
        };
      });
    } catch (error) {
      console.error('Error in fetchPayrollRecords:', error);
      throw error;
    }
  },

  // Create a new payroll record
  async createPayrollRecord(payrollData: CreatePayrollData): Promise<PayrollRecord> {
    try {
      const { data: newRecord, error } = await supabase
        .from('payroll_records')
        .insert({
          ...payrollData,
          status: 'pending'
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating payroll record:', error);
        throw new Error(`Failed to create payroll record: ${error.message}`);
      }

      // Fetch employee details separately
      const { data: employeeData } = await supabase
        .from('app_users')
        .select('full_name, department')
        .eq('id', newRecord.employee_id)
        .single();

      return {
        ...newRecord,
        employee_name: employeeData?.full_name || `Employee ${newRecord.employee_id}`,
        employee_department: employeeData?.department || 'Unknown'
      };
    } catch (error) {
      console.error('Error in createPayrollRecord:', error);
      throw error;
    }
  },

  // Update an existing payroll record
  async updatePayrollRecord(id: string, updates: UpdatePayrollData): Promise<PayrollRecord> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedRecord, error } = await supabase
        .from('payroll_records')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating payroll record:', error);
        throw new Error(`Failed to update payroll record: ${error.message}`);
      }

      // Fetch employee details separately
      const { data: employeeData } = await supabase
        .from('app_users')
        .select('full_name, department')
        .eq('id', updatedRecord.employee_id)
        .single();

      return {
        ...updatedRecord,
        employee_name: employeeData?.full_name || `Employee ${updatedRecord.employee_id}`,
        employee_department: employeeData?.department || 'Unknown'
      };
    } catch (error) {
      console.error('Error in updatePayrollRecord:', error);
      throw error;
    }
  },

  // Delete a payroll record
  async deletePayrollRecord(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payroll record:', error);
        throw new Error(`Failed to delete payroll record: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deletePayrollRecord:', error);
      throw error;
    }
  },

  // Mark payroll as processed
  async markAsProcessed(id: string): Promise<PayrollRecord> {
    try {
      return await this.updatePayrollRecord(id, {
        status: 'processed',
        payment_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking payroll as processed:', error);
      throw error;
    }
  },

  // Mark payroll as paid
  async markAsPaid(id: string, transactionRef?: string): Promise<PayrollRecord> {
    try {
      return await this.updatePayrollRecord(id, {
        status: 'paid',
        transaction_ref: transactionRef,
        payment_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking payroll as paid:', error);
      throw error;
    }
  },

  // Get payroll by ID
  async getPayrollById(id: string): Promise<PayrollRecord | null> {
    try {
      const { data: payrollRecord, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Record not found
        }
        console.error('Error fetching payroll by ID:', error);
        throw new Error(`Failed to fetch payroll record: ${error.message}`);
      }

      // Fetch employee details separately
      const { data: employeeData } = await supabase
        .from('app_users')
        .select('full_name, department')
        .eq('id', payrollRecord.employee_id)
        .single();

      return {
        ...payrollRecord,
        employee_name: employeeData?.full_name || `Employee ${payrollRecord.employee_id}`,
        employee_department: employeeData?.department || 'Unknown'
      };
    } catch (error) {
      console.error('Error in getPayrollById:', error);
      throw error;
    }
  },

  // Get payroll statistics
  async getPayrollStats(): Promise<PayrollStats> {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('status, gross_pay, net_pay, deductions_total');

      if (error) {
        console.error('Error fetching payroll stats:', error);
        throw new Error(`Failed to fetch payroll stats: ${error.message}`);
      }

      const records = data || [];

      const stats = {
        total_records: records.length,
        pending: records.filter(r => r.status === 'pending').length,
        processed: records.filter(r => r.status === 'processed').length,
        paid: records.filter(r => r.status === 'paid').length,
        total_gross_pay: records.reduce((sum, r) => sum + r.gross_pay, 0),
        total_net_pay: records.reduce((sum, r) => sum + r.net_pay, 0),
        total_deductions: records.reduce((sum, r) => sum + r.deductions_total, 0)
      };

      return stats;
    } catch (error) {
      console.error('Error in getPayrollStats:', error);
      throw error;
    }
  },

  // Get unique employees for filter dropdown
  async getUniqueEmployees(): Promise<Array<{ employee_id: string; full_name: string }>> {
    try {
      // Get unique employee IDs from payroll records
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll_records')
        .select('employee_id');

      if (payrollError) {
        console.error('Error fetching payroll employee IDs:', payrollError);
        throw new Error(`Failed to fetch employees: ${payrollError.message}`);
      }

      if (!payrollData || payrollData.length === 0) {
        return [];
      }

      // Get unique employee IDs
      const uniqueEmployeeIds = [...new Set(payrollData.map(record => record.employee_id))];

      // Fetch employee details
      const { data: employeesData, error: employeesError } = await supabase
        .from('app_users')
        .select('id, full_name')
        .in('id', uniqueEmployeeIds)
        .order('full_name');

      if (employeesError) {
        console.error('Error fetching employee details:', employeesError);
        // Return employee IDs without names if employee fetch fails
        return uniqueEmployeeIds.map(id => ({
          employee_id: id,
          full_name: `Employee ${id}`
        }));
      }

      // Create the result array
      const result = uniqueEmployeeIds.map(id => {
        const employee = employeesData?.find(emp => emp.id === id);
        return {
          employee_id: id,
          full_name: employee?.full_name || `Employee ${id}`
        };
      });

      return result;
    } catch (error) {
      console.error('Error in getUniqueEmployees:', error);
      throw error;
    }
  }
};