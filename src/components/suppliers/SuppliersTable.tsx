import React, { useState } from 'react';
import { Supplier } from '@/hooks/useSuppliers';
import { Card, CardContent } from "@/components/ui/card";
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
  Package,
  Edit,
  Star,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronRight,
  User,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  loading?: boolean;
}

export const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
  onEdit,
  loading = false
}) => {
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'inactive': { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
      'pending': { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'blocked': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
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

  const getRatingStars = (rating?: number) => {
    if (!rating) return <span className="text-muted-foreground">No rating</span>;
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
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
      setSelectedSuppliers(new Set(suppliers.map(supplier => supplier.id)));
    } else {
      setSelectedSuppliers(new Set());
    }
  };

  const handleSelectSupplier = (supplierId: string, checked: boolean) => {
    const newSelectedSuppliers = new Set(selectedSuppliers);
    if (checked) {
      newSelectedSuppliers.add(supplierId);
    } else {
      newSelectedSuppliers.delete(supplierId);
    }
    setSelectedSuppliers(newSelectedSuppliers);
  };

  const toggleRowExpansion = (supplierId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  const isAllSelected = suppliers.length > 0 && selectedSuppliers.size === suppliers.length;
  const isIndeterminate = selectedSuppliers.size > 0 && selectedSuppliers.size < suppliers.length;

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 shadow-lg overflow-hidden">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 shadow-lg overflow-hidden">
      <div className="max-h-[70vh] overflow-auto">
        <Table>
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
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Supplier Name</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Code</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Contact Person</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Email</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Phone</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Status</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Lead Time</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Min Order</TableHead>
              <TableHead className="border-r border-border/50 bg-muted/30 whitespace-nowrap">Rating</TableHead>
              <TableHead className="bg-muted/30 whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Building className="h-8 w-8 text-muted-foreground/50" />
                    <p>No suppliers found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => {
                const isExpanded = expandedRows.has(supplier.id);
                return (
                  <React.Fragment key={supplier.id}>
                    <TableRow className="hover:bg-muted/20 transition-all duration-200 h-12 border-b border-border/30">
                      <TableCell className="border-r border-border/50">
                        <Checkbox
                          checked={selectedSuppliers.has(supplier.id)}
                          onCheckedChange={(checked) => handleSelectSupplier(supplier.id, checked as boolean)}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(supplier.id)}
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
                          {supplier.name}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 font-mono text-sm">
                        {supplier.code || '-'}
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          {supplier.contact_person && <User className="h-3 w-3 text-muted-foreground" />}
                          {supplier.contact_person || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          {supplier.email && <Mail className="h-3 w-3 text-muted-foreground" />}
                          <span className="truncate max-w-48">{supplier.email || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          {supplier.phone && <Phone className="h-3 w-3 text-muted-foreground" />}
                          {supplier.phone || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        {getStatusBadge(supplier.status)}
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {supplier.lead_time_days} days
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {formatCurrency(supplier.minimum_order_value)}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        {getRatingStars(supplier.rating)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(supplier)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/10 border-b border-border/20">
                        <TableCell colSpan={12} className="py-4">
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
                                  <span>{supplier.contact_person || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Email:</span>
                                  <span className="truncate">{supplier.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Phone:</span>
                                  <span>{supplier.phone || 'N/A'}</span>
                                </div>
                                {supplier.address && (
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                    <span className="text-muted-foreground">Address:</span>
                                    <span className="text-xs">{JSON.stringify(supplier.address)}</span>
                                  </div>
                                )}
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
                                  <span className="text-muted-foreground">Tax ID:</span>
                                  <span>{supplier.tax_id || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Payment Terms:</span>
                                  <span>{supplier.payment_terms || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Lead Time:</span>
                                  <span>{supplier.lead_time_days} days</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Package className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Min Order:</span>
                                  <span>{formatCurrency(supplier.minimum_order_value)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Additional Information */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Additional Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Star className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Rating:</span>
                                  <div>{getRatingStars(supplier.rating)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">Created:</span>
                                  <span>{formatDate(supplier.created_at)}</span>
                                </div>
                                {supplier.notes && (
                                  <div className="space-y-1">
                                    <span className="text-muted-foreground">Notes:</span>
                                    <p className="text-xs bg-muted/30 p-2 rounded border">{supplier.notes}</p>
                                  </div>
                                )}
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
        </Table>
      </div>
    </div>
  );
};