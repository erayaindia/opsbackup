import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardKPIs {
  ordersToday: {
    value: number;
    change: number;
    loading: boolean;
  };
  pendingOrders: {
    value: number;
    change: number;
    loading: boolean;
  };
  revenueToday: {
    value: number;
    change: number;
    loading: boolean;
  };
  aovToday: {
    value: number;
    changeDaily: number;
    changeWeekly: number;
    loading: boolean;
  };
  avgProcessingTime: {
    value: number; // in hours
    change: number;
    loading: boolean;
  };
  disputes: {
    value: number;
    change: number;
    loading: boolean;
  };
}

export function useDashboardKPIs() {
  const [kpis, setKPIs] = useState<DashboardKPIs>({
    ordersToday: { value: 0, change: 0, loading: true },
    pendingOrders: { value: 0, change: 0, loading: true },
    revenueToday: { value: 0, change: 0, loading: true },
    aovToday: { value: 0, changeDaily: 0, changeWeekly: 0, loading: true },
    avgProcessingTime: { value: 0, change: 0, loading: true },
    disputes: { value: 0, change: 0, loading: true }
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentOrdersLoading, setRecentOrdersLoading] = useState(true);

  const fetchKPIs = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = todayStart;
      const weekAgoStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Orders Today
      const { data: ordersToday, error: ordersTodayError } = await supabase
        .from('shopify_orders' as any)
        .select('order_id, total_price')
        .gte('Order Time', todayStart.toISOString());

      if (ordersTodayError) throw ordersTodayError;

      // Orders Yesterday
      const { data: ordersYesterday, error: ordersYesterdayError } = await supabase
        .from('shopify_orders' as any)
        .select('order_id, total_price')
        .gte('Order Time', yesterdayStart.toISOString())
        .lt('Order Time', yesterdayEnd.toISOString());

      if (ordersYesterdayError) throw ordersYesterdayError;

      // Pending Orders (not shipped)
      const { data: pendingOrdersData, error: pendingError } = await supabase
        .from('shopify_orders' as any)
        .select('order_id')
        .neq('Order Status', 'Shipped');

      if (pendingError) throw pendingError;

      // Pending Orders Yesterday
      const { data: pendingYesterday, error: pendingYesterdayError } = await supabase
        .from('shopify_orders' as any)
        .select('order_id')
        .neq('Order Status', 'Shipped')
        .gte('Order Time', yesterdayStart.toISOString())
        .lt('Order Time', yesterdayEnd.toISOString());

      if (pendingYesterdayError) throw pendingYesterdayError;

      // Orders Last Week for AOV comparison
      const { data: ordersLastWeek, error: ordersLastWeekError } = await supabase
        .from('shopify_orders' as any)
        .select('order_id, total_price')
        .gte('Order Time', weekAgoStart.toISOString())
        .lt('Order Time', todayStart.toISOString());

      if (ordersLastWeekError) throw ordersLastWeekError;

      // Disputes
      const { data: disputesData, error: disputesError } = await supabase
        .from('shopify_orders' as any)
        .select('order_id')
        .eq('Order Status', 'Dispute');

      if (disputesError) throw disputesError;

      // Disputes Yesterday
      const { data: disputesYesterday, error: disputesYesterdayError } = await supabase
        .from('shopify_orders' as any)
        .select('order_id')
        .eq('Order Status', 'Dispute')
        .gte('Order Time', yesterdayStart.toISOString())
        .lt('Order Time', yesterdayEnd.toISOString());

      if (disputesYesterdayError) throw disputesYesterdayError;

      // Calculate values
      const todayOrderCount = ordersToday?.length || 0;
      const yesterdayOrderCount = ordersYesterday?.length || 0;
      const todayRevenue = ordersToday?.reduce((sum: number, order: any) => sum + (Number(order.total_price) || 0), 0) || 0;
      const yesterdayRevenue = ordersYesterday?.reduce((sum: number, order: any) => sum + (Number(order.total_price) || 0), 0) || 0;
      const lastWeekRevenue = ordersLastWeek?.reduce((sum: number, order: any) => sum + (Number(order.total_price) || 0), 0) || 0;
      const lastWeekOrderCount = ordersLastWeek?.length || 0;

      const todayAOV = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;
      const yesterdayAOV = yesterdayOrderCount > 0 ? yesterdayRevenue / yesterdayOrderCount : 0;
      const lastWeekAOV = lastWeekOrderCount > 0 ? lastWeekRevenue / lastWeekOrderCount : 0;

      // Calculate percentage changes
      const orderChange = yesterdayOrderCount > 0 ? ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100 : 0;
      const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
      const aovDailyChange = yesterdayAOV > 0 ? ((todayAOV - yesterdayAOV) / yesterdayAOV) * 100 : 0;
      const aovWeeklyChange = lastWeekAOV > 0 ? ((todayAOV - lastWeekAOV) / lastWeekAOV) * 100 : 0;
      const pendingChange = (pendingYesterday?.length || 0) > 0 ? 
        (((pendingOrdersData?.length || 0) - (pendingYesterday?.length || 0)) / (pendingYesterday?.length || 0)) * 100 : 0;
      const disputeChange = (disputesYesterday?.length || 0) > 0 ? 
        (((disputesData?.length || 0) - (disputesYesterday?.length || 0)) / (disputesYesterday?.length || 0)) * 100 : 0;

      setKPIs({
        ordersToday: { value: todayOrderCount, change: orderChange, loading: false },
        pendingOrders: { value: pendingOrdersData?.length || 0, change: pendingChange, loading: false },
        revenueToday: { value: todayRevenue, change: revenueChange, loading: false },
        aovToday: { value: todayAOV, changeDaily: aovDailyChange, changeWeekly: aovWeeklyChange, loading: false },
        avgProcessingTime: { value: 0, change: 0, loading: false }, // TODO: Calculate processing time
        disputes: { value: disputesData?.length || 0, change: disputeChange, loading: false }
      });

    } catch (error) {
      console.error('Error fetching KPIs:', error);
      // Set loading to false on error
      setKPIs(prev => ({
        ...prev,
        ordersToday: { ...prev.ordersToday, loading: false },
        pendingOrders: { ...prev.pendingOrders, loading: false },
        revenueToday: { ...prev.revenueToday, loading: false },
        aovToday: { ...prev.aovToday, loading: false },
        avgProcessingTime: { ...prev.avgProcessingTime, loading: false },
        disputes: { ...prev.disputes, loading: false }
      }));
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('shopify_orders' as any)
        .select(`
          order_id, 
          name, 
          email, 
          phone,
          "Order Status", 
          "Order Time", 
          total_price,
          financial_status,
          "Customer Address",
          "Order Note",
          "Feedback Score"
        `)
        .order('Order Time', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedOrders = (data || [])
        .filter((order: any) => {
          // Filter out demo/invalid orders
          return order.order_id && 
                 order.order_id !== '' &&
                 (order.name || order.email) &&
                 order.total_price && 
                 Number(order.total_price) > 0 &&
                 order['Order Time'];
        })
        .map((order: any) => ({
          id: order.order_id,
          customer: order.name || order.email?.split('@')[0] || 'Customer',
          email: order.email || 'N/A',
          phone: order.phone || 'N/A',
          amount: order.total_price ? `₹${Number(order.total_price).toLocaleString()}` : '₹0',
          status: order['Order Status'] || 'pending',
          financialStatus: order.financial_status || 'pending',
          address: order['Customer Address'] || 'N/A',
          note: order['Order Note'] || '',
          feedbackScore: order['Feedback Score'] || 0,
          time: getRelativeTime(order['Order Time']),
          orderTime: order['Order Time']
        }));

      setRecentOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    } finally {
      setRecentOrdersLoading(false);
    }
  };

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    fetchKPIs();
    fetchRecentOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopify_orders'
        },
        () => {
          fetchKPIs();
          fetchRecentOrders();
        }
      )
      .subscribe();

    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchKPIs();
      fetchRecentOrders();
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return {
    kpis,
    recentOrders,
    recentOrdersLoading,
    refetch: () => {
      fetchKPIs();
      fetchRecentOrders();
    }
  };
}