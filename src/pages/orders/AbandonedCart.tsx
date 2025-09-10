import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Clock, 
  Mail, 
  Phone, 
  Search,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";

export default function AbandonedCart() {
  const abandonedCarts = [
    {
      id: "AC001",
      customerName: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+91 9876543210",
      cartValue: "₹2,450",
      items: 3,
      abandonedAt: "2 hours ago",
      lastActivity: "Added iPhone case to cart",
      status: "Recent"
    },
    {
      id: "AC002", 
      customerName: "Mike Chen",
      email: "mike@example.com",
      phone: "+91 9876543211",
      cartValue: "₹1,890",
      items: 2,
      abandonedAt: "1 day ago",
      lastActivity: "Viewed checkout page",
      status: "Pending"
    },
    {
      id: "AC003",
      customerName: "Emma Wilson", 
      email: "emma@example.com",
      phone: "+91 9876543212",
      cartValue: "₹3,200",
      items: 5,
      abandonedAt: "3 days ago",
      lastActivity: "Applied discount code",
      status: "Stale"
    },
    {
      id: "AC004",
      customerName: "David Smith",
      email: "david@example.com", 
      phone: "+91 9876543213",
      cartValue: "₹850",
      items: 1,
      abandonedAt: "5 hours ago",
      lastActivity: "Added wireless headphones",
      status: "Recent"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Recent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Recent</Badge>;
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'Stale':
        return <Badge variant="destructive">Stale</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Abandoned Carts</h1>
          <p className="text-muted-foreground">
            Recover lost sales by following up with customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Abandoned</p>
                <p className="text-2xl font-bold">247</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Recent (24h)</p>
                <p className="text-2xl font-bold">23</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Recovery Rate</p>
                <p className="text-2xl font-bold">12%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-r from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">₹</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lost Revenue</p>
                <p className="text-2xl font-bold">₹1.2L</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by customer name, email, or cart ID..."
                className="max-w-md"
              />
            </div>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Abandoned Carts List */}
      <Card>
        <CardHeader>
          <CardTitle>Abandoned Carts ({abandonedCarts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {abandonedCarts.map((cart) => (
              <div
                key={cart.id}
                className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">#{cart.id}</div>
                    {getStatusBadge(cart.status)}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{cart.cartValue}</div>
                    <div className="text-sm text-muted-foreground">
                      {cart.items} items
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="font-medium">{cart.customerName}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {cart.email}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {cart.phone}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Abandoned:</span> {cart.abandonedAt}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Last Activity:</span> {cart.lastActivity}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Customer
                  </Button>
                  <Button size="sm" variant="outline">
                    View Cart Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}