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
import { ShopifyOrder, OrderStatus } from '@/hooks/useShopifyOrders';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { BulkActionsBar } from './BulkActionsBar';

interface OrdersTableProps {
  orders: ShopifyOrder[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  sortBy: 'order_id' | 'Order Time' | 'total_price';
  sortOrder: 'asc' | 'desc';
  onSort: (field: 'order_id' | 'Order Time' | 'total_price') => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<{ success: boolean; error?: string }>;
  onLoadMore: () => void;
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

  const getSortIcon = (field: 'order_id' | 'Order Time' | 'total_price') => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
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
      setSelectedOrders(new Set(orders.map(order => order.order_id)));
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

  const isAllSelected = orders.length > 0 && selectedOrders.size === orders.length;
  const isIndeterminate = selectedOrders.size > 0 && selectedOrders.size < orders.length;

  if (loading) {
    return (
      <div className="rounded-md border">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedOrders.size}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onClearSelection={() => setSelectedOrders(new Set())}
      />

      {/* Stats Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground p-4 bg-muted/20">
        <span>Showing {orders.length} of {(totalCount || 0).toLocaleString()} orders</span>
        {loadingMore && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Loading more...
          </div>
        )}
      </div>

      {/* Table */}
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
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors min-w-32 border-r border-border/50 bg-muted/30 whitespace-nowrap"
                  onClick={() => onSort('order_id')}
                >
                  <div className="flex items-center gap-2">
                    Order ID
                    {getSortIcon('order_id')}
                  </div>
                </TableHead>
                <TableHead className="min-w-32 border-r border-border/50 bg-muted/30 whitespace-nowrap">Name</TableHead>
                <TableHead className="min-w-32 border-r border-border/50 bg-muted/30 whitespace-nowrap">Financial Status</TableHead>
                <TableHead className="min-w-36 border-r border-border/50 bg-muted/30 whitespace-nowrap">Order Status</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors min-w-28 border-r border-border/50 bg-muted/30 whitespace-nowrap"
                  onClick={() => onSort('total_price')}
                >
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Total Price
                    {getSortIcon('total_price')}
                  </div>
                </TableHead>
                <TableHead className="min-w-48 border-r border-border/50 bg-muted/30 whitespace-nowrap">Email</TableHead>
                <TableHead className="min-w-32 border-r border-border/50 bg-muted/30 whitespace-nowrap">Phone</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors min-w-40 border-r border-border/50 bg-muted/30 whitespace-nowrap"
                  onClick={() => onSort('Order Time')}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Order Time
                    {getSortIcon('Order Time')}
                  </div>
                </TableHead>
                <TableHead className="min-w-24 bg-muted/30 whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                      <p>No orders found matching your criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
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
          </Table>
        </div>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={loadingMore}
            className="min-w-40"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Loading...
              </div>
            ) : (
              'Load More Orders'
            )}
          </Button>
        </div>
      )}

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}