import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/dashboard/KPICard";
import { useDashboardKPIs } from "@/hooks/useDashboardKPIs";
import {
  Package,
  Clock,
  CheckCircle,
  IndianRupee,
  Users,
  Search,
  Download,
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
  Sunrise
} from "lucide-react";

export default function Dashboard() {
  const { kpis, recentOrders, recentOrdersLoading } = useDashboardKPIs();

  const getGreeting = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = istTime.getHours();

    if (hour >= 5 && hour < 12) {
      return { text: "Good Morning!", icon: <Sunrise className="h-8 w-8 text-orange-500" /> };
    } else if (hour >= 12 && hour < 17) {
      return { text: "Good Afternoon!", icon: <Sun className="h-8 w-8 text-yellow-500" /> };
    } else if (hour >= 17 && hour < 21) {
      return { text: "Good Evening!", icon: <Sunset className="h-8 w-8 text-orange-600" /> };
    } else {
      return { text: "Good Night!", icon: <Moon className="h-8 w-8 text-blue-400" /> };
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

      {/* Quick Tools Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Employee</label>
              <div className="flex gap-2">
                <Input placeholder="Employee name or ID..." />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Order</label>
              <div className="flex gap-2">
                <Input placeholder="Order number..." />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Data</label>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
              Active Employees
              <Badge variant="secondary" className="ml-auto">8 online</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Sarah Johnson", role: "Packing Lead", status: "online", activity: "Processing Order #1024" },
                { name: "Mike Chen", role: "Support Agent", status: "online", activity: "Handling Ticket #456" },
                { name: "Emma Wilson", role: "Order Manager", status: "online", activity: "Reviewing Orders" },
                { name: "David Smith", role: "Packer", status: "away", activity: "On break" },
                { name: "Lisa Park", role: "Quality Check", status: "online", activity: "Inspecting Items" },
                { name: "Tom Wilson", role: "Dispatcher", status: "online", activity: "Coordinating Shipments" }
              ].map((employee, index) => (
                <div key={index} className="flex items-center justify-between hover:bg-muted/20 rounded-lg p-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${employee.status === 'online' ? 'bg-success' : 'bg-warning'}`} />
                    <div>
                      <div className="font-medium text-sm">{employee.name}</div>
                      <div className="text-xs text-muted-foreground">{employee.role}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground max-w-[120px] truncate">
                    {employee.activity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5" />
              Inventory Alerts
              <Badge variant="destructive" className="ml-auto">3 low</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { product: "iPhone 15 Case", stock: 5, threshold: 10, status: "critical" },
                { product: "Wireless Headphones", stock: 8, threshold: 15, status: "warning" },
                { product: "Phone Charger", stock: 3, threshold: 20, status: "critical" },
                { product: "Screen Protector", stock: 12, threshold: 25, status: "warning" },
                { product: "Bluetooth Speaker", stock: 7, threshold: 10, status: "warning" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between hover:bg-muted/20 rounded-lg p-2 transition-colors">
                  <div>
                    <div className="font-medium text-sm">{item.product}</div>
                    <div className="text-xs text-muted-foreground">
                      Stock: {item.stock} | Threshold: {item.threshold}
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}