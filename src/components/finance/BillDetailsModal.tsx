import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Calculator, FileText, User, Building, MapPin, CreditCard, Clock, Edit, Save, X } from 'lucide-react';
import { Bill } from '@/hooks/useInvoices';
import { format } from 'date-fns';

interface BillDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
  onStatusUpdate?: (billId: string, newStatus: string) => Promise<void>;
  onEdit?: (bill: Bill) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-500';
    case 'pending': return 'bg-yellow-500';
    case 'approved': return 'bg-blue-500';
    case 'part_paid': return 'bg-orange-500';
    case 'paid': return 'bg-green-500';
    case 'void': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'stock': return 'bg-purple-500';
    case 'expense': return 'bg-red-500';
    case 'service': return 'bg-blue-500';
    case 'capex': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

export default function BillDetailsModal({ open, onOpenChange, bill, onStatusUpdate, onEdit }: BillDetailsModalProps) {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!bill) return null;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formatDate = (dateString: string) => format(new Date(dateString), 'dd MMM yyyy');

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'part_paid', label: 'Partially Paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'void', label: 'Void' }
  ];

  const handleStatusEdit = () => {
    setSelectedStatus(bill.status);
    setIsEditingStatus(true);
  };

  const handleStatusCancel = () => {
    setIsEditingStatus(false);
    setSelectedStatus('');
  };

  const handleStatusSave = async () => {
    if (!onStatusUpdate || selectedStatus === bill.status) {
      setIsEditingStatus(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onStatusUpdate(bill.id, selectedStatus);
      setIsEditingStatus(false);
    } catch (error) {
      console.error('Error updating status:', error);
      // Keep editing mode open on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bill Details - #{bill.bill_number}
            </DialogTitle>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(bill)}
                className="rounded-none"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Bill
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bill Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bill Number</label>
                  <p className="text-lg font-semibold">{bill.bill_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {isEditingStatus ? (
                      <div className="flex items-center gap-2">
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={handleStatusSave}
                          disabled={isUpdating}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleStatusCancel}
                          disabled={isUpdating}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(bill.status)} text-white`}>
                          {bill.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {onStatusUpdate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleStatusEdit}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="mt-1">
                    <Badge className={`${getTypeColor(bill.type)} text-white`}>
                      {bill.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bill Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <p>{formatDate(bill.bill_date)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p>{formatDate(bill.due_date)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Currency</label>
                  <p className="mt-1">{bill.currency} (Rate: {bill.exchange_rate})</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendor Name</label>
                  <p className="text-lg font-medium">{bill.vendor_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendor ID</label>
                  <p className="font-mono text-sm">{bill.vendor_id || 'Not linked'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">GSTIN</label>
                  <p>{bill.vendor_gstin || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact</label>
                  <p>{bill.vendor_contact || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Place of Supply</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p>{bill.place_of_supply || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Basic Amounts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subtotal</label>
                    <p className="text-lg font-semibold">{formatCurrency(bill.subtotal)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Discount</label>
                    <p className="text-lg font-semibold text-red-600">-{formatCurrency(bill.discount_amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Freight</label>
                    <p className="text-lg font-semibold">{formatCurrency(bill.freight_amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Other Charges</label>
                    <p className="text-lg font-semibold">{formatCurrency(bill.other_charges)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Taxable Value</label>
                    <p className="text-lg font-semibold">{formatCurrency(bill.taxable_value)}</p>
                  </div>
                </div>

                <Separator />

                {/* Tax Details */}
                <div>
                  <h4 className="font-medium mb-3">Tax Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CGST</label>
                      <p className="text-lg font-semibold">{formatCurrency(bill.cgst)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">SGST</label>
                      <p className="text-lg font-semibold">{formatCurrency(bill.sgst)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">IGST</label>
                      <p className="text-lg font-semibold">{formatCurrency(bill.igst)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">TCS</label>
                      <p className="text-lg font-semibold">{formatCurrency(bill.tcs)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">TDS</label>
                      <p className="text-lg font-semibold text-red-600">-{formatCurrency(bill.tds)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Round Off</label>
                      <p className="text-lg font-semibold">{formatCurrency(bill.round_off)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* GST Information */}
                <div>
                  <h4 className="font-medium mb-3">GST Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">GST Scheme</label>
                      <p>{bill.gst_scheme || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ITC Eligible</label>
                      <Badge variant={bill.itc_eligible ? "default" : "secondary"}>
                        {bill.itc_eligible ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Summary */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Grand Total</label>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(bill.grand_total)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                      <p className="text-xl font-semibold text-blue-600">{formatCurrency(bill.amount_paid)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount Due</label>
                      <p className="text-xl font-semibold text-orange-600">{formatCurrency(bill.amount_due)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {(bill.reason || bill.notes_internal) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bill.reason && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reason/Description</label>
                      <p className="mt-1 p-3 bg-muted rounded-md">{bill.reason}</p>
                    </div>
                  )}
                  {bill.notes_internal && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Internal Notes</label>
                      <p className="mt-1 p-3 bg-muted rounded-md">{bill.notes_internal}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Information */}
          {(bill.file_url || bill.file_name) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attached Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bill.file_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">File Name</label>
                      <p>{bill.file_name}</p>
                    </div>
                  )}
                  {bill.file_type && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">File Type</label>
                      <p>{bill.file_type}</p>
                    </div>
                  )}
                  {bill.file_size && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">File Size</label>
                      <p>{(bill.file_size / 1024).toFixed(2)} KB</p>
                    </div>
                  )}
                  {bill.file_url && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">File</label>
                      <a
                        href={bill.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View File
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Audit Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Record ID</label>
                  <p className="font-mono text-xs">{bill.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
                  <p className="font-mono text-xs">{bill.organization_id || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p>{formatDate(bill.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p>{bill.created_by}</p>
                </div>
                {bill.updated_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p>{formatDate(bill.updated_at)}</p>
                  </div>
                )}
                {bill.approved_by && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Approved By</label>
                    <p>{bill.approved_by}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Record Status</label>
                  <Badge variant={bill.is_deleted ? "destructive" : "default"}>
                    {bill.is_deleted ? 'Deleted' : 'Active'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}