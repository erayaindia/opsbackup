import { useState, useEffect, useCallback } from 'react';
import { payrollService, PayrollRecord, CreatePayrollData, UpdatePayrollData, PayrollFilters, PayrollStats } from '@/services/payrollService';

export const usePayroll = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Array<{ employee_id: string; full_name: string }>>([]);
  const [stats, setStats] = useState<PayrollStats>({
    total_records: 0,
    pending: 0,
    processed: 0,
    paid: 0,
    total_gross_pay: 0,
    total_net_pay: 0,
    total_deductions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all payroll records
  const fetchPayrollRecords = useCallback(async (filters?: PayrollFilters) => {
    try {
      setLoading(true);
      setError(null);

      const records = await payrollService.fetchPayrollRecords(filters);
      setPayrollRecords(records);
    } catch (err) {
      console.error('Error fetching payroll records:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payroll records');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch payroll statistics
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await payrollService.getPayrollStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching payroll stats:', err);
      // Don't set error here as stats are not critical
    }
  }, []);

  // Fetch unique employees
  const fetchEmployees = useCallback(async () => {
    try {
      const employeeList = await payrollService.getUniqueEmployees();
      setEmployees(employeeList);
    } catch (err) {
      console.error('Error fetching employees:', err);
      // Don't set error here as employees are not critical
    }
  }, []);

  // Create a new payroll record
  const createPayrollRecord = useCallback(async (payrollData: CreatePayrollData): Promise<PayrollRecord> => {
    try {
      const newRecord = await payrollService.createPayrollRecord(payrollData);

      // Update local state
      setPayrollRecords(prev => [newRecord, ...prev]);

      // Refresh stats and employees
      await Promise.all([fetchStats(), fetchEmployees()]);

      return newRecord;
    } catch (err) {
      console.error('Error creating payroll record:', err);
      throw err;
    }
  }, [fetchStats, fetchEmployees]);

  // Update an existing payroll record
  const updatePayrollRecord = useCallback(async (id: string, updates: UpdatePayrollData): Promise<PayrollRecord> => {
    try {
      const updatedRecord = await payrollService.updatePayrollRecord(id, updates);

      // Update local state
      setPayrollRecords(prev => prev.map(record => record.id === id ? updatedRecord : record));

      // Refresh stats
      await fetchStats();

      return updatedRecord;
    } catch (err) {
      console.error('Error updating payroll record:', err);
      throw err;
    }
  }, [fetchStats]);

  // Delete a payroll record
  const deletePayrollRecord = useCallback(async (id: string): Promise<void> => {
    try {
      await payrollService.deletePayrollRecord(id);

      // Update local state
      setPayrollRecords(prev => prev.filter(record => record.id !== id));

      // Refresh stats
      await fetchStats();
    } catch (err) {
      console.error('Error deleting payroll record:', err);
      throw err;
    }
  }, [fetchStats]);

  // Mark payroll as processed
  const markAsProcessed = useCallback(async (id: string): Promise<PayrollRecord> => {
    try {
      const updatedRecord = await payrollService.markAsProcessed(id);

      // Update local state
      setPayrollRecords(prev => prev.map(record => record.id === id ? updatedRecord : record));

      // Refresh stats
      await fetchStats();

      return updatedRecord;
    } catch (err) {
      console.error('Error marking payroll as processed:', err);
      throw err;
    }
  }, [fetchStats]);

  // Mark payroll as paid
  const markAsPaid = useCallback(async (id: string, transactionRef?: string): Promise<PayrollRecord> => {
    try {
      const updatedRecord = await payrollService.markAsPaid(id, transactionRef);

      // Update local state
      setPayrollRecords(prev => prev.map(record => record.id === id ? updatedRecord : record));

      // Refresh stats
      await fetchStats();

      return updatedRecord;
    } catch (err) {
      console.error('Error marking payroll as paid:', err);
      throw err;
    }
  }, [fetchStats]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchPayrollRecords(),
      fetchStats(),
      fetchEmployees()
    ]);
  }, [fetchPayrollRecords, fetchStats, fetchEmployees]);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchPayrollRecords(),
          fetchStats(),
          fetchEmployees()
        ]);
      } catch (err) {
        console.error('Error initializing payroll data:', err);
        setError('Failed to initialize payroll data');
      }
    };

    initializeData();
  }, [fetchPayrollRecords, fetchStats, fetchEmployees]);

  return {
    // Data
    payrollRecords,
    employees,
    stats,
    loading,
    error,

    // Actions
    actions: {
      fetchPayrollRecords,
      createPayrollRecord,
      updatePayrollRecord,
      deletePayrollRecord,
      markAsProcessed,
      markAsPaid,
      refreshData
    }
  };
};