import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrdersFilters } from '@/components/orders/OrdersFilters';
import { useShopifyOrders, DateFilter } from '@/hooks/useShopifyOrders';
import { Download, BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('last30days');
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | undefined>();
  const [sortBy, setSortBy] = useState<'order_id' | 'Order Time' | 'total_price'>('Order Time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { 
    orders, 
    loading, 
    loadingMore, 
    hasMore, 
    totalCount, 
    error, 
    refetch, 
    loadMore, 
    updateOrderStatus 
  } = useShopifyOrders({
    searchTerm,
    dateFilter,
    customDateRange,
    sortBy,
    sortOrder
  });

  const handleSort = (field: 'order_id' | 'Order Time' | 'total_price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      'Order ID', 'Name', 'Financial Status', 'Order Status', 'Total Price',
      'Email', 'Phone', 'Order Time', 'Order URL', 'Feedback Score',
      'Feedback', 'Customer Address', 'Order Note'
    ];
    
    const csvContent = [
      headers.join(','),
      ...orders.map(order => [
        order.order_id,
        order.name || '',
        order.financial_status || '',
        order['Order Status'] || '',
        order.total_price || '',
        order.email || '',
        order.phone || '',
        order['Order Time'] || '',
        order['Order URL'] || '',
        order['Feedback Score'] || '',
        order.Feedback || '',
        order['Customer Address'] || '',
        order['Order Note'] || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    toast.success(`Exported ${orders.length} orders to CSV`);
  };

  // Calculate stats
  const stats = {
    total: totalCount || orders.length,
    packed: orders.filter(order => order['Order Status'] === 'Packed').length,
    shipped: orders.filter(order => order['Order Status'] === 'Shipped').length,
    unfulfilled: orders.filter(order => order['Order Status'] === 'Unfulfilled').length,
    dispute: orders.filter(order => order['Order Status'] === 'Dispute').length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.total_price || 0), 0)
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Orders Management</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p>Error loading orders: {error}</p>
              <Button onClick={refetch} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={loading || orders.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.packed}</div>
            <div className="text-sm text-muted-foreground">Packed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.shipped}</div>
            <div className="text-sm text-muted-foreground">Shipped</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.unfulfilled}</div>
            <div className="text-sm text-muted-foreground">Unfulfilled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.dispute}</div>
            <div className="text-sm text-muted-foreground">Disputes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <OrdersFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customDateRange={customDateRange}
        onCustomDateRangeChange={setCustomDateRange}
      />

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <OrdersTable
            orders={orders}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            totalCount={totalCount}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onStatusUpdate={updateOrderStatus}
            onLoadMore={loadMore}
          />
        </CardContent>
      </Card>
    </div>
  );
}