import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BillsTable } from "@/components/bills/BillsTable";
import { Plus, FileText, Filter, Search } from "lucide-react";
import { toast } from "sonner";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useBills, BillItem } from "@/hooks/useBills";

interface NewVendor {
  name: string;
  gstin?: string;
  default_terms?: number;
}

const Bills = () => {
  const { suppliers, actions: supplierActions } = useSuppliers();
  const { bills, loading: billsLoading, actions: billActions } = useBills();
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'stock' as 'stock' | 'expense',
    bill_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tracking_id: '',
    vendor_id: '',
    po_id: '',
    grn_id: '',
    reason: '',
    status: 'pending' as 'pending' | 'paid',
  });

  const [billItems, setBillItems] = useState<Omit<BillItem, 'id' | 'bill_id'>[]>([
    { description: '', qty: 1, rate: 0, amount: 0 }
  ]);

  const [newVendor, setNewVendor] = useState<NewVendor>({
    name: '',
    gstin: '',
    default_terms: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate subtotal
  const subtotal = billItems.reduce((sum, item) => sum + item.amount, 0);

  // Filter bills
  useEffect(() => {
    let filtered = bills;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(bill => bill.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(bill => 
        bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.tracking_id && bill.tracking_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredBills(filtered);
  }, [bills, typeFilter, statusFilter, searchTerm]);

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    const newItems = [...billItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate amount for this item
    if (field === 'qty' || field === 'rate') {
      newItems[index].amount = newItems[index].qty * newItems[index].rate;
    }
    
    setBillItems(newItems);
  };

  const addBillItem = () => {
    setBillItems([...billItems, { description: '', qty: 1, rate: 0, amount: 0 }]);
  };

  const removeBillItem = (index: number) => {
    if (billItems.length > 1) {
      setBillItems(billItems.filter((_, i) => i !== index));
    }
  };

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.vendor_id) newErrors.vendor_id = 'Vendor is required';
    if (!formData.bill_number) newErrors.bill_number = 'Invoice number is required';
    if (!formData.bill_date) newErrors.bill_date = 'Date is required';

    // Type-specific validation
    if (formData.type === 'expense' && !formData.reason) {
      newErrors.reason = 'Reason is required for expense bills';
    }

    // Date validation
    if (formData.due_date && formData.due_date < formData.bill_date) {
      newErrors.due_date = 'Due date cannot be before bill date';
    }

    // Check unique bill number per vendor
    if (formData.vendor_id && formData.bill_number) {
      const isUnique = await billActions.checkBillNumberUnique(
        formData.vendor_id, 
        formData.bill_number, 
        selectedBill?.id
      );
      if (!isUnique) {
        newErrors.bill_number = 'Invoice number already exists for this vendor';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateVendor = async () => {
    if (!newVendor.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    try {
      const vendorData = {
        name: newVendor.name.trim(),
        gstin: newVendor.gstin?.trim() || undefined,
        default_terms: newVendor.default_terms || undefined,
        status: 'active' as const,
        code: newVendor.name.trim().substring(0, 3).toUpperCase(),
      };

      await supplierActions.addSupplier(vendorData);
      
      // Auto-select the new vendor (assuming it's the last one added)
      const newVendorId = suppliers[suppliers.length - 1]?.id;
      if (newVendorId) {
        setFormData(prev => ({ ...prev, vendor_id: newVendorId }));
      }

      setNewVendor({ name: '', gstin: '', default_terms: undefined });
      setShowVendorDialog(false);
      toast.success('Vendor created and selected');
    } catch (error) {
      toast.error('Failed to create vendor');
      console.error('Vendor creation error:', error);
    }
  };

  const handleSaveBill = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    try {
      const selectedVendor = suppliers.find(s => s.id === formData.vendor_id);
      let dueDate = formData.due_date;
      
      // Auto-set due date if empty
      if (!dueDate && selectedVendor?.default_terms) {
        const billDate = new Date(formData.bill_date);
        billDate.setDate(billDate.getDate() + selectedVendor.default_terms);
        dueDate = billDate.toISOString().split('T')[0];
      }

      const billData = {
        type: formData.type,
        bill_number: formData.bill_number,
        bill_date: formData.bill_date,
        due_date: dueDate,
        tracking_id: formData.tracking_id || undefined,
        vendor_id: formData.vendor_id,
        po_id: formData.po_id || undefined,
        grn_id: formData.grn_id || undefined,
        reason: formData.reason || undefined,
        status: formData.status,
        items: billItems,
      };

      if (selectedBill) {
        // For updates, you'd need an updateBill function
        toast.error('Bill editing not yet implemented');
        return;
      } else {
        await billActions.createBill(billData);
        toast.success('Bill created successfully');
      }

      resetForm();
      setShowCreateDialog(false);
    } catch (error) {
      toast.error('Failed to save bill');
      console.error('Save bill error:', error);
    }
  };

  const markAsPaid = async (bill: any) => {
    try {
      await billActions.updateBillStatus(bill.id, 'paid');
      toast.success('Bill marked as paid');
    } catch (error) {
      toast.error('Failed to update bill status');
      console.error('Mark as paid error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'stock',
      bill_number: '',
      bill_date: new Date().toISOString().split('T')[0],
      due_date: '',
      tracking_id: '',
      vendor_id: '',
      po_id: '',
      grn_id: '',
      reason: '',
      status: 'pending',
    });
    setBillItems([{ description: '', qty: 1, rate: 0, amount: 0 }]);
    setSelectedBill(null);
    setErrors({});
  };


  // KPI calculations
  const totalOutstanding = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.subtotal, 0);
  const overdueBills = bills.filter(b => b.status === 'pending' && b.due_date && new Date(b.due_date) < new Date()).length;
  const dueThisWeek = bills.filter(b => {
    if (b.status !== 'pending' || !b.due_date) return false;
    const dueDate = new Date(b.due_date);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return dueDate <= weekFromNow;
  }).length;
  const paidThisMonth = bills.filter(b => {
    if (b.status !== 'paid') return false;
    const billDate = new Date(b.bill_date);
    const now = new Date();
    return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
  }).reduce((sum, b) => sum + b.subtotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
          <p className="text-muted-foreground">Manage bills and payables</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Bill
        </Button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Bills pending payment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueBills}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueThisWeek}</div>
            <p className="text-xs text-muted-foreground">Bills due within 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{paidThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <BillsTable
        bills={filteredBills}
        onEdit={(bill) => {
          // TODO: Implement edit functionality
          console.log('Edit bill:', bill);
        }}
        onMarkAsPaid={markAsPaid}
        loading={billsLoading}
      />

      {/* Create/Edit Bill Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBill ? 'Edit Bill' : 'Create New Bill'}</DialogTitle>
            <DialogDescription>
              {selectedBill ? 'Update the bill information' : 'Enter the details for the new bill'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleFormChange('type', value)}>
                <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
            </div>

            {/* Header Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.bill_date}
                  onChange={(e) => handleFormChange('bill_date', e.target.value)}
                  className={errors.bill_date ? 'border-destructive' : ''}
                />
                {errors.bill_date && <p className="text-sm text-destructive">{errors.bill_date}</p>}
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleFormChange('due_date', e.target.value)}
                  className={errors.due_date ? 'border-destructive' : ''}
                />
                {errors.due_date && <p className="text-sm text-destructive">{errors.due_date}</p>}
              </div>

              <div className="space-y-2">
                <Label>Invoice No. *</Label>
                <Input
                  value={formData.bill_number}
                  onChange={(e) => handleFormChange('bill_number', e.target.value)}
                  placeholder="Enter invoice number"
                  className={errors.bill_number ? 'border-destructive' : ''}
                />
                {errors.bill_number && <p className="text-sm text-destructive">{errors.bill_number}</p>}
              </div>

              <div className="space-y-2">
                <Label>Tracking ID</Label>
                <Input
                  value={formData.tracking_id}
                  onChange={(e) => handleFormChange('tracking_id', e.target.value)}
                  placeholder="Optional tracking ID"
                />
              </div>
            </div>

            {/* Vendor Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Vendor *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVendorDialog(true)}
                >
                  Create Vendor
                </Button>
              </div>
              <Select value={formData.vendor_id} onValueChange={(value) => handleFormChange('vendor_id', value)}>
                <SelectTrigger className={errors.vendor_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter(s => s.status === 'active').map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendor_id && <p className="text-sm text-destructive">{errors.vendor_id}</p>}
            </div>

            {/* Conditional Fields */}
            {formData.type === 'stock' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PO ID</Label>
                  <Input
                    value={formData.po_id}
                    onChange={(e) => handleFormChange('po_id', e.target.value)}
                    placeholder="Purchase Order ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GRN ID</Label>
                  <Input
                    value={formData.grn_id}
                    onChange={(e) => handleFormChange('grn_id', e.target.value)}
                    placeholder="Goods Receipt Note ID"
                  />
                </div>
              </div>
            )}

            {formData.type === 'expense' && (
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => handleFormChange('reason', e.target.value)}
                  placeholder="Reason for expense"
                  className={errors.reason ? 'border-destructive' : ''}
                />
                {errors.reason && <p className="text-sm text-destructive">{errors.reason}</p>}
              </div>
            )}

            {/* Bill Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBillItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              
              {billItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    {billItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBillItem(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    Subtotal: ₹{subtotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBill}>
              {selectedBill ? 'Update Bill' : 'Create Bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Vendor Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Vendor</DialogTitle>
            <DialogDescription>
              Add a new vendor to your supplier list
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor Name *</Label>
              <Input
                value={newVendor.name}
                onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter vendor name"
              />
            </div>

            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input
                value={newVendor.gstin}
                onChange={(e) => setNewVendor(prev => ({ ...prev, gstin: e.target.value }))}
                placeholder="Optional GSTIN"
              />
            </div>

            <div className="space-y-2">
              <Label>Default Payment Terms (days)</Label>
              <Input
                type="number"
                value={newVendor.default_terms || ''}
                onChange={(e) => setNewVendor(prev => ({ ...prev, default_terms: Number(e.target.value) || undefined }))}
                placeholder="e.g., 30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVendorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVendor}>
              Create Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bills;