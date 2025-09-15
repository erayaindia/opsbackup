import React, { useState } from 'react';
import { Vendor } from '@/hooks/useSuppliers';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BaseTable,
  TableHeader as SharedTableHeader,
  TablePagination,
  TableFilters,
  TableExport,
  useTableState,
  type FilterOption,
  type ExportColumn
} from '@/components/shared/tables';
import {
  Package,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  ChevronDown,
  ChevronRight,
  User,
  FileText,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

interface VendorsTableProps {
  vendors: Vendor[];
  onEdit: (vendor: Vendor) => void;
  loading?: boolean;
}

export const VendorsTable: React.FC<VendorsTableProps> = ({
  vendors,
  onEdit,
  loading = false
}) => {
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Define filter options for the table
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ],
      placeholder: 'Filter by status'
    }
  ];

  // Define export columns
  const exportColumns: ExportColumn[] = [
    { key: 'name', header: 'Vendor Name' },
    { key: 'gstin', header: 'GSTIN' },
    { key: 'contact_person', header: 'Contact Person' },
    { key: 'contact_email', header: 'Email' },
    { key: 'contact_phone', header: 'Phone' },
    { key: 'status', header: 'Status' },
    { key: 'payment_terms', header: 'Payment Terms' },
    { key: 'address', header: 'Address' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    { key: 'country', header: 'Country' },
    { key: 'postal_code', header: 'Postal Code' },
    { key: 'created_at', header: 'Created Date', transform: (value) => format(new Date(value), 'MMM d, yyyy') }
  ];

  // Initialize table state
  const tableState = useTableState({
    data: vendors,
    defaultSortField: 'name',
    defaultSortDirection: 'asc',
    searchFields: ['name', 'gstin', 'contact_person', 'contact_email', 'contact_phone'],
    filterConfig: {
      status: { field: 'status' }
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'inactive': { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };

    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVendors(new Set(tableState.paginatedData.map(vendor => vendor.id)));
    } else {
      setSelectedVendors(new Set());
    }
  };

  const handleSelectVendor = (vendorId: string, checked: boolean) => {
    const newSelectedVendors = new Set(selectedVendors);
    if (checked) {
      newSelectedVendors.add(vendorId);
    } else {
      newSelectedVendors.delete(vendorId);
    }
    setSelectedVendors(newSelectedVendors);
  };

  const toggleRowExpansion = (vendorId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  const isAllSelected = tableState.paginatedData.length > 0 && selectedVendors.size === tableState.paginatedData.length;
  const isIndeterminate = selectedVendors.size > 0 && selectedVendors.size < tableState.paginatedData.length;

  if (loading) {
    return (
      <div className="space-y-0">
        <BaseTable loading={loading} className="rounded-none" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Table Filters */}
      <TableFilters
        searchTerm={tableState.searchTerm}
        onSearchChange={tableState.setSearchTerm}
        searchPlaceholder="Search vendors by name, GSTIN, contact, email or phone..."
        filterOptions={filterOptions}
        filters={tableState.filters}
        onFilterChange={tableState.setFilter}
        onClearFilters={tableState.clearFilters}
        className="rounded-none"
      />

      {/* Export and Stats Bar */}
      <div className="flex items-center justify-between p-4 bg-muted/20 border-b border-border/50">
        <div className="flex items-center gap-4">
          <TableExport
            data={tableState.filteredData}
            columns={exportColumns}
            filename={`vendors_export_${new Date().toISOString().split('T')[0]}.csv`}
            className="rounded-none"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {tableState.startIndex}-{tableState.endIndex} of {tableState.filteredData.length} vendors
          {tableState.filteredData.length !== vendors.length && ` (filtered from ${vendors.length} total)`}
        </div>
      </div>

      {/* Table */}
      <BaseTable className="rounded-none border-t-0">
        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-12 border-r border-border/50 bg-muted/30 whitespace-nowrap">
              <Checkbox
                checked={isAllSelected || isIndeterminate}
                onCheckedChange={handleSelectAll}
                className="mx-auto"
              />
            </TableHead>
            <TableHead className="w-10 border-r border-border/50 bg-muted/30 whitespace-nowrap"></TableHead>
            <SharedTableHeader
              field="name"
              sortable={true}
              onSort={tableState.handleSort}
              sortField={tableState.sortField}
              sortDirection={tableState.sortDirection}
              className="border-r border-border/50 bg-muted/30 whitespace-nowrap"
            >
              Vendor Name
            </SharedTableHeader>
            <SharedTableHeader
              field="gstin"
              sortable={true}
              onSort={tableState.handleSort}
              sortField={tableState.sortField}
              sortDirection={tableState.sortDirection}
              className="border-r border-border/50 bg-muted/30 whitespace-nowrap"
            >
              GSTIN
            </SharedTableHeader>
            <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Contact Person</TableHead>
            <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Email</TableHead>
            <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Phone</TableHead>
            <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Status</TableHead>
            <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Payment Terms</TableHead>
            <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Location</TableHead>
            <TableHead className="bg-muted/30 whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableState.paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Building className="h-8 w-8 text-muted-foreground/50" />
                  <p>No vendors found matching your criteria</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            tableState.paginatedData.map((vendor) => {
                const isExpanded = expandedRows.has(vendor.id);
                return (
                  <React.Fragment key={vendor.id}>
                    <TableRow className="hover:bg-muted/20 transition-all duration-200 h-12 border-b border-border/30">
                      <TableCell className="border-r border-border/50">
                        <Checkbox
                          checked={selectedVendors.has(vendor.id)}
                          onCheckedChange={(checked) => handleSelectVendor(vendor.id, checked as boolean)}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(vendor.id)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium border-r border-border/50">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {vendor.name}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 font-mono text-sm">
                        {vendor.gstin || '-'}
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          {vendor.contact_person && <User className="h-3 w-3 text-muted-foreground" />}
                          {vendor.contact_person || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          {vendor.contact_email && <Mail className="h-3 w-3 text-muted-foreground" />}
                          <span className="truncate max-w-48">{vendor.contact_email || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          {vendor.contact_phone && <Phone className="h-3 w-3 text-muted-foreground" />}
                          {vendor.contact_phone || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        {getStatusBadge(vendor.status)}
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          {vendor.payment_terms || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {vendor.city && vendor.state ? `${vendor.city}, ${vendor.state}` : vendor.city || vendor.state || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(vendor)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/10 border-b border-border/20">
                        <TableCell colSpan={11} className="py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                            {/* Contact Information */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Contact Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Contact:</span>
                                  <span>{vendor.contact_person || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Email:</span>
                                  <span className="truncate">{vendor.contact_email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Phone:</span>
                                  <span>{vendor.contact_phone || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Business Information */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Business Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">GSTIN:</span>
                                  <span>{vendor.gstin || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Payment Terms:</span>
                                  <span>{vendor.payment_terms || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Status:</span>
                                  <span>{getStatusBadge(vendor.status)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Address Information */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Address Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                {vendor.address && (
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                    <div>
                                      <span className="text-muted-foreground">Address:</span>
                                      <p className="text-xs">{vendor.address}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-muted-foreground">City:</span>
                                    <span className="ml-1">{vendor.city || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">State:</span>
                                    <span className="ml-1">{vendor.state || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-muted-foreground">Country:</span>
                                    <span className="ml-1">{vendor.country || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Postal:</span>
                                    <span className="ml-1">{vendor.postal_code || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Created:</span>
                                  <span>{formatDate(vendor.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
            })
          )}
        </TableBody>
      </BaseTable>

      {/* Pagination */}
      <TablePagination
        currentPage={tableState.currentPage}
        totalPages={tableState.totalPages}
        itemsPerPage={tableState.itemsPerPage}
        totalItems={tableState.filteredData.length}
        onPageChange={tableState.setCurrentPage}
        onItemsPerPageChange={tableState.setItemsPerPage}
        startIndex={tableState.startIndex}
        endIndex={tableState.endIndex}
        className="rounded-none border-t-0"
      />
    </div>
  );
};