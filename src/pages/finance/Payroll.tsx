import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, DollarSign, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PayrollRecord {
  id: string;
  employee_id: string;
  app_user_id?: string;
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
  created_at: string;
  updated_at: string;
  notes?: string;
}

interface ActiveEmployee {
  id: string;
  full_name: string;
  company_email: string;
  department: string;
  role: string;
  employee_id?: string;
  salary?: number;
}

export default function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    employee_id: '',
    pay_period_start: '',
    pay_period_end: '',
    base_salary: '',
    gross_pay: '',
    deductions_total: '',
    net_pay: '',
    payment_method: '',
    notes: ''
  });

  // Fetch active employees from database
  const fetchActiveEmployees = async () => {
    try {
      // Fetch active users from app_users
      const { data: users, error: usersError } = await supabase
        .from('app_users')
        .select('id, full_name, company_email, department, role, status')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (usersError) {
        console.error('Error fetching active users:', usersError);
        return;
      }

      if (!users || users.length === 0) {
        setActiveEmployees([]);
        return;
      }

      // Fetch employee details for salary information
      const userIds = users.map(u => u.id);
      const { data: employeeDetails, error: detailsError } = await supabase
        .from('employees_details')
        .select('app_user_id, employee_id, salary')
        .in('app_user_id', userIds);

      if (detailsError) {
        console.error('Error fetching employee details:', detailsError);
      }

      // Combine users with their employee details
      const enrichedEmployees: ActiveEmployee[] = users.map(user => {
        const details = employeeDetails?.find(d => d.app_user_id === user.id);
        return {
          id: user.id,
          full_name: user.full_name,
          company_email: user.company_email,
          department: user.department,
          role: user.role,
          employee_id: details?.employee_id,
          salary: details?.salary
        };
      });

      setActiveEmployees(enrichedEmployees);
    } catch (err) {
      console.error('Error fetching active employees:', err);
    }
  };

  // Fetch payroll records from database
  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('payroll_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching payroll records:', fetchError);
        setError(fetchError.message);
      } else {
        setPayrollRecords(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch payroll records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollRecords();
    fetchActiveEmployees();
  }, []);

  // Filter records based on search
  const filteredRecords = payrollRecords.filter(record =>
    record.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.transaction_ref?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter active employees based on search
  const filteredEmployees = activeEmployees.filter(emp =>
    emp.full_name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.company_email.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'processed': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getPaymentMethodBadgeVariant = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'default';
      case 'upi': return 'secondary';
      case 'cash': return 'outline';
      default: return 'outline';
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const employee = activeEmployees.find(e => e.id === employeeId);

    if (employee) {
      // Auto-populate employee_id and salary if available
      const employeeIdValue = employee.employee_id || employee.id;
      const baseSalary = employee.salary || 0;

      setFormData({
        ...formData,
        employee_id: employeeIdValue,
        base_salary: baseSalary.toString(),
        gross_pay: baseSalary.toString(),
        net_pay: baseSalary.toString()
      });
    }
  };

  const handleAddPayrollRecord = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('payroll_records')
        .insert([{
          employee_id: formData.employee_id,
          app_user_id: selectedEmployeeId, // Link to real user
          pay_period_start: formData.pay_period_start,
          pay_period_end: formData.pay_period_end,
          base_salary: parseFloat(formData.base_salary),
          gross_pay: parseFloat(formData.gross_pay),
          deductions_total: parseFloat(formData.deductions_total) || 0,
          net_pay: parseFloat(formData.net_pay),
          payment_method: formData.payment_method || null,
          notes: formData.notes || null,
          status: 'pending'
        }])
        .select();

      if (insertError) {
        console.error('Error inserting payroll record:', insertError);
        setError(insertError.message);
      } else {
        // Reset form and close dialog
        setFormData({
          employee_id: '',
          pay_period_start: '',
          pay_period_end: '',
          base_salary: '',
          gross_pay: '',
          deductions_total: '',
          net_pay: '',
          payment_method: '',
          notes: ''
        });
        setSelectedEmployeeId('');
        setShowAddDialog(false);
        // Refresh the list
        fetchPayrollRecords();
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to add payroll record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage employee payroll records and payments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayrollRecords}
            disabled={loading}
            className="rounded-none"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <Button
            onClick={() => setShowAddDialog(true)}
            className="rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payroll Record
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollRecords.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {payrollRecords.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {payrollRecords.filter(r => r.status === 'processed').length}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {payrollRecords.filter(r => r.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 rounded-none border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="mb-6 rounded-none">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by employee ID or transaction reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 rounded-none h-10 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Records Table */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Payroll Records ({filteredRecords.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
              <p className="text-muted-foreground">Loading payroll records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payroll records found</h3>
              <p className="text-muted-foreground">
                {payrollRecords.length === 0
                  ? "No payroll records in the system."
                  : "No records match your search criteria."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="border-r border-border/50 text-left">Employee ID</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Pay Period</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Status</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Base Salary</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Gross Pay</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Deductions</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Net Pay</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Payment Method</TableHead>
                    <TableHead className="text-center">Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell className="border-r border-border/50 text-left font-mono">
                        {record.employee_id}
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="text-sm">
                          <div>{formatDate(record.pay_period_start)}</div>
                          <div className="text-muted-foreground text-xs">
                            to {formatDate(record.pay_period_end)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="flex justify-center">
                          <Badge variant={getStatusBadgeVariant(record.status)} className="rounded-none">
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        {formatCurrency(record.base_salary)}
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        {formatCurrency(record.gross_pay)}
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        {formatCurrency(record.deductions_total)}
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <span className="font-medium">{formatCurrency(record.net_pay)}</span>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        {record.payment_method ? (
                          <Badge variant={getPaymentMethodBadgeVariant(record.payment_method)} className="rounded-none">
                            {record.payment_method.replace('_', ' ').toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {record.payment_date ? (
                          <span className="text-sm">{formatDate(record.payment_date)}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payroll Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-none max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payroll Record</DialogTitle>
            <DialogDescription>
              Create a new payroll record for an employee
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="employee">Select Employee *</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={handleEmployeeSelect}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Select an active employee" />
                </SelectTrigger>
                <SelectContent className="rounded-none max-h-60">
                  {activeEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} - {employee.employee_id || employee.id} ({employee.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployeeId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Employee ID: {formData.employee_id}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="text-sm text-muted-foreground">
                {selectedEmployeeId && activeEmployees.find(e => e.id === selectedEmployeeId)?.salary && (
                  <p>Salary auto-populated from employee record</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay_period_start">Pay Period Start *</Label>
              <Input
                id="pay_period_start"
                type="date"
                value={formData.pay_period_start}
                onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay_period_end">Pay Period End *</Label>
              <Input
                id="pay_period_end"
                type="date"
                value={formData.pay_period_end}
                onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_salary">Base Salary *</Label>
              <Input
                id="base_salary"
                type="number"
                step="0.01"
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                placeholder="0.00"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gross_pay">Gross Pay *</Label>
              <Input
                id="gross_pay"
                type="number"
                step="0.01"
                value={formData.gross_pay}
                onChange={(e) => setFormData({ ...formData, gross_pay: e.target.value })}
                placeholder="0.00"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductions_total">Deductions</Label>
              <Input
                id="deductions_total"
                type="number"
                step="0.01"
                value={formData.deductions_total}
                onChange={(e) => setFormData({ ...formData, deductions_total: e.target.value })}
                placeholder="0.00"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="net_pay">Net Pay *</Label>
              <Input
                id="net_pay"
                type="number"
                step="0.01"
                value={formData.net_pay}
                onChange={(e) => setFormData({ ...formData, net_pay: e.target.value })}
                placeholder="0.00"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
                className="rounded-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="rounded-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPayrollRecord}
              disabled={!formData.employee_id || !formData.pay_period_start || !formData.pay_period_end || !formData.base_salary || !formData.gross_pay || !formData.net_pay}
              className="rounded-none"
            >
              Add Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Employees Reference Table */}
      <div className="mt-8">
        <Card className="rounded-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Employees ({filteredEmployees.length})</CardTitle>
              <Input
                placeholder="Search employees..."
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                className="px-4 rounded-none h-10 w-full max-w-sm"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              List of all active employees who can have payroll records
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
                <p className="text-muted-foreground">Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active employees found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border-r border-border/50 text-left">Full Name</TableHead>
                      <TableHead className="border-r border-border/50 text-left">Employee ID</TableHead>
                      <TableHead className="border-r border-border/50 text-left">Email</TableHead>
                      <TableHead className="border-r border-border/50 text-center">Department</TableHead>
                      <TableHead className="border-r border-border/50 text-center">Role</TableHead>
                      <TableHead className="text-center">Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-muted/50">
                        <TableCell className="border-r border-border/50 text-left font-medium">
                          {employee.full_name}
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-left font-mono">
                          {employee.employee_id || '-'}
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-left text-sm">
                          {employee.company_email}
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <Badge variant="outline" className="rounded-none">
                            {employee.department}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <Badge variant="secondary" className="rounded-none">
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {employee.salary ? (
                            <span className="font-medium">{formatCurrency(employee.salary)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
