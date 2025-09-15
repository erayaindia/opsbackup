import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText, Search, Filter, Download, Upload, RefreshCw, Plus, Edit, Eye,
  MoreHorizontal, Check, X, Copy, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink,
  DollarSign, Calendar as CalendarIcon, AlertTriangle, Package
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useInvoices, Bill } from "@/hooks/useInvoices";
import AddBillModal from "@/components/finance/AddBillModal";

// Bill interface is imported from useInvoices hook
// Mock data removed - now using real Supabase data

export default function Invoice() {
  const navigate = useNavigate();

  // Use the custom hook for invoice data
  const { bills, vendors, stats, loading, error, actions } = useInvoices();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['all']);
  const [selectedVendors, setSelectedVendors] = useState<string[]>(['all']);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Dialog states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon for header
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="h-3 w-3" /> :
      <ArrowDown className="h-3 w-3" />;
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = bills;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(bill =>
        bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedTypes.length > 0 && !selectedTypes.includes('all')) {
      filtered = filtered.filter(bill => selectedTypes.includes(bill.type));
    }

    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes('all')) {
      filtered = filtered.filter(bill => selectedStatuses.includes(bill.status));
    }

    // Vendor filter
    if (selectedVendors.length > 0 && !selectedVendors.includes('all')) {
      filtered = filtered.filter(bill => selectedVendors.includes(bill.vendor_name));
    }

    // Sort data
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: unknown = a[sortField as keyof typeof a];
        let bValue: unknown = b[sortField as keyof typeof b];

        // Handle different data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [bills, searchTerm, selectedTypes, selectedStatuses, selectedVendors, sortField, sortDirection]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredData.length);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTypes, selectedStatuses, selectedVendors]);

  // Utility functions - defined first to avoid hoisting issues
  const isOverdue = (dueDate: Date) => {
    return new Date() > dueDate;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'approved': return 'secondary';
      case 'part_paid': return 'secondary';
      case 'pending': return 'outline';
      case 'draft': return 'outline';
      case 'void': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'stock': return 'default';
      case 'expense': return 'secondary';
      case 'service': return 'outline';
      case 'capex': return 'destructive';
      default: return 'outline';
    }
  };

  const getGSTType = (bill: Bill) => {
    return bill.igst > 0 ? 'IGST' : 'CGST+SGST';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Get unique values for filters
  const types = ['all', ...Array.from(new Set(bills.map(bill => bill.type)))];
  const allVendors = ['all', ...vendors];

  // Export to CSV function
  const exportToCSV = () => {
    const headers = [
      'Bill #', 'Vendor', 'Type', 'Bill Date', 'Due Date', 'Status',
      'Grand Total', 'Paid', 'Due', 'GST Type', 'ITC', 'Reason'
    ];

    const csvData = filteredData.map(bill => [
      bill.bill_number,
      bill.vendor_name,
      bill.type,
      format(bill.bill_date, 'dd MMM yyyy'),
      format(bill.due_date, 'dd MMM yyyy'),
      bill.status,
      bill.grand_total,
      bill.amount_paid,
      bill.amount_due,
      getGSTType(bill),
      bill.itc_eligible ? 'Yes' : 'No',
      bill.reason
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `bills_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    actions.refreshData();
  };

  const handleCreateBill = async (billData: Partial<Bill>) => {
    return await actions.createInvoice(billData);
  };

  const handleBillCreated = (newBill: Bill) => {
    console.log('New bill created:', newBill);
    // Bill is already added to the list by the useInvoices hook
  };

  return (
    <TooltipProvider>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Bills & Invoices</h1>
            <p className="text-muted-foreground">
              Manage your bills and invoice payments
              <span className="ml-4 text-xs">
                Last updated: {new Date().toLocaleString()}
              </span>
            </p>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
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
              onClick={exportToCSV}
              variant="outline"
              className="rounded-none"
              disabled={filteredData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button onClick={() => setShowCreateForm(true)} className="rounded-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{stats.totalDue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 rounded-none border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 rounded-none">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 rounded-none h-10 w-full"
                />
              </div>

              <Select
                value={selectedTypes.includes('all') ? 'all' : selectedTypes[0]}
                onValueChange={(value) => setSelectedTypes(value === 'all' ? ['all'] : [value])}
              >
                <SelectTrigger className="w-[150px] rounded-none h-10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatuses.includes('all') ? 'all' : selectedStatuses[0]}
                onValueChange={(value) => setSelectedStatuses(value === 'all' ? ['all'] : [value])}
              >
                <SelectTrigger className="w-[150px] rounded-none h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="part_paid">Part Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedVendors.includes('all') ? 'all' : selectedVendors[0]}
                onValueChange={(value) => setSelectedVendors(value === 'all' ? ['all'] : [value])}
              >
                <SelectTrigger className="w-[180px] rounded-none h-10">
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {allVendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor === 'all' ? 'All Vendors' : vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTypes(['all']);
                  setSelectedStatuses(['all']);
                  setSelectedVendors(['all']);
                }}
                className="rounded-none"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="rounded-none">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
                <p className="text-muted-foreground">Loading bills...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bills found</h3>
                <p className="text-muted-foreground">
                  {bills.length === 0
                    ? "No bills in the system. Add some bills to get started."
                    : "No bills match your current filters. Try adjusting your search criteria."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-left"
                        onClick={() => handleSort('bill_number')}
                      >
                        <div className="flex items-center justify-start gap-1">
                          <span>Bill #</span>
                          {getSortIcon('bill_number')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                        onClick={() => handleSort('vendor_name')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Vendor</span>
                          {getSortIcon('vendor_name')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Type</span>
                          {getSortIcon('type')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                        onClick={() => handleSort('bill_date')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Bill Date</span>
                          {getSortIcon('bill_date')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                        onClick={() => handleSort('due_date')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Due Date</span>
                          {getSortIcon('due_date')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                        onClick={() => handleSort('grand_total')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Total</span>
                          {getSortIcon('grand_total')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 border-r border-border/50 text-center"
                        onClick={() => handleSort('amount_due')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Due</span>
                          {getSortIcon('amount_due')}
                        </div>
                      </TableHead>
                      <TableHead className="border-r border-border/50 text-center">GST</TableHead>
                      <TableHead className="border-r border-border/50 text-center">ITC</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="border-r border-border/50 text-left">
                          <div className="font-medium text-blue-600 cursor-pointer hover:underline">
                            {bill.bill_number}
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <div className="text-sm">
                            <div className="font-medium truncate max-w-[120px]" title={bill.vendor_name}>
                              {bill.vendor_name}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {bill.vendor_gstin}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <div className="flex justify-center">
                            <Badge variant={getTypeBadgeVariant(bill.type)} className="rounded-none">
                              {bill.type.charAt(0).toUpperCase() + bill.type.slice(1)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          {format(bill.bill_date, "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {format(bill.due_date, "dd MMM yyyy")}
                            {bill.amount_due > 0 && isOverdue(bill.due_date) && (
                              <Badge variant="destructive" className="text-xs px-1 py-0 rounded-none">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <div className="flex justify-center">
                            <Badge variant={getStatusBadgeVariant(bill.status)} className="rounded-none">
                              {bill.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <div className="text-sm">
                            <div className="font-medium">₹{bill.grand_total.toLocaleString()}</div>
                            <div className="text-muted-foreground text-xs">
                              Paid: ₹{bill.amount_paid.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <div className={cn(
                            "font-medium",
                            bill.amount_due > 0 && isOverdue(bill.due_date) && "text-red-600"
                          )}>
                            ₹{bill.amount_due.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <Badge variant="outline" className="rounded-none">
                            {getGSTType(bill)}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r border-border/50 text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              {bill.itc_eligible ? (
                                <Check className="h-4 w-4 text-green-600 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-red-600 mx-auto" />
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              {bill.itc_eligible ? "ITC Eligible" : "ITC Not Eligible"}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="rounded-none">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-none">
                              <DropdownMenuItem onClick={() => setSelectedBill(bill)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              {bill.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await actions.approveInvoice(bill.id);
                                    } catch (err) {
                                      console.error('Error approving invoice:', err);
                                    }
                                  }}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {bill.status === 'approved' && bill.amount_due > 0 && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    const amount = prompt('Enter payment amount:', bill.amount_due.toString());
                                    if (amount && !isNaN(parseFloat(amount))) {
                                      actions.markPayment(bill.id, parseFloat(amount));
                                    }
                                  }}
                                >
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Mark Payment
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setEditingBill(bill)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {bill.file_url && (
                                <DropdownMenuItem
                                  onClick={() => window.open(bill.file_url, '_blank')}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View File
                                </DropdownMenuItem>
                              )}
                              {bill.status !== 'void' && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to void this bill?')) {
                                      try {
                                        await actions.voidInvoice(bill.id);
                                      } catch (err) {
                                        console.error('Error voiding invoice:', err);
                                      }
                                    }
                                  }}
                                  className="text-red-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Void
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {filteredData.length > 0 && (
          <Card className="mt-4 rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Items per page selector and info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20 h-8 rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Showing {filteredData.length > 0 ? startIndex : 0} to {endIndex} of {filteredData.length} entries
                    {filteredData.length !== bills.length && (
                      <span className="ml-1">(filtered from {bills.length} total)</span>
                    )}
                  </div>
                </div>

                {/* Pagination buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="rounded-none"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <span className="text-sm px-3 py-1 bg-muted rounded-none font-medium">
                      {currentPage}
                    </span>
                    <span className="text-sm text-muted-foreground">of {totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="rounded-none"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Bill Modal */}
        <AddBillModal
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={handleBillCreated}
          vendors={vendors}
          onCreateBill={handleCreateBill}
        />
      </div>
    </TooltipProvider>
  );
}