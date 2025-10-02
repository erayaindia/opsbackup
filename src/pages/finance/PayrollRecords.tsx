import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Save, Calculator, FileText, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface PayrollRecord {
  id: string;
  payroll_period_id: string;
  app_user_id: string;
  employee_id: string;
  employee_name: string;
  employee_role: string;
  employee_type: string;

  // Attendance
  days_present: number;
  days_paid_leave: number;
  days_unpaid_leave: number;
  days_late: number;
  overtime_hours: number;

  // Salary
  base_salary_rate: number;
  calculated_base_pay: number;

  // Earnings
  overtime_pay: number;
  attendance_bonus: number;
  incentives: number;
  reimbursements: number;
  other_earnings: number;
  total_earnings: number;

  // Deductions
  late_penalty: number;
  unpaid_leave_deduction: number;
  advance_recovery: number;
  damage_penalty: number;
  pf_deduction: number;
  esi_deduction: number;
  tds_deduction: number;
  other_deductions: number;
  total_deductions: number;

  // Final amounts
  gross_pay: number;
  net_pay: number;

  // Status
  status: string;
  payment_method: string | null;
  payment_date: string | null;
  payment_reference: string | null;
  notes: string | null;
}

interface PayrollPeriod {
  id: string;
  period_name: string;
  period_month: number;
  period_year: number;
  working_days: number;
  status: string;
}

export default function PayrollRecords() {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [editedRecords, setEditedRecords] = useState<Map<string, Partial<PayrollRecord>>>(new Map());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  // Fetch period details and records
  const fetchData = async () => {
    if (!periodId) return;

    try {
      setLoading(true);

      // Fetch period details
      const { data: periodData, error: periodError } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', periodId)
        .single();

      if (periodError) {
        console.error('Error fetching period:', periodError);
        toast.error('Failed to fetch period details');
        return;
      }

      setPeriod(periodData);

      // Fetch payroll records
      const { data: recordsData, error: recordsError } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('payroll_period_id', periodId)
        .order('employee_name');

      if (recordsError) {
        console.error('Error fetching records:', recordsError);
        toast.error('Failed to fetch payroll records');
        return;
      }

      setRecords(recordsData || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle field edits
  const handleFieldEdit = (recordId: string, field: string, value: any) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

    setEditedRecords(prev => {
      const updated = new Map(prev);
      const existing = updated.get(recordId) || {};
      updated.set(recordId, { ...existing, [field]: numericValue });
      return updated;
    });

    // Update local state for immediate feedback
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        const updated = { ...r, [field]: numericValue };

        // Recalculate totals
        if (field.includes('earning') || field.includes('bonus') || field.includes('incentive') || field.includes('reimbursement') || field === 'overtime_pay') {
          updated.total_earnings = updated.calculated_base_pay + updated.overtime_pay + updated.attendance_bonus +
                                   updated.incentives + updated.reimbursements + updated.other_earnings;
          updated.gross_pay = updated.total_earnings;
        }

        if (field.includes('deduction') || field.includes('penalty') || field.includes('pf') || field.includes('esi') || field.includes('tds')) {
          updated.total_deductions = updated.late_penalty + updated.unpaid_leave_deduction + updated.advance_recovery +
                                     updated.damage_penalty + updated.pf_deduction + updated.esi_deduction +
                                     updated.tds_deduction + updated.other_deductions;
        }

        updated.net_pay = updated.gross_pay - updated.total_deductions;

        return updated;
      }
      return r;
    }));
  };

  // Save all changes
  const handleSaveAll = async () => {
    if (editedRecords.size === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);

    try {
      const updates = Array.from(editedRecords.entries()).map(([id, changes]) => {
        const record = records.find(r => r.id === id);
        if (!record) return null;

        // Recalculate totals
        const total_earnings = record.calculated_base_pay +
          (changes.overtime_pay ?? record.overtime_pay) +
          (changes.attendance_bonus ?? record.attendance_bonus) +
          (changes.incentives ?? record.incentives) +
          (changes.reimbursements ?? record.reimbursements) +
          (changes.other_earnings ?? record.other_earnings);

        const total_deductions =
          (changes.late_penalty ?? record.late_penalty) +
          (changes.unpaid_leave_deduction ?? record.unpaid_leave_deduction) +
          (changes.advance_recovery ?? record.advance_recovery) +
          (changes.damage_penalty ?? record.damage_penalty) +
          (changes.pf_deduction ?? record.pf_deduction) +
          (changes.esi_deduction ?? record.esi_deduction) +
          (changes.tds_deduction ?? record.tds_deduction) +
          (changes.other_deductions ?? record.other_deductions);

        return {
          id,
          ...changes,
          total_earnings,
          total_deductions,
          gross_pay: total_earnings,
          net_pay: total_earnings - total_deductions
        };
      }).filter(Boolean);

      // Update all records
      for (const update of updates) {
        if (!update) continue;

        const { error } = await supabase
          .from('payroll_records')
          .update(update)
          .eq('id', update.id);

        if (error) {
          console.error('Error updating record:', error);
          toast.error('Failed to update some records');
          return;
        }
      }

      toast.success('All changes saved successfully');
      setEditedRecords(new Map());
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Approve all records
  const handleApproveAll = async () => {
    if (!period || period.status !== 'in_review') {
      toast.error('Period must be in review to approve');
      return;
    }

    try {
      // Update period status
      const { error: periodError } = await supabase
        .from('payroll_periods')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', periodId);

      if (periodError) {
        console.error('Error approving period:', periodError);
        toast.error('Failed to approve period');
        return;
      }

      // Update all records to approved
      const { error: recordsError } = await supabase
        .from('payroll_records')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('payroll_period_id', periodId);

      if (recordsError) {
        console.error('Error approving records:', recordsError);
        toast.error('Failed to approve records');
        return;
      }

      toast.success('Payroll approved successfully');
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to approve payroll');
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!period) {
    return (
      <div className="p-6">
        <p>Period not found</p>
      </div>
    );
  }

  const totalNetPay = records.reduce((sum, r) => sum + r.net_pay, 0);
  const totalGrossPay = records.reduce((sum, r) => sum + r.gross_pay, 0);
  const totalDeductions = records.reduce((sum, r) => sum + r.total_deductions, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/payroll')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Payroll Records</h1>
            <p className="text-muted-foreground">
              {period.period_name} - {records.length} employees
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={period.status === 'approved' ? 'default' : 'secondary'}
            className={period.status === 'approved' ? 'bg-green-500' : ''}
          >
            {period.status}
          </Badge>

          {editedRecords.size > 0 && (
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes ({editedRecords.size})
                </>
              )}
            </Button>
          )}

          {period.status === 'in_review' && (
            <Button onClick={handleApproveAll} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Approve All
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Gross Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalGrossPay.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">₹{totalDeductions.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Net Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₹{totalNetPay.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Days Present</TableHead>
                  <TableHead className="text-center">OT Hours</TableHead>
                  <TableHead className="text-right">Base Pay</TableHead>
                  <TableHead className="text-right">OT Pay</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className={editedRecords.has(record.id) ? 'bg-yellow-50 dark:bg-yellow-950' : ''}>
                    <TableCell className="sticky left-0 bg-background">
                      <div>
                        <p className="font-medium">{record.employee_name}</p>
                        <p className="text-sm text-muted-foreground">{record.employee_role}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.employee_type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{record.days_present}</TableCell>
                    <TableCell className="text-center">{record.overtime_hours}</TableCell>
                    <TableCell className="text-right">₹{record.calculated_base_pay.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={record.overtime_pay}
                        onChange={(e) => handleFieldEdit(record.id, 'overtime_pay', e.target.value)}
                        className="w-20 text-right"
                        disabled={period.status === 'approved'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={record.attendance_bonus + record.incentives + record.reimbursements + record.other_earnings}
                        onChange={(e) => handleFieldEdit(record.id, 'other_earnings', e.target.value)}
                        className="w-20 text-right"
                        disabled={period.status === 'approved'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={record.total_deductions}
                        onChange={(e) => handleFieldEdit(record.id, 'total_deductions', e.target.value)}
                        className="w-20 text-right"
                        disabled={period.status === 'approved'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-bold">₹{record.net_pay.toFixed(2)}</p>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowEditDialog(true);
                        }}
                        disabled={period.status === 'approved'}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedRecord && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Payroll Record: {selectedRecord.employee_name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Earnings Section */}
              <div>
                <h3 className="font-semibold mb-3">Earnings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Overtime Pay</Label>
                    <Input
                      type="number"
                      value={selectedRecord.overtime_pay}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'overtime_pay', e.target.value);
                        setSelectedRecord({...selectedRecord, overtime_pay: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                  <div>
                    <Label>Attendance Bonus</Label>
                    <Input
                      type="number"
                      value={selectedRecord.attendance_bonus}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'attendance_bonus', e.target.value);
                        setSelectedRecord({...selectedRecord, attendance_bonus: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                  <div>
                    <Label>Incentives</Label>
                    <Input
                      type="number"
                      value={selectedRecord.incentives}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'incentives', e.target.value);
                        setSelectedRecord({...selectedRecord, incentives: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                  <div>
                    <Label>Reimbursements</Label>
                    <Input
                      type="number"
                      value={selectedRecord.reimbursements}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'reimbursements', e.target.value);
                        setSelectedRecord({...selectedRecord, reimbursements: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <h3 className="font-semibold mb-3">Deductions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Late Penalty</Label>
                    <Input
                      type="number"
                      value={selectedRecord.late_penalty}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'late_penalty', e.target.value);
                        setSelectedRecord({...selectedRecord, late_penalty: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                  <div>
                    <Label>Advance Recovery</Label>
                    <Input
                      type="number"
                      value={selectedRecord.advance_recovery}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'advance_recovery', e.target.value);
                        setSelectedRecord({...selectedRecord, advance_recovery: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                  <div>
                    <Label>PF Deduction</Label>
                    <Input
                      type="number"
                      value={selectedRecord.pf_deduction}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'pf_deduction', e.target.value);
                        setSelectedRecord({...selectedRecord, pf_deduction: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                  <div>
                    <Label>ESI Deduction</Label>
                    <Input
                      type="number"
                      value={selectedRecord.esi_deduction}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'esi_deduction', e.target.value);
                        setSelectedRecord({...selectedRecord, esi_deduction: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                  <div>
                    <Label>TDS Deduction</Label>
                    <Input
                      type="number"
                      value={selectedRecord.tds_deduction}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'tds_deduction', e.target.value);
                        setSelectedRecord({...selectedRecord, tds_deduction: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                  <div>
                    <Label>Other Deductions</Label>
                    <Input
                      type="number"
                      value={selectedRecord.other_deductions}
                      onChange={(e) => {
                        handleFieldEdit(selectedRecord.id, 'other_deductions', e.target.value);
                        setSelectedRecord({...selectedRecord, other_deductions: parseFloat(e.target.value) || 0});
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={selectedRecord.notes || ''}
                  onChange={(e) => {
                    handleFieldEdit(selectedRecord.id, 'notes', e.target.value);
                    setSelectedRecord({...selectedRecord, notes: e.target.value});
                  }}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}