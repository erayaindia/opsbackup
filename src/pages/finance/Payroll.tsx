import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Calendar, Plus, AlertCircle, Users, FileText, CheckCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PayrollPeriod {
  id: string;
  period_name: string;
  period_month: number;
  period_year: number;
  period_start_date: string;
  period_end_date: string;
  working_days: number;
  status: string;
  created_at: string;
}

export default function Payroll() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [workingDays, setWorkingDays] = useState<number | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<PayrollPeriod | null>(null);

  // Fetch payroll periods
  const fetchPeriods = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (error) {
        console.error('Error fetching periods:', error);
        toast.error('Failed to fetch payroll periods');
        return;
      }

      setPeriods(data || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  // Calculate working days for selected month/year
  const calculateWorkingDays = async () => {
    if (!selectedMonth || !selectedYear) return;

    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    try {
      // Call the database function to calculate working days
      const { data, error } = await supabase.rpc('calculate_working_days', {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
      });

      if (error) {
        console.error('Error calculating working days:', error);
        toast.error('Failed to calculate working days');
        return;
      }

      setWorkingDays(data);

      // Also fetch holidays for display
      const { data: holidaysData, error: holidaysError } = await supabase
        .from('calendar_holidays')
        .select('*')
        .gte('holiday_date', format(startDate, 'yyyy-MM-dd'))
        .lte('holiday_date', format(endDate, 'yyyy-MM-dd'))
        .order('holiday_date');

      if (!holidaysError && holidaysData) {
        setHolidays(holidaysData);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Generate payroll records for a period
  const handleGenerateRecords = async (period: PayrollPeriod) => {
    setGeneratingFor(period.id);

    try {
      // Step 1: Fetch all active employees with their details
      // First get active users
      const { data: activeUsers, error: usersError } = await supabase
        .from('app_users')
        .select('*')
        .eq('status', 'active');

      if (usersError) {
        console.error('Error fetching active users:', usersError);
        toast.error('Failed to fetch active users');
        return;
      }

      if (!activeUsers || activeUsers.length === 0) {
        toast.warning('No active users found');
        return;
      }

      // Get employee details for these users
      const userIds = activeUsers.map(u => u.id);
      const { data: employeeDetails, error: detailsError } = await supabase
        .from('employees_details')
        .select('*')
        .in('app_user_id', userIds);

      if (detailsError) {
        console.error('Error fetching employee details:', detailsError);
      }

      // Create a map for quick lookup
      const detailsMap = new Map();
      employeeDetails?.forEach(detail => {
        detailsMap.set(detail.app_user_id, detail);
      });

      // Transform and combine the data
      const employees = activeUsers.map(user => {
        const details = detailsMap.get(user.id);
        return {
          app_user_id: user.id,
          employee_id: details?.employee_id || user.id,
          employee_name: user.full_name,
          designation: details?.position || user.role,
          department: user.department,
          salary_type: details?.salary_type || 'monthly',
          monthly_salary: details?.monthly_salary || details?.salary || 0,
          daily_rate: details?.daily_rate || 0,
          hourly_rate: details?.hourly_rate || 0
        };
      });

      let employeesError = null;

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        toast.error('Failed to fetch employee data');
        return;
      }

      if (!employees || employees.length === 0) {
        toast.warning('No active employees found');
        return;
      }

      // Step 2: Fetch attendance data for the period
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('check_in_time', period.period_start_date)
        .lte('check_in_time', period.period_end_date);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        toast.error('Failed to fetch attendance data');
        return;
      }

      // Fetch holidays for this period to properly calculate working days
      const { data: holidaysInPeriod } = await supabase
        .from('calendar_holidays')
        .select('holiday_date')
        .gte('holiday_date', period.period_start_date)
        .lte('holiday_date', period.period_end_date);

      const holidayDates = new Set(holidaysInPeriod?.map(h => h.holiday_date) || []);

      // Step 3: Process each employee
      const recordsToInsert = [];

      for (const employee of employees) {
        // Calculate attendance stats for this employee
        const employeeAttendance = attendanceData?.filter(a => a.employee_id === employee.employee_id) || [];

        // Count actual present days from attendance records
        const markedPresentDays = employeeAttendance.filter(a => a.status === 'present').length;
        const markedAbsentDays = employeeAttendance.filter(a => a.status === 'absent').length;
        const markedLeaveDays = employeeAttendance.filter(a => a.status === 'leave' || a.status === 'on_leave').length;

        // Get all working days in the period (excluding holidays)
        const totalWorkingDays = period.working_days;

        // Calculate present days - ONLY count actual attendance records
        // If no attendance records exist, present days should be 0
        const presentDays = markedPresentDays;

        // Calculate absent days - all working days minus present days
        const absentDays = totalWorkingDays - presentDays - markedLeaveDays;

        console.log(`Employee: ${employee.employee_name}`);
        console.log(`  - Total Working Days: ${totalWorkingDays}`);
        console.log(`  - Attendance Records Found: ${employeeAttendance.length}`);
        console.log(`  - Present Days: ${presentDays}`);
        console.log(`  - Absent Days: ${absentDays}`);
        console.log(`  - Leave Days: ${markedLeaveDays}`);

        // Calculate overtime hours
        const overtimeHours = employeeAttendance.reduce((total, record) => {
          if (record.overtime_hours) return total + parseFloat(record.overtime_hours);
          return total;
        }, 0);

        // Calculate base salary based on salary type
        let basePay = 0;
        let overtimePay = 0;
        const monthlySalary = parseFloat(employee.monthly_salary || '0');
        const dailyRate = parseFloat(employee.daily_rate || '0');
        const hourlyRate = parseFloat(employee.hourly_rate || '0');

        if (employee.salary_type === 'monthly' && monthlySalary > 0) {
          // Monthly salary calculation with proration
          basePay = (monthlySalary / period.working_days) * presentDays;

          // Calculate overtime rate (1.5x of hourly rate derived from monthly)
          const derivedHourlyRate = monthlySalary / (period.working_days * 8);
          overtimePay = overtimeHours * derivedHourlyRate * 1.5;

        } else if (employee.salary_type === 'daily' && dailyRate > 0) {
          basePay = dailyRate * presentDays;
          overtimePay = overtimeHours * (dailyRate / 8) * 1.5;

        } else if (employee.salary_type === 'hourly' && hourlyRate > 0) {
          const regularHours = presentDays * 8;
          basePay = hourlyRate * regularHours;
          overtimePay = overtimeHours * hourlyRate * 1.5;
        }

        // Round to 2 decimal places
        basePay = Math.round(basePay * 100) / 100;
        overtimePay = Math.round(overtimePay * 100) / 100;

        // Prepare the record matching the actual schema
        const grossPay = basePay + overtimePay;

        recordsToInsert.push({
          payroll_period_id: period.id,
          app_user_id: employee.app_user_id,
          employee_id: employee.employee_id,
          employee_name: employee.employee_name,
          employee_role: employee.designation,
          employee_type: employee.salary_type || 'monthly',

          // Attendance
          days_present: presentDays,
          days_paid_leave: 0,
          days_unpaid_leave: absentDays,
          days_late: 0,
          overtime_hours: overtimeHours,

          // Salary calculations
          base_salary_rate: monthlySalary || dailyRate || hourlyRate || 0,
          calculated_base_pay: basePay,

          // Earnings
          overtime_pay: overtimePay,
          attendance_bonus: 0,
          incentives: 0,
          reimbursements: 0,
          other_earnings: 0,
          total_earnings: grossPay,

          // Deductions
          late_penalty: 0,
          unpaid_leave_deduction: 0,
          advance_recovery: 0,
          damage_penalty: 0,
          pf_deduction: 0,
          esi_deduction: 0,
          tds_deduction: 0,
          other_deductions: 0,
          total_deductions: 0,

          // Final amounts
          gross_pay: grossPay,
          net_pay: grossPay, // No deductions yet

          // Payment info
          status: 'draft',
          payment_method: null,
          payment_date: null,
          payment_reference: null,

          notes: null
        });
      }

      // Step 4: Insert records (upsert to handle regeneration)
      const { error: insertError } = await supabase
        .from('payroll_records')
        .upsert(recordsToInsert, {
          onConflict: 'payroll_period_id,app_user_id'
        });

      if (insertError) {
        console.error('Error inserting payroll records:', insertError);
        toast.error('Failed to generate payroll records');
        return;
      }

      // Step 5: Update period status to 'in_review' (since 'generated' is not in the schema)
      const { error: updateError } = await supabase
        .from('payroll_periods')
        .update({ status: 'in_review' })
        .eq('id', period.id);

      if (updateError) {
        console.error('Error updating period status:', updateError);
      }

      toast.success(`Generated payroll records for ${recordsToInsert.length} employees (${period.working_days} working days)`);
      console.log(`Payroll generation complete: ${recordsToInsert.length} records created for period with ${period.working_days} working days`);
      fetchPeriods(); // Refresh the periods list

    } catch (error) {
      console.error('Error generating payroll:', error);
      toast.error('Failed to generate payroll records');
    } finally {
      setGeneratingFor(null);
    }
  };

  // Delete payroll period
  const handleDeletePeriod = async () => {
    if (!periodToDelete) return;

    setDeletingId(periodToDelete.id);

    try {
      // First, check if there are any payroll records for this period
      const { data: records, error: checkError } = await supabase
        .from('payroll_records')
        .select('id')
        .eq('payroll_period_id', periodToDelete.id)
        .limit(1);

      if (checkError) {
        console.error('Error checking records:', checkError);
        toast.error('Failed to check for existing records');
        return;
      }

      if (records && records.length > 0) {
        // Delete related payroll records first
        const { error: recordsError } = await supabase
          .from('payroll_records')
          .delete()
          .eq('payroll_period_id', periodToDelete.id);

        if (recordsError) {
          console.error('Error deleting payroll records:', recordsError);
          toast.error('Failed to delete payroll records');
          return;
        }
      }

      // Now delete the payroll period
      const { error: deleteError } = await supabase
        .from('payroll_periods')
        .delete()
        .eq('id', periodToDelete.id);

      if (deleteError) {
        console.error('Error deleting period:', deleteError);
        toast.error('Failed to delete payroll period');
        return;
      }

      toast.success('Payroll period deleted successfully');
      setShowDeleteDialog(false);
      setPeriodToDelete(null);
      fetchPeriods(); // Refresh the list
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to delete payroll period');
    } finally {
      setDeletingId(null);
    }
  };

  // Create new period
  const handleCreatePeriod = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error('Please select month and year');
      return;
    }

    setCreating(true);
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const periodName = `${monthNames[month - 1]} ${year}`;
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    try {
      // Check for duplicate period
      const { data: existing } = await supabase
        .from('payroll_periods')
        .select('id')
        .eq('period_month', month)
        .eq('period_year', year)
        .single();

      if (existing) {
        toast.error('Period already exists for this month and year');
        setCreating(false);
        return;
      }

      // Create the period
      const { error } = await supabase
        .from('payroll_periods')
        .insert({
          period_name: periodName,
          period_month: month,
          period_year: year,
          period_start_date: format(startDate, 'yyyy-MM-dd'),
          period_end_date: format(endDate, 'yyyy-MM-dd'),
          working_days: workingDays || 22, // Default to 22 if calculation fails
          status: 'draft'
        });

      if (error) {
        console.error('Error creating period:', error);
        toast.error('Failed to create payroll period');
      } else {
        toast.success('Payroll period created successfully');
        setShowCreateDialog(false);
        setSelectedMonth("");
        setSelectedYear("");
        setWorkingDays(null);
        setHolidays([]);
        fetchPeriods();
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to create period');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      calculateWorkingDays();
    }
  }, [selectedMonth, selectedYear]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage monthly payroll periods and employee salaries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPeriods}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Period
          </Button>
        </div>
      </div>

      {/* Payroll Periods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Periods</CardTitle>
          <p className="text-sm text-muted-foreground">
            Monthly payroll cycles for employee salary processing
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
              <p className="text-muted-foreground">Loading payroll periods...</p>
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payroll periods yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first payroll period to start managing employee salaries
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Period
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period Name</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-center">Working Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => (
                  <TableRow key={period.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{period.period_name}</TableCell>
                    <TableCell>{period.period_month}</TableCell>
                    <TableCell>{period.period_year}</TableCell>
                    <TableCell>{period.period_start_date}</TableCell>
                    <TableCell>{period.period_end_date}</TableCell>
                    <TableCell className="text-center">{period.working_days}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          period.status === 'approved' ? 'default' :
                          period.status === 'in_review' ? 'secondary' :
                          period.status === 'paid' ? 'default' :
                          period.status === 'locked' ? 'default' :
                          'outline'
                        }
                        className={
                          period.status === 'approved' ? 'bg-green-500 hover:bg-green-600' :
                          period.status === 'paid' ? 'bg-blue-500 hover:bg-blue-600' :
                          period.status === 'locked' ? 'bg-gray-500 hover:bg-gray-600' :
                          ''
                        }
                      >
                        {period.status === 'draft' && '📝 Draft'}
                        {period.status === 'in_review' && '⚙️ In Review'}
                        {period.status === 'approved' && '✅ Approved'}
                        {period.status === 'paid' && '💰 Paid'}
                        {period.status === 'locked' && '🔒 Locked'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        {period.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleGenerateRecords(period)}
                            disabled={generatingFor === period.id}
                          >
                            {generatingFor === period.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Users className="h-3 w-3 mr-1" />
                                Generate
                              </>
                            )}
                          </Button>
                        )}
                        {(period.status === 'in_review' || period.status === 'approved') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/payroll/${period.id}/records`)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View Records
                          </Button>
                        )}
                        {period.status === 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info('Payslips coming soon')}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Payslips
                          </Button>
                        )}
                        {(period.status === 'draft' || period.status === 'in_review') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setPeriodToDelete(period);
                              setShowDeleteDialog(true);
                            }}
                            disabled={deletingId === period.id}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Period Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Payroll Period</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedMonth && selectedYear && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Period:</span>
                  <span className="font-medium">
                    {new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Working Days:</span>
                  <span className="font-medium">
                    {workingDays !== null ? workingDays : 'Calculating...'}
                  </span>
                </div>
                {holidays.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Holidays:</span>
                    <span className="font-medium text-orange-600">
                      {holidays.length} day{holidays.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium">
                    {format(startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1)), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End Date:</span>
                  <span className="font-medium">
                    {format(endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1)), 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            )}

            {workingDays === null && selectedMonth && selectedYear && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-orange-900 dark:text-orange-100 font-medium">Working days calculation pending</p>
                  <p className="text-orange-700 dark:text-orange-300">Using default value of 22 days if calculation fails</p>
                </div>
              </div>
            )}

            {holidays.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Holidays in this period:
                </p>
                <div className="space-y-1">
                  {holidays.map((holiday: any) => (
                    <div key={holiday.id} className="flex justify-between text-xs">
                      <span className="text-blue-700 dark:text-blue-300">
                        {format(new Date(holiday.holiday_date), 'dd MMM')} - {holiday.holiday_name}
                      </span>
                      <Badge variant="outline" className="text-xs h-5">
                        {holiday.holiday_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setSelectedMonth("");
                setSelectedYear("");
                setWorkingDays(null);
                setHolidays([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePeriod}
              disabled={!selectedMonth || !selectedYear || creating}
            >
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Period'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Payroll Period</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-sm text-red-900 dark:text-red-100">
                Are you sure you want to delete this payroll period?
              </p>
              {periodToDelete && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {periodToDelete.period_name}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Period: {periodToDelete.period_start_date} to {periodToDelete.period_end_date}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Status: {periodToDelete.status}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-orange-900 dark:text-orange-100 font-medium">Warning</p>
                <p className="text-orange-700 dark:text-orange-300">
                  This action will also delete all payroll records associated with this period.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPeriodToDelete(null);
              }}
              disabled={deletingId === periodToDelete?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePeriod}
              disabled={deletingId === periodToDelete?.id}
            >
              {deletingId === periodToDelete?.id ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Period
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
