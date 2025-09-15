import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Calculator, Upload, AlertCircle, FileText, X } from 'lucide-react';
import { useVendors } from '@/hooks/useSuppliers';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bill } from '@/hooks/useInvoices';
import { supabase } from '@/integrations/supabase/client';

interface AddBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (bill: Bill) => void;
  vendors: string[];
  onCreateBill: (billData: CreateBillData) => Promise<Bill>;
  onGenerateNextBillNumber: () => Promise<string>;
  initialData?: Bill;
  isEdit?: boolean;
}

interface CreateBillData {
  bill_number: string;
  vendor_id?: string;
  vendor_name: string;
  vendor_gstin?: string;
  vendor_contact?: string;
  type: 'stock' | 'expense' | 'service' | 'capex';
  bill_date: string;
  due_date: string;
  status: 'draft';
  grand_total: number;
  amount_paid: number;
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
}

interface BillFormData {
  bill_number: string;
  vendor_id: string;
  vendor_name: string;
  vendor_gstin: string;
  vendor_contact: string;
  type: 'stock' | 'expense' | 'service' | 'capex' | '';
  bill_date: Date | null;
  due_date: Date | null;
  uploaded_file: File | null;
  subtotal: string;
  discount_amount: string;
  freight_amount: string;
  other_charges: string;
  taxable_value: string;
  gst_type: 'cgst_sgst' | 'igst';
  cgst_rate: string;
  sgst_rate: string;
  igst_rate: string;
  cgst: string;
  sgst: string;
  igst: string;
  tcs: string;
  tds: string;
  round_off: string;
  grand_total: string;
  gst_scheme: string;
  place_of_supply: string;
  itc_eligible: boolean;
  currency: string;
  exchange_rate: string;
  reason: string;
  notes_internal: string;
}

const initialFormData: BillFormData = {
  bill_number: '',
  vendor_id: '',
  vendor_name: '',
  vendor_gstin: '',
  vendor_contact: '',
  type: '',
  bill_date: null,
  due_date: null,
  uploaded_file: null,
  subtotal: '',
  discount_amount: '0',
  freight_amount: '0',
  other_charges: '0',
  taxable_value: '',
  gst_type: 'cgst_sgst',
  cgst_rate: '9',
  sgst_rate: '9',
  igst_rate: '18',
  cgst: '0',
  sgst: '0',
  igst: '0',
  tcs: '0',
  tds: '0',
  round_off: '0',
  grand_total: '0',
  gst_scheme: '',
  place_of_supply: '',
  itc_eligible: false,
  currency: 'INR',
  exchange_rate: '1',
  reason: '',
  notes_internal: ''
};

const BILL_TYPES = [
  { value: 'stock', label: 'Stock' },
  { value: 'expense', label: 'Expense' },
  { value: 'service', label: 'Service' },
  { value: 'capex', label: 'Capital Expenditure' }
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

interface FormErrors {
  [key: string]: string;
}

export default function AddBillModal({ open, onOpenChange, onSuccess, vendors, onCreateBill, onGenerateNextBillNumber, initialData, isEdit = false }: AddBillModalProps) {
  const [formData, setFormData] = useState<BillFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Fetch vendors from database
  const { data: vendorsData = [], isLoading: vendorsLoading } = useVendors();

  // Initialize form data when modal opens
  useEffect(() => {
    if (open) {
      if (isEdit && initialData) {
        // Populate form with existing bill data for editing
        setFormData({
          bill_number: initialData.bill_number,
          vendor_id: initialData.vendor_id || '',
          vendor_name: initialData.vendor_name,
          vendor_gstin: initialData.vendor_gstin || '',
          vendor_contact: initialData.vendor_contact || '',
          type: initialData.type,
          bill_date: new Date(initialData.bill_date),
          due_date: new Date(initialData.due_date),
          subtotal: initialData.subtotal.toString(),
          discount_amount: initialData.discount_amount.toString(),
          freight_amount: initialData.freight_amount.toString(),
          other_charges: initialData.other_charges.toString(),
          taxable_value: initialData.taxable_value.toString(),
          gst_type: initialData.igst > 0 ? 'igst' : 'cgst_sgst',
          cgst_rate: initialData.taxable_value > 0 ? ((initialData.cgst / initialData.taxable_value) * 100).toFixed(2) : '9',
          sgst_rate: initialData.taxable_value > 0 ? ((initialData.sgst / initialData.taxable_value) * 100).toFixed(2) : '9',
          igst_rate: initialData.taxable_value > 0 ? ((initialData.igst / initialData.taxable_value) * 100).toFixed(2) : '18',
          cgst: initialData.cgst.toString(),
          sgst: initialData.sgst.toString(),
          igst: initialData.igst.toString(),
          tcs: initialData.tcs.toString(),
          tds: initialData.tds.toString(),
          round_off: initialData.round_off.toString(),
          grand_total: initialData.grand_total.toString(),
          gst_scheme: initialData.gst_scheme || '',
          place_of_supply: initialData.place_of_supply || '',
          itc_eligible: initialData.itc_eligible,
          currency: initialData.currency,
          exchange_rate: initialData.exchange_rate.toString(),
          reason: initialData.reason || '',
          notes_internal: initialData.notes_internal || ''
        });
      } else if (!isEdit && !formData.bill_number) {
        // Auto-generate sequential bill number for new bills
        const generateBillNumber = async () => {
          try {
            const billNumber = await onGenerateNextBillNumber();
            setFormData(prev => ({ ...prev, bill_number: billNumber }));
          } catch (error) {
            console.error('Error generating bill number:', error);
            // Fallback to timestamp-based number
            const fallbackNumber = Date.now().toString().slice(-6);
            setFormData(prev => ({ ...prev, bill_number: fallbackNumber }));
          }
        };
        generateBillNumber();
      }
    }
  }, [open, isEdit, initialData, formData.bill_number]);

  // Calculate taxable value when amounts change
  useEffect(() => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    const freight = parseFloat(formData.freight_amount) || 0;
    const otherCharges = parseFloat(formData.other_charges) || 0;

    const taxableValue = subtotal - discount + freight + otherCharges;
    setFormData(prev => ({ ...prev, taxable_value: taxableValue.toFixed(2) }));
  }, [formData.subtotal, formData.discount_amount, formData.freight_amount, formData.other_charges]);

  // Calculate GST amounts when rates or taxable value changes
  useEffect(() => {
    const taxableValue = parseFloat(formData.taxable_value) || 0;

    if (formData.gst_type === 'cgst_sgst') {
      const cgstRate = parseFloat(formData.cgst_rate) || 0;
      const sgstRate = parseFloat(formData.sgst_rate) || 0;
      const cgstAmount = (taxableValue * cgstRate) / 100;
      const sgstAmount = (taxableValue * sgstRate) / 100;

      setFormData(prev => ({
        ...prev,
        cgst: cgstAmount.toFixed(2),
        sgst: sgstAmount.toFixed(2),
        igst: '0'
      }));
    } else {
      const igstRate = parseFloat(formData.igst_rate) || 0;
      const igstAmount = (taxableValue * igstRate) / 100;

      setFormData(prev => ({
        ...prev,
        igst: igstAmount.toFixed(2),
        cgst: '0',
        sgst: '0'
      }));
    }
  }, [formData.taxable_value, formData.gst_type, formData.cgst_rate, formData.sgst_rate, formData.igst_rate]);

  // Calculate grand total when tax amounts change
  useEffect(() => {
    const taxableValue = parseFloat(formData.taxable_value) || 0;
    const cgst = parseFloat(formData.cgst) || 0;
    const sgst = parseFloat(formData.sgst) || 0;
    const igst = parseFloat(formData.igst) || 0;
    const tcs = parseFloat(formData.tcs) || 0;
    const tds = parseFloat(formData.tds) || 0;
    const roundOff = parseFloat(formData.round_off) || 0;

    const grandTotal = taxableValue + cgst + sgst + igst + tcs - tds + roundOff;
    setFormData(prev => ({ ...prev, grand_total: grandTotal.toFixed(2) }));
  }, [formData.taxable_value, formData.cgst, formData.sgst, formData.igst, formData.tcs, formData.tds, formData.round_off]);

  const handleInputChange = (field: keyof BillFormData, value: string | number | boolean | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle vendor selection - auto-populate vendor details
  const handleVendorChange = (vendorId: string) => {
    const selectedVendor = vendorsData.find(vendor => vendor.id === vendorId);
    if (selectedVendor) {
      setFormData(prev => ({
        ...prev,
        vendor_id: vendorId,
        vendor_name: selectedVendor.name,
        vendor_gstin: selectedVendor.gstin || '',
        vendor_contact: selectedVendor.email || selectedVendor.phone || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        vendor_id: '',
        vendor_name: '',
        vendor_gstin: '',
        vendor_contact: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.bill_number.trim()) newErrors.bill_number = 'Bill number is required';
    if (!formData.vendor_id.trim()) newErrors.vendor_id = 'Vendor selection is required';
    if (!formData.type) newErrors.type = 'Bill type is required';
    if (!formData.bill_date) newErrors.bill_date = 'Bill date is required';
    if (!formData.due_date) newErrors.due_date = 'Due date is required';
    if (!formData.uploaded_file) newErrors.uploaded_file = 'Bill document is required';
    if (!formData.subtotal.trim()) newErrors.subtotal = 'Subtotal is required';

    // Date validation
    if (formData.bill_date && formData.due_date && formData.due_date < formData.bill_date) {
      newErrors.due_date = 'Due date cannot be before bill date';
    }

    // Number validation
    if (formData.subtotal && (isNaN(parseFloat(formData.subtotal)) || parseFloat(formData.subtotal) <= 0)) {
      newErrors.subtotal = 'Subtotal must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFileToStorage = async (file: File, billId: string): Promise<{url: string, path: string}> => {
    try {
      // Generate unique filename with timestamp to avoid conflicts
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `invoices/${billId}/${fileName}`;

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('invoice-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoice-documents')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error in uploadFileToStorage:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let fileData = {};

      // If file is uploaded, upload it to storage first
      if (formData.uploaded_file) {
        setIsUploadingFile(true);
        try {
          // Generate a temporary ID for file path (we'll use bill number for now)
          const tempId = formData.bill_number.replace(/[^a-zA-Z0-9]/g, '_');
          const { url, path } = await uploadFileToStorage(formData.uploaded_file, tempId);

          fileData = {
            file_url: url,
            file_type: formData.uploaded_file.type,
            file_name: formData.uploaded_file.name,
            file_size: formData.uploaded_file.size
          };

          // Debug: Check file data lengths
          console.log('File data:', fileData);
          Object.entries(fileData).forEach(([key, value]) => {
            if (typeof value === 'string' && value.length > 10) {
              console.warn(`File field '${key}' has length ${value.length}: "${value}"`);
            }
          });

        } catch (fileError) {
          console.error('File upload failed:', fileError);
          setErrors({ uploaded_file: 'File upload failed. Please try again.' });
          return;
        } finally {
          setIsUploadingFile(false);
        }
      }

      // Create bill with all data including file metadata
      const billData = {
        bill_number: formData.bill_number,
        vendor_id: formData.vendor_id || undefined,
        vendor_name: formData.vendor_name,
        vendor_gstin: formData.vendor_gstin || undefined,
        vendor_contact: formData.vendor_contact || undefined,
        type: formData.type,
        bill_date: formData.bill_date!,
        due_date: formData.due_date!,
        status: 'draft' as const,
        grand_total: parseFloat(formData.grand_total),
        amount_paid: 0,
        subtotal: parseFloat(formData.subtotal),
        discount_amount: parseFloat(formData.discount_amount),
        freight_amount: parseFloat(formData.freight_amount),
        other_charges: parseFloat(formData.other_charges),
        taxable_value: parseFloat(formData.taxable_value),
        cgst: parseFloat(formData.cgst),
        sgst: parseFloat(formData.sgst),
        igst: parseFloat(formData.igst),
        tcs: parseFloat(formData.tcs),
        tds: parseFloat(formData.tds),
        round_off: parseFloat(formData.round_off),
        gst_scheme: formData.gst_scheme || undefined,
        place_of_supply: formData.place_of_supply || undefined,
        itc_eligible: formData.itc_eligible,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate),
        reason: formData.reason || undefined,
        notes_internal: formData.notes_internal || undefined,
        ...fileData
      };

      // Debug: Log the data being sent to identify long values
      console.log('Bill data being sent:', billData);
      Object.entries(billData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 10) {
          console.warn(`Field '${key}' has length ${value.length}: "${value}"`);
        }
      });

      const newBill = await onCreateBill(billData);

      // Show success message
      console.log('✅ Bill created successfully:', newBill);

      if (onSuccess) {
        onSuccess(newBill);
      }

      // Reset form and close modal
      setFormData(initialFormData);
      setErrors({});
      onOpenChange(false);

      // Could add toast notification here
      // toast.success('Bill created successfully!');

    } catch (error) {
      console.error('❌ Error creating bill:', error);

      // Set error message for user feedback
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create bill. Please try again.'
      });

      // Could add toast notification here
      // toast.error('Failed to create bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Bill' : 'Add New Bill'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the invoice bill details, amounts, and tax information.'
              : 'Create a new invoice bill with vendor details, amounts, and tax information.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bill_number">Bill Number *</Label>
                  <Input
                    id="bill_number"
                    value={formData.bill_number}
                    placeholder="Auto-generated"
                    className="bg-muted"
                    readOnly
                    disabled
                  />
                  {errors.bill_number && <p className="text-sm text-red-500 mt-1">{errors.bill_number}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-generated sequential number (1, 2, 3...)
                  </p>
                </div>

                <div>
                  <Label htmlFor="type">Bill Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select bill type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BILL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
                </div>

                <div>
                  <Label htmlFor="bill_date">Bill Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.bill_date && "text-muted-foreground",
                          errors.bill_date && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.bill_date ? format(formData.bill_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.bill_date || undefined}
                        onSelect={(date) => handleInputChange('bill_date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.bill_date && <p className="text-sm text-red-500 mt-1">{errors.bill_date}</p>}
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground",
                          errors.due_date && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.due_date || undefined}
                        onSelect={(date) => handleInputChange('due_date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.due_date && <p className="text-sm text-red-500 mt-1">{errors.due_date}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Vendor Information
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a vendor from your vendors database. Contact and GSTIN will be auto-populated.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="vendor_id">Select Vendor *</Label>
                  <Select
                    value={formData.vendor_id}
                    onValueChange={handleVendorChange}
                  >
                    <SelectTrigger className={errors.vendor_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder={vendorsLoading ? "Loading vendors..." : "Choose a vendor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorsLoading ? (
                        <SelectItem value="loading" disabled>Loading vendors...</SelectItem>
                      ) : vendorsData.length === 0 ? (
                        <SelectItem value="no-vendors" disabled>No vendors available</SelectItem>
                      ) : (
                        vendorsData
                          .filter(vendor => vendor.status === 'active')
                          .map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.vendor_id && <p className="text-sm text-red-500 mt-1">{errors.vendor_id}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {vendorsData.length > 0
                      ? `${vendorsData.filter(v => v.status === 'active').length} active vendors available`
                      : "No vendors found - add vendors first"
                    }
                  </p>
                </div>

                {formData.vendor_id && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vendor_name">Vendor Name</Label>
                        <Input
                          id="vendor_name"
                          value={formData.vendor_name}
                          placeholder="Auto-populated from vendor"
                          className="bg-muted"
                          disabled
                        />
                      </div>

                      <div>
                        <Label htmlFor="vendor_gstin">Vendor GSTIN</Label>
                        <Input
                          id="vendor_gstin"
                          value={formData.vendor_gstin}
                          placeholder="Auto-populated from vendor"
                          className="bg-muted"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="vendor_contact">Vendor Contact</Label>
                      <Input
                        id="vendor_contact"
                        value={formData.vendor_contact}
                        placeholder="Auto-populated from vendor"
                        className="bg-muted"
                        disabled
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bill File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bill Document *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <input
                  type="file"
                  id="bill-file-upload"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (10MB max)
                      if (file.size > 10 * 1024 * 1024) {
                        setErrors(prev => ({ ...prev, uploaded_file: 'File size must be less than 10MB' }));
                        return;
                      }
                      // Validate file type
                      const allowedTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg'];
                      if (!allowedTypes.includes(file.type)) {
                        setErrors(prev => ({ ...prev, uploaded_file: 'Please upload a PDF, PNG, JPG, or JPEG file' }));
                        return;
                      }
                      setFormData(prev => ({ ...prev, uploaded_file: file }));
                      if (errors.uploaded_file) {
                        setErrors(prev => ({ ...prev, uploaded_file: '' }));
                      }
                    }
                  }}
                  className="hidden"
                />

                {formData.uploaded_file ? (
                  <div className="border border-green-300 bg-green-50 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{formData.uploaded_file.name}</p>
                          <p className="text-xs text-green-600">
                            {(formData.uploaded_file.size / 1024 / 1024).toFixed(1)} MB
                            {isUploadingFile && <span className="ml-2">- Uploading...</span>}
                          </p>
                        </div>
                      </div>
                      {!isUploadingFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, uploaded_file: null }));
                            const fileInput = document.getElementById('bill-file-upload') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors ${
                      errors.uploaded_file ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    onClick={() => document.getElementById('bill-file-upload')?.click()}
                  >
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium mb-1">Choose file</p>
                    <p className="text-xs text-muted-foreground">
                      PDF, PNG, JPG (Max 10MB)
                    </p>
                  </div>
                )}

                {errors.uploaded_file && (
                  <p className="text-sm text-red-500 mt-2">{errors.uploaded_file}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subtotal">Subtotal *</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => handleInputChange('subtotal', e.target.value)}
                    placeholder="0.00"
                    className={errors.subtotal ? 'border-red-500' : ''}
                  />
                  {errors.subtotal && <p className="text-sm text-red-500 mt-1">{errors.subtotal}</p>}
                </div>

                <div>
                  <Label htmlFor="discount_amount">Discount Amount</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => handleInputChange('discount_amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="freight_amount">Freight Amount</Label>
                  <Input
                    id="freight_amount"
                    type="number"
                    step="0.01"
                    value={formData.freight_amount}
                    onChange={(e) => handleInputChange('freight_amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="other_charges">Other Charges</Label>
                  <Input
                    id="other_charges"
                    type="number"
                    step="0.01"
                    value={formData.other_charges}
                    onChange={(e) => handleInputChange('other_charges', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="taxable_value">Taxable Value</Label>
                  <Input
                    id="taxable_value"
                    value={formData.taxable_value}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GST & Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GST & Tax Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* GST Type Selection */}
                <div>
                  <Label>GST Type</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="gst_type"
                        value="cgst_sgst"
                        checked={formData.gst_type === 'cgst_sgst'}
                        onChange={(e) => handleInputChange('gst_type', e.target.value)}
                      />
                      <span>CGST + SGST</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="gst_type"
                        value="igst"
                        checked={formData.gst_type === 'igst'}
                        onChange={(e) => handleInputChange('gst_type', e.target.value)}
                      />
                      <span>IGST</span>
                    </label>
                  </div>
                </div>

                {/* GST Rates and Amounts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.gst_type === 'cgst_sgst' ? (
                    <>
                      <div>
                        <Label htmlFor="cgst_rate">CGST Rate (%)</Label>
                        <Input
                          id="cgst_rate"
                          type="number"
                          step="0.01"
                          value={formData.cgst_rate}
                          onChange={(e) => handleInputChange('cgst_rate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sgst_rate">SGST Rate (%)</Label>
                        <Input
                          id="sgst_rate"
                          type="number"
                          step="0.01"
                          value={formData.sgst_rate}
                          onChange={(e) => handleInputChange('sgst_rate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>IGST Rate (%)</Label>
                        <Input value="0" readOnly className="bg-muted" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label>CGST Rate (%)</Label>
                        <Input value="0" readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>SGST Rate (%)</Label>
                        <Input value="0" readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label htmlFor="igst_rate">IGST Rate (%)</Label>
                        <Input
                          id="igst_rate"
                          type="number"
                          step="0.01"
                          value={formData.igst_rate}
                          onChange={(e) => handleInputChange('igst_rate', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>CGST Amount</Label>
                    <Input value={`₹${formData.cgst}`} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>SGST Amount</Label>
                    <Input value={`₹${formData.sgst}`} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>IGST Amount</Label>
                    <Input value={`₹${formData.igst}`} readOnly className="bg-muted" />
                  </div>

                  <div>
                    <Label htmlFor="tcs">TCS Amount</Label>
                    <Input
                      id="tcs"
                      type="number"
                      step="0.01"
                      value={formData.tcs}
                      onChange={(e) => handleInputChange('tcs', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tds">TDS Amount</Label>
                    <Input
                      id="tds"
                      type="number"
                      step="0.01"
                      value={formData.tds}
                      onChange={(e) => handleInputChange('tds', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="round_off">Round Off</Label>
                    <Input
                      id="round_off"
                      type="number"
                      step="0.01"
                      value={formData.round_off}
                      onChange={(e) => handleInputChange('round_off', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Additional GST Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="place_of_supply">Place of Supply</Label>
                    <Select value={formData.place_of_supply} onValueChange={(value) => handleInputChange('place_of_supply', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="gst_scheme">GST Scheme</Label>
                    <Input
                      id="gst_scheme"
                      value={formData.gst_scheme}
                      onChange={(e) => handleInputChange('gst_scheme', e.target.value)}
                      placeholder="Regular/Composition/etc."
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="itc_eligible"
                    checked={formData.itc_eligible}
                    onCheckedChange={(checked) => handleInputChange('itc_eligible', checked)}
                  />
                  <Label htmlFor="itc_eligible">ITC Eligible</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Amount */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="text-lg font-medium">Grand Total:</span>
                <span className="text-2xl font-bold text-green-600">₹{formData.grand_total}</span>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Reason/Description</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder="Purpose of the bill or description of goods/services"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes_internal">Internal Notes</Label>
                  <Textarea
                    id="notes_internal"
                    value={formData.notes_internal}
                    onChange={(e) => handleInputChange('notes_internal', e.target.value)}
                    placeholder="Internal notes for reference"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {errors.submit && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error creating bill:</span>
            </div>
            <p className="text-red-600 mt-1">{errors.submit}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploadingFile}>
            {isUploadingFile
              ? 'Uploading file...'
              : isSubmitting
              ? (isEdit ? 'Updating...' : 'Creating...')
              : (isEdit ? 'Update Bill' : 'Create Bill')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}