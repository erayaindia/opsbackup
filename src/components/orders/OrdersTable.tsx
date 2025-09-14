import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  IndianRupee,
  Calendar,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
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
import { ShopifyOrder, OrderStatus } from '@/hooks/useShopifyOrders';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { BulkActionsBar } from './BulkActionsBar';

interface OrdersTableProps {
  orders: ShopifyOrder[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  totalCount?: number;
  sortBy?: string;
  sortOrder?: string;
  onSort?: (field: string) => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<{ success: boolean; error?: string }>;
  onLoadMore?: () => void;
}

export function OrdersTable({
  orders,
  loading,
  loadingMore,
  hasMore,
  totalCount,
  sortBy,
  sortOrder,
  onSort,
  onStatusUpdate,
  onLoadMore
}: OrdersTableProps) {
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Define filter options for the table
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Order Status',
      options: [
        { value: 'Packed', label: 'Packed' },
        { value: 'Shipped', label: 'Shipped' },
        { value: 'Unfulfilled', label: 'Unfulfilled' },
        { value: 'Dispute', label: 'Dispute' }
      ],
      placeholder: 'Filter by status'
    },
    {
      key: 'financial_status',
      label: 'Financial Status',
      options: [
        { value: 'paid', label: 'Paid' },
        { value: 'pending', label: 'Pending' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      placeholder: 'Filter by payment'
    }
  ];

  // Define export columns
  const exportColumns: ExportColumn[] = [
    { key: 'order_id', header: 'Order ID' },
    { key: 'name', header: 'Customer Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'total_price', header: 'Total Price', transform: (value) => value ? `₹${value}` : '₹0' },
    { key: 'Order Status', header: 'Order Status' },
    { key: 'financial_status', header: 'Financial Status' },
    { key: 'Order Time', header: 'Order Time', transform: (value) => value ? format(new Date(value), 'MMM d, yyyy HH:mm') : '-' }
  ];

  // Initialize table state
  const tableState = useTableState({
    data: orders,
    defaultSortField: 'Order Time',
    defaultSortDirection: 'desc',
    searchFields: ['order_id', 'name', 'email', 'phone'],
    filterConfig: {
      status: { field: 'Order Status' },
      financial_status: { field: 'financial_status', transform: (value) => value?.toLowerCase() }
    }
  });

  const getSortIcon = (field: string) => {
    const sortDirection = tableState.getSortIcon(field);
    if (!sortDirection) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig = {
      'Packed': { variant: 'secondary' as const, icon: Package, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'Shipped': { variant: 'default' as const, icon: Truck, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'Unfulfilled': { variant: 'outline' as const, icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'Dispute': { variant: 'destructive' as const, icon: AlertTriangle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'outline' as const,
      icon: CheckCircle,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {status || 'Unknown'}
      </Badge>
    );
  };

  const getFinancialStatusBadge = (status: string | null) => {
    const statusConfig = {
      'paid': { variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'pending': { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'refunded': { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
      'cancelled': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };
    
    const config = statusConfig[status?.toLowerCase() as keyof typeof statusConfig] || {
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status || 'Unknown'}
      </Badge>
    );
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '-';
    try {
      return format(new Date(dateTime), 'MMM d, yyyy HH:mm');
    } catch {
      return dateTime;
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const result = await onStatusUpdate(orderId, newStatus);
      
      if (result.success) {
        toast.success(`Order ${orderId} status updated to ${newStatus}`);
      } else {
        toast.error(result.error || 'Failed to update order status');
      }
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(tableState.paginatedData.map(order => order.order_id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelectedOrders = new Set(selectedOrders);
    if (checked) {
      newSelectedOrders.add(orderId);
    } else {
      newSelectedOrders.delete(orderId);
    }
    setSelectedOrders(newSelectedOrders);
  };

  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    const selectedOrderIds = Array.from(selectedOrders);
    const updatePromises = selectedOrderIds.map(orderId => onStatusUpdate(orderId, status));
    
    try {
      await Promise.all(updatePromises);
      setSelectedOrders(new Set());
    } catch (error) {
      throw error;
    }
  };

  const handleRowClick = (order: ShopifyOrder, event: React.MouseEvent) => {
    // Don't open drawer if clicking on interactive elements
    if ((event.target as HTMLElement).closest('button, select, input, [role="combobox"]')) {
      return;
    }
    
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const isAllSelected = tableState.paginatedData.length > 0 && selectedOrders.size === tableState.paginatedData.length;
  const isIndeterminate = selectedOrders.size > 0 && selectedOrders.size < tableState.paginatedData.length;

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
        searchPlaceholder="Search orders by ID, name, email or phone..."
        filterOptions={filterOptions}
        filters={tableState.filters}
        onFilterChange={tableState.setFilter}
        onClearFilters={tableState.clearFilters}
        className="rounded-none"
      />

      {/* Export and Actions Bar */}
      <div className="flex items-center justify-between p-4 bg-muted/20 border-b border-border/50">
        <div className="flex items-center gap-4">
          <TableExport
            data={tableState.filteredData}
            columns={exportColumns}
            filename={`orders_export_${new Date().toISOString().split('T')[0]}.csv`}
            className="rounded-none"
          />
          {selectedOrders.size > 0 && (
            <BulkActionsBar
              selectedCount={selectedOrders.size}
              onBulkStatusUpdate={handleBulkStatusUpdate}
              onClearSelection={() => setSelectedOrders(new Set())}
            />
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {tableState.startIndex}-{tableState.endIndex} of {tableState.filteredData.length} orders
          {tableState.filteredData.length !== orders.length && ` (filtered from ${orders.length} total)`}
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
            <SharedTableHeader
              field="order_id"
              sortable={true}
              onSort={tableState.handleSort}
              sortField={tableState.sortField}
              sortDirection={tableState.sortDirection}
              className="min-w-32 border-r border-border/50 bg-muted/30 whitespace-nowrap"
            >
              Order ID
            </SharedTableHeader>
            <TableHead className="min-w-32 border-r border-border/50 bg-muted/30 whitespace-nowrap">Name</TableHead>
            <TableHead className="min-w-32 border-r border-border/50 bg-muted/30 whitespace-nowrap">Financial Status</TableHead>
            <TableHead className="min-w-36 border-r border-border/50 bg-muted/30 whitespace-nowrap">Order Status</TableHead>
            <SharedTableHeader
              field="total_price"
              sortable={true}
              onSort={tableState.handleSort}
              sortField={tableState.sortField}
              sortDirection={tableState.sortDirection}
              className="min-w-28 border-r border-border/50 bg-muted/30 whitespace-nowrap"
            >
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Total Price
              </div>
            </SharedTableHeader>
            <TableHead className="min-w-48 border-r border-border/50 bg-muted/30 whitespace-nowrap">Email</TableHead>
            <TableHead className="min-w-32 border-r border-border/50 bg-muted/30 whitespace-nowrap">Phone</TableHead>
            <SharedTableHeader
              field="Order Time"
              sortable={true}
              onSort={tableState.handleSort}
              sortField={tableState.sortField}
              sortDirection={tableState.sortDirection}
              className="min-w-40 border-r border-border/50 bg-muted/30 whitespace-nowrap"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Order Time
              </div>
            </SharedTableHeader>
            <TableHead className="min-w-24 bg-muted/30 whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableState.paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                  <p>No orders found matching your criteria</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            tableState.paginatedData.map((order) => (
              <TableRow
                key={order.order_id}
                className="hover:bg-muted/20 transition-all duration-200 cursor-pointer h-12 border-b border-border/30"
                onClick={(e) => handleRowClick(order, e)}
              >
                    <TableCell onClick={(e) => e.stopPropagation()} className="border-r border-border/50">
                      <Checkbox
                        checked={selectedOrders.has(order.order_id)}
                        onCheckedChange={(checked) => handleSelectOrder(order.order_id, checked as boolean)}
                        className="mx-auto"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium border-r border-border/50">
                      {order.order_id}
                    </TableCell>
                    <TableCell className="font-medium border-r border-border/50">
                      {order.name || '-'}
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      {getFinancialStatusBadge(order.financial_status)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="border-r border-border/50">
                      <Select
                        value={order['Order Status'] || 'Unfulfilled'}
                        onValueChange={(value) => handleStatusUpdate(order.order_id, value as OrderStatus)}
                        disabled={updatingStatus[order.order_id]}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Packed">
                            <div className="flex items-center gap-2">
                              <Package className="h-3 w-3" />
                              Packed
                            </div>
                          </SelectItem>
                          <SelectItem value="Shipped">
                            <div className="flex items-center gap-2">
                              <Truck className="h-3 w-3" />
                              Shipped
                            </div>
                          </SelectItem>
                          <SelectItem value="Unfulfilled">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3" />
                              Unfulfilled
                            </div>
                          </SelectItem>
                          <SelectItem value="Dispute">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3" />
                              Dispute
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-medium border-r border-border/50">
                      {formatPrice(order.total_price)}
                    </TableCell>
                    <TableCell className="max-w-48 truncate border-r border-border/50">
                      {order.email || '-'}
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      {order.phone || '-'}
                    </TableCell>
                    <TableCell className="border-r border-border/50">
                      {formatDateTime(order['Order Time'])}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {order['Order URL'] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(order['Order URL']!, '_blank')}
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
              </TableRow>
            ))
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

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}