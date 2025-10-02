import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Calendar, Plus, FolderOpen, Lock, CheckCircle, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, getDaysInMonth } from "date-fns";
import { toast } from "sonner";

interface PayrollPeriod {
  id: string;
  period_name: string;
  period_month: number;
  period_year: number;
  period_start_date: string;
  period_end_date: string;
  working_days: number;
  status: 'draft' | 'in_review' | 'approved' | 'paid' | 'locked';
  created_at: string;
  created_by: string | null;
  notes: string | null;
  total_records?: number; // Computed
  total_amount?: number; // Computed
}

export default function PayrollNew() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state for new period
  const [newPeriod, setNewPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    workingDays: 26,
    notes: ''
  });

  // Fetch all payroll periods
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

      // Fetch counts for each period
      const periodsWithCounts = await Promise.all(
        (data || []).map(async (period) => {
          const { count } = await supabase
            .from('payroll_records')
            .select('*', { count: 'exact', head: true })
            .eq('payroll_period_id', period.id);

          const { data: records } = await supabase
            .from('payroll_records')
            .select('net_pay')
            .eq('payroll_period_id', period.id);

          const totalAmount = records?.reduce((sum, r) => sum + (r.net_pay || 0), 0) || 0;

          return {
            ...period,
            total_records: count || 0,
            total_amount: totalAmount
          };
        })
      );

      setPeriods(periodsWithCounts);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  // Create new payroll period
  const handleCreatePeriod = async () => {
    try {
      const { month, year, workingDays, notes } = newPeriod;

      // Validate
      if (month < 1 || month > 12) {
        toast.error('Invalid month');
        return;
      }

      if (year < 2024) {
        toast.error('Invalid year');
        return;
      }

      // Check if period already exists
      const exists = periods.some(p => p.period_month === month && p.period_year === year);
      if (exists) {
        toast.error(`Payroll period for ${getMonthName(month)} ${year} already exists`);
        return;
      }

      // Calculate period dates
      const periodStart = startOfMonth(new Date(year, month - 1, 1));
      const periodEnd = endOfMonth(new Date(year, month - 1, 1));
      const periodName = `${getMonthName(month)} ${year}`;

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_user_id', userData.user?.id)
        .single();

      // Insert new period
      const { data, error } = await supabase
        .from('payroll_periods')
        .insert([{
          period_name: periodName,
          period_month: month,
          period_year: year,
          period_start_date: format(periodStart, 'yyyy-MM-dd'),
          period_end_date: format(periodEnd, 'yyyy-MM-dd'),
          working_days: workingDays,
          status: 'draft',
          created_by: appUser?.id,
          notes: notes || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating period:', error);
        toast.error('Failed to create payroll period');
        return;
      }

      toast.success(`Created payroll period for ${periodName}`);
      setShowCreateDialog(false);
      setNewPeriod({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        workingDays: 26,
        notes: ''
      });
      fetchPeriods();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to create payroll period');
    }
  };

  const getMonthName = (month: number) => {
    const date = new Date(2024, month - 1, 1);
    return format(date, 'MMMM');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'in_review': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'locked': return 'bg-slate-100 text-slate-800 border-slate-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'in_review': return <Eye className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'locked': return <Lock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Periods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periods.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {periods.filter(p => p.status === 'draft').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {periods.filter(p => p.status === 'in_review').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {periods.filter(p => p.status === 'paid').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Periods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Periods</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on a period to view/manage payroll records for that month
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-center">Working Days</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Employees</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow
                      key={period.id}
                      className="hover:bg-muted/50 cursor-pointer"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {period.period_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(period.period_start_date), 'dd MMM')} - {format(new Date(period.period_end_date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-center">{period.working_days}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getStatusColor(period.status)} border`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(period.status)}
                            {period.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {period.total_records || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(period.total_amount || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // TODO: Navigate to period detail view
                            toast.info('Period detail view coming in Phase 3-4');
                          }}
                        >
                          <FolderOpen className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Period Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payroll Period</DialogTitle>
            <DialogDescription>
              Set up a new monthly payroll period
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={newPeriod.month}
                  onChange={(e) => setNewPeriod({ ...newPeriod, month: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  {getMonthName(newPeriod.month)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  min="2024"
                  value={newPeriod.year}
                  onChange={(e) => setNewPeriod({ ...newPeriod, year: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Working Days</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={newPeriod.workingDays}
                onChange={(e) => setNewPeriod({ ...newPeriod, workingDays: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Total working days in this month (excluding holidays)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                value={newPeriod.notes}
                onChange={(e) => setNewPeriod({ ...newPeriod, notes: e.target.value })}
                placeholder="e.g., Includes Diwali bonus"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Period Preview:</p>
              <p className="text-sm text-muted-foreground">
                {getMonthName(newPeriod.month)} {newPeriod.year}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(startOfMonth(new Date(newPeriod.year, newPeriod.month - 1)), 'dd MMM yyyy')} - {format(endOfMonth(new Date(newPeriod.year, newPeriod.month - 1)), 'dd MMM yyyy')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePeriod}>
              Create Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
