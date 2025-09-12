import React, { useState } from 'react';
import { Bill } from '@/hooks/useBills';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Calendar,
  Truck,
  MapPin,
  BarChart3,
  User,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BillsTableProps {
  bills: Bill[];
  onEdit?: (bill: Bill) => void;
  onMarkAsPaid?: (bill: Bill) => void;
  loading?: boolean;
}

export const BillsTable: React.FC<BillsTableProps> = ({
  bills,
  onEdit,
  onMarkAsPaid,
  loading = false
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getStatusInfo = (bill: Bill) => {
    const now = new Date();
    const dueDate = bill.due_date ? new Date(bill.due_date) : null;
    
    if (bill.status === 'paid') {
      return { status: 'paid', label: 'Paid', color: 'default', icon: CheckCircle };
    }
    
    if (dueDate && dueDate < now) {
      return { status: 'overdue', label: 'Overdue', color: 'destructive', icon: XCircle };
    }
    
    if (dueDate && dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
      return { status: 'due_soon', label: 'Due Soon', color: 'warning', icon: AlertTriangle };
    }
    
    return { status: 'pending', label: 'Pending', color: 'secondary', icon: Clock };
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'stock':
        return { label: 'Stock', color: 'blue', bgColor: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'expense':
        return { label: 'Expense', color: 'purple', bgColor: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: type, color: 'gray', bgColor: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const toggleRowExpansion = (billId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(billId)) {
        newSet.delete(billId);
      } else {
        newSet.add(billId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 border-r border-border/50"></TableHead>
            <TableHead className="border-r border-border/50 whitespace-nowrap">Bill Info</TableHead>
            <TableHead className="w-24 border-r border-border/50 whitespace-nowrap">Type</TableHead>
            <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">Status</TableHead>
            <TableHead className="w-40 border-r border-border/50 whitespace-nowrap">Vendor</TableHead>
            <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Invoice No.</TableHead>
            <TableHead className="w-24 border-r border-border/50 whitespace-nowrap">Date</TableHead>
            <TableHead className="w-24 border-r border-border/50 whitespace-nowrap">Due Date</TableHead>
            <TableHead className="w-28 border-r border-border/50 whitespace-nowrap">Subtotal</TableHead>
            <TableHead className="w-48 whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => {
            const statusInfo = getStatusInfo(bill);
            const typeInfo = getTypeInfo(bill.type);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedRows.has(bill.id);

            return (
              <React.Fragment key={bill.id}>
                <TableRow 
                  className="cursor-pointer hover:bg-muted/50 transition-colors h-12"
                  onClick={() => toggleRowExpansion(bill.id)}
                >
                  <TableCell className="border-r border-border/50 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(bill.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-3 w-3 transition-transform duration-200" />
                      )}
                    </Button>
                  </TableCell>
                  
                  <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">Bill #{bill.bill_number}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {bill.tracking_id ? `Track: ${bill.tracking_id}` : 'No tracking'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2 text-sm">
                    <Badge className={`${typeInfo.bgColor} text-xs px-2 py-0.5`}>
                      {typeInfo.label}
                    </Badge>
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    <div className="flex items-center space-x-1">
                      <StatusIcon className="w-3 h-3" />
                      <Badge 
                        variant={statusInfo.color as any}
                        className="whitespace-nowrap text-xs px-2 py-0.5"
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    <div className="flex items-center space-x-1">
                      <Truck className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium text-sm truncate">{bill.vendor_name}</span>
                    </div>
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    <span className="font-mono text-sm">{bill.bill_number}</span>
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">{formatDate(bill.bill_date)}</span>
                    </div>
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    {bill.due_date ? (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{formatDate(bill.due_date)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No due date</span>
                    )}
                  </TableCell>
                
                  <TableCell className="border-r border-border/50 py-2">
                    <span className="text-sm font-medium">₹{bill.subtotal.toLocaleString()}</span>
                  </TableCell>
                
                  <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(bill)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {bill.status === 'pending' && onMarkAsPaid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkAsPaid(bill)}
                          className="px-3"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded Row Content */}
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={10} className="p-0">
                      <div className="bg-muted/30 p-6 border-t animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          
                          {/* Bill Details */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                              Bill Details
                            </h4>
                            
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Bill ID</div>
                                  <div className="text-xs text-muted-foreground font-mono">{bill.id}</div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Bill Number</div>
                                  <div className="text-xs text-muted-foreground font-mono">{bill.bill_number}</div>
                                </div>
                              </div>

                              {bill.tracking_id && (
                                <div className="flex items-center space-x-3">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-sm font-medium">Tracking ID</div>
                                    <div className="text-xs text-muted-foreground font-mono">{bill.tracking_id}</div>
                                  </div>
                                </div>
                              )}

                              {bill.type === 'stock' && (
                                <>
                                  {bill.po_id && (
                                    <div className="flex items-center space-x-3">
                                      <FileText className="w-4 h-4 text-muted-foreground" />
                                      <div>
                                        <div className="text-sm font-medium">PO ID</div>
                                        <div className="text-xs text-muted-foreground font-mono">{bill.po_id}</div>
                                      </div>
                                    </div>
                                  )}
                                  {bill.grn_id && (
                                    <div className="flex items-center space-x-3">
                                      <FileText className="w-4 h-4 text-muted-foreground" />
                                      <div>
                                        <div className="text-sm font-medium">GRN ID</div>
                                        <div className="text-xs text-muted-foreground font-mono">{bill.grn_id}</div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {bill.type === 'expense' && bill.reason && (
                                <div className="flex items-start space-x-3">
                                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <div className="text-sm font-medium">Reason</div>
                                    <div className="text-xs text-muted-foreground">{bill.reason}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vendor Information */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                              Vendor Information
                            </h4>
                            
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <Truck className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Vendor Name</div>
                                  <div className="text-xs text-muted-foreground">{bill.vendor_name}</div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Vendor ID</div>
                                  <div className="text-xs text-muted-foreground font-mono">{bill.vendor_id}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Financial Information */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                              Financial Information
                            </h4>
                            
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <CreditCard className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Subtotal</div>
                                  <div className="text-xs text-muted-foreground">₹{bill.subtotal.toLocaleString()}</div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Bill Date</div>
                                  <div className="text-xs text-muted-foreground">{formatDate(bill.bill_date)}</div>
                                </div>
                              </div>

                              {bill.due_date && (
                                <div className="flex items-center space-x-3">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-sm font-medium">Due Date</div>
                                    <div className="text-xs text-muted-foreground">{formatDate(bill.due_date)}</div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center space-x-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">Created</div>
                                  <div className="text-xs text-muted-foreground">{formatDate(bill.created_at)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
          
          {bills.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                No bills found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};