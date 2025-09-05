import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ShopifyOrder {
  order_id: string;
  name: string | null;
  financial_status: string | null;
  'Order Status': string | null;
  total_price: number | null;
  email: string | null;
  phone: string | null;
  'Order Time': string | null;
  raw: any;
  'Order URL': string | null;
  'Feedback Score': string | null;
  Feedback: string | null;
  'Customer Address': string | null;
  'Order Note': string | null;
}

export type OrderStatus = 'Packed' | 'Shipped' | 'Unfulfilled' | 'Dispute';
export type DateFilter = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

interface UseShopifyOrdersProps {
  searchTerm?: string;
  dateFilter?: DateFilter;
  customDateRange?: { start: Date; end: Date };
  sortBy?: 'order_id' | 'Order Time' | 'total_price';
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
}

export function useShopifyOrders({
  searchTerm = '',
  dateFilter = 'last30days',
  customDateRange,
  sortBy = 'Order Time',
  sortOrder = 'desc',
  pageSize = 50
}: UseShopifyOrdersProps = {}) {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setOrders([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const from = reset ? 0 : orders.length;
      const to = from + pageSize - 1;

      // Get total count first
      let countQuery = supabase
        .from('shopify_orders' as any)
        .select('*', { count: 'exact', head: true });

      // Apply same filters for count
      if (dateFilter !== 'custom') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            countQuery = countQuery.gte('Order Time', startDate.toISOString());
            break;
          case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            countQuery = countQuery.gte('Order Time', startDate.toISOString())
                        .lt('Order Time', endDate.toISOString());
            break;
          case 'last7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            countQuery = countQuery.gte('Order Time', startDate.toISOString());
            break;
          case 'last30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            countQuery = countQuery.gte('Order Time', startDate.toISOString());
            break;
        }
      } else if (customDateRange) {
        countQuery = countQuery
          .gte('Order Time', customDateRange.start.toISOString())
          .lte('Order Time', customDateRange.end.toISOString());
      }

      // Get data query
      let query = supabase
        .from('shopify_orders' as any)
        .select('*')
        .range(from, to);

      // Apply same date filtering
      if (dateFilter !== 'custom') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            query = query.gte('Order Time', startDate.toISOString());
            break;
          case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            query = query.gte('Order Time', startDate.toISOString())
                        .lt('Order Time', endDate.toISOString());
            break;
          case 'last7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            query = query.gte('Order Time', startDate.toISOString());
            break;
          case 'last30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            query = query.gte('Order Time', startDate.toISOString());
            break;
        }
      } else if (customDateRange) {
        query = query
          .gte('Order Time', customDateRange.start.toISOString())
          .lte('Order Time', customDateRange.end.toISOString());
      }

      // Apply sorting
      const orderColumn = sortBy === 'Order Time' ? 'Order Time' : sortBy;
      query = query.order(orderColumn as any, { ascending: sortOrder === 'asc' });

      const [{ count }, { data, error: fetchError }] = await Promise.all([
        countQuery,
        query
      ]);

      if (fetchError) throw fetchError;

      const newOrders = (data as unknown as ShopifyOrder[]) || [];
      
      if (reset) {
        setOrders(newOrders);
        setTotalCount(count || 0);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }

      setHasMore(newOrders.length === pageSize && (reset ? newOrders.length : orders.length + newOrders.length) < (count || 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchOrders(false);
    }
  }, [loadingMore, hasMore, orders.length]);

  // Real-time subscription for new orders
  useEffect(() => {
    const channel = supabase
      .channel('shopify_orders_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shopify_orders'
        },
        (payload) => {
          const newOrder = payload.new as ShopifyOrder;
          setOrders(prev => [newOrder, ...prev]);
          setTotalCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopify_orders'
        },
        (payload) => {
          const updatedOrder = payload.new as ShopifyOrder;
          setOrders(prev => 
            prev.map(order => 
              order.order_id === updatedOrder.order_id ? updatedOrder : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [dateFilter, customDateRange, sortBy, sortOrder]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;

    const searchTerms = searchTerm.split(',').map(term => term.trim().toLowerCase());
    
    return orders.filter(order => 
      searchTerms.some(term => 
        order.order_id?.toLowerCase().includes(term) ||
        order.name?.toLowerCase().includes(term) ||
        order.email?.toLowerCase().includes(term)
      )
    );
  }, [orders, searchTerm]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('shopify_orders' as any)
        .update({ 'Order Status': status })
        .eq('order_id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.order_id === orderId 
            ? { ...order, 'Order Status': status }
            : order
        )
      );

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update order status' 
      };
    }
  };

  const refetch = useCallback(() => {
    fetchOrders(true);
  }, []);

  return {
    orders: filteredOrders,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    refetch,
    loadMore,
    updateOrderStatus
  };
}