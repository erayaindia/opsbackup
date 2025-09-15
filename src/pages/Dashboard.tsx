import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/dashboard/KPICard";
import { useDashboardKPIs } from "@/hooks/useDashboardKPIs";
import { useInventory } from "@/hooks/useInventory";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEmployeeAttendance } from "@/hooks/useEmployeeAttendance";
import {
  Package,
  Clock,
  CheckCircle,
  IndianRupee,
  Users,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  Activity,
  Bell,
  Timer,
  AlertTriangle,
  PackageSearch,
  Sun,
  Sunset,
  Moon,
  Sunrise,
  UserCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { kpis, recentOrders, recentOrdersLoading } = useDashboardKPIs();
  const { products, alerts, loading: inventoryLoading } = useInventory();
  const { profile } = useUserProfile();
  const { employees, loading: employeesLoading, getOnlineCount, getCheckedInCount, getTotalActiveEmployees } = useEmployeeAttendance();
  const navigate = useNavigate();

  const getGreeting = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = istTime.getHours();

    // Get user's first name for personalization
    const firstName = profile?.employeeDetails?.first_name || profile?.appUser?.full_name?.split(' ')[0] || '';
    const nameText = firstName ? ` ${firstName}` : '';

    if (hour >= 5 && hour < 12) {
      return { text: `Good Morning${nameText}!`, icon: <Sunrise className="h-8 w-8 text-orange-500" /> };
    } else if (hour >= 12 && hour < 17) {
      return { text: `Good Afternoon${nameText}!`, icon: <Sun className="h-8 w-8 text-yellow-500" /> };
    } else if (hour >= 17 && hour < 21) {
      return { text: `Good Evening${nameText}!`, icon: <Sunset className="h-8 w-8 text-orange-600" /> };
    } else {
      return { text: `Good Night${nameText}!`, icon: <Moon className="h-8 w-8 text-blue-400" /> };
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'shipped':
        return 'default';
      case 'packed':
        return 'secondary';
      case 'dispute':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Helper functions for inventory data
  const getInventoryAlerts = () => {
    if (!products.length) return [];
    
    // Get products that are below their minimum stock level
    const lowStockProducts = products
      .filter(product => {
        const stock = product.current_stock || 0;
        const minLevel = product.min_stock_level || 0;
        return stock <= minLevel && minLevel > 0;
      })
      .map(product => ({
        product: product.product?.name || 'Unknown Product',
        stock: product.current_stock || 0,
        threshold: product.min_stock_level || 0,
        status: (product.current_stock || 0) <= (product.min_stock_level || 0) * 0.5 ? 'critical' : 'warning'
      }))
      .sort((a, b) => {
        // Sort critical items first, then by lowest stock
        if (a.status === 'critical' && b.status !== 'critical') return -1;
        if (b.status === 'critical' && a.status !== 'critical') return 1;
        return a.stock - b.stock;
      });

    // Also include active alerts from the alerts array
    const activeAlerts = alerts
      .filter(alert => alert.status === 'active' || alert.status === 'new')
      .map(alert => ({
        product: alert.product_variant?.product?.name || 'Unknown Product',
        stock: alert.current_stock || 0,
        threshold: alert.threshold || 0,
        status: alert.priority === 'high' || alert.priority === 'critical' ? 'critical' : 'warning'
      }));

    // Combine and deduplicate
    const allAlerts = [...lowStockProducts, ...activeAlerts];
    const uniqueAlerts = allAlerts.filter((alert, index, self) => 
      index === self.findIndex(a => a.product === alert.product)
    );

    return uniqueAlerts;
  };

  const getLowStockCount = () => {
    return getInventoryAlerts().length;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold font-poppins bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">
            {getGreeting().text}
            {getGreeting().icon}
          </h1>
          <p className="text-muted-foreground mt-2">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/checkin')}
            variant="outline"
            className="gap-2 hover:shadow-md transition-all border-primary/50 hover:border-primary text-primary hover:bg-primary/5"
          >
            <UserCheck className="h-4 w-4" />
            Check In
          </Button>
          <Button variant="outline" className="gap-2 hover:shadow-md transition-all">
            <Activity className="h-4 w-4" />
            View Analytics
          </Button>
          <Button className="bg-gradient-primary hover:shadow-glow transition-all gap-2">
            <Bell className="h-4 w-4" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Live KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard
          title="Orders Today"
          value={kpis.ordersToday.value}
          change={kpis.ordersToday.change}
          icon={<Package className="h-5 w-5 text-primary" />}
          loading={kpis.ordersToday.loading}
        />
        
        <KPICard
          title="Pending Orders"
          value={kpis.pendingOrders.value}
          change={kpis.pendingOrders.change}
          icon={<Clock className="h-5 w-5 text-warning" />}
          loading={kpis.pendingOrders.loading}
        />
        
        <KPICard
          title="Revenue Today"
          value={kpis.revenueToday.value}
          change={kpis.revenueToday.change}
          icon={<IndianRupee className="h-5 w-5 text-success" />}
          loading={kpis.revenueToday.loading}
          format="currency"
        />
        
        <KPICard
          title="AOV Today"
          value={kpis.aovToday.value}
          change={kpis.aovToday.changeDaily}
          changeLabel="vs yesterday"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          loading={kpis.aovToday.loading}
          format="currency"
        />
        
        <KPICard
          title="Processing Time"
          value={kpis.avgProcessingTime.value}
          change={kpis.avgProcessingTime.change}
          icon={<Timer className="h-5 w-5 text-muted-foreground" />}
          loading={kpis.avgProcessingTime.loading}
          format="time"
          precision={1}
        />
        
        <KPICard
          title="Disputes"
          value={kpis.disputes.value}
          change={kpis.disputes.change}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          loading={kpis.disputes.loading}
        />
      </div>


      {/* Live Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
              <Badge variant="secondary" className="ml-auto">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrdersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.slice(0, 5).map((order, index) => (
                  <div key={index} className="border rounded-md p-2 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-sm">#{order.id}</div>
                      <Badge 
                        variant={getStatusBadgeVariant(order.status)}
                        className="text-xs px-2 py-0"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div>{order.customer}</div>
                      <div className="font-medium text-green-600">{order.amount}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="truncate flex-1 mr-2">{order.email}</div>
                      <div className="flex-shrink-0">{order.time}</div>
                    </div>
                  </div>
                ))}
                
                {recentOrders.length > 5 && (
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/orders'}
                    >
                      View All Orders ({recentOrders.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Status
              <Badge variant="secondary" className="ml-auto">
                {employeesLoading ? '...' : `${getCheckedInCount()}/${getTotalActiveEmployees()} checked in`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-2 h-2 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {employees.slice(0, 8).map((employee) => {
                  // Determine status indicator
                  const getStatusColor = () => {
                    if (employee.status === 'inactive') return 'bg-gray-400';
                    if (!employee.isCheckedIn) return 'bg-red-500';
                    if (employee.attendanceStatus === 'late') return 'bg-orange-500';
                    if (employee.attendanceStatus === 'present') return 'bg-green-500';
                    if (employee.attendanceStatus === 'checked_out') return 'bg-blue-500';
                    return 'bg-gray-400';
                  };

                  const getStatusText = () => {
                    if (employee.status === 'inactive') return 'Inactive';
                    if (!employee.isCheckedIn) return 'Not checked in';
                    if (employee.attendanceStatus === 'late') return 'Late';
                    if (employee.attendanceStatus === 'present') return 'Present';
                    if (employee.attendanceStatus === 'checked_out') return 'Checked out';
                    return 'Unknown';
                  };

                  return (
                    <div key={employee.id} className="flex items-center justify-between hover:bg-muted/20 rounded-lg p-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor()}`}
                          title={getStatusText()}
                        />
                        <div>
                          <div className="font-medium text-sm">{employee.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {employee.designation || 'Employee'}
                            {employee.employee_id && ` • ${employee.employee_id}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground max-w-[120px] truncate text-right">
                        <div className="font-medium">{getStatusText()}</div>
                        {employee.department && (
                          <div className="text-xs">{employee.department}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {employees.length > 8 && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/attendance')}
                    >
                      View All Employees ({employees.length})
                    </Button>
                  </div>
                )}

                {employees.length === 0 && !employeesLoading && (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">No employees found</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5" />
              Inventory Alerts
              <Badge 
                variant={getLowStockCount() > 0 ? "destructive" : "secondary"} 
                className="ml-auto"
              >
                {inventoryLoading ? '...' : `${getLowStockCount()} ${getLowStockCount() === 1 ? 'alert' : 'alerts'}`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {getInventoryAlerts().length > 0 ? (
                  getInventoryAlerts().slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between hover:bg-muted/20 rounded-lg p-2 transition-colors">
                      <div>
                        <div className="font-medium text-sm">{item.product}</div>
                        <div className="text-xs text-muted-foreground">
                          Stock: {item.stock} | Min Level: {item.threshold}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={item.status === 'critical' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {item.status === 'critical' ? 'Critical' : 'Low'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">All inventory levels are healthy</div>
                  </div>
                )}
                {getInventoryAlerts().length > 5 && (
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/inventory'}
                    >
                      View All Alerts ({getInventoryAlerts().length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}