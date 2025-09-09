import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Target,
  ShoppingCart,
  DollarSign,
  Eye,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';

export default function PerformanceInsight() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Performance Insights</h1>
          <p className="text-muted-foreground mt-1">
            Analyze product performance metrics, sales trends, and market insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">₹12.5L</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+18%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">2,847</div>
                <div className="text-sm text-muted-foreground">Units Sold</div>
              </div>
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">4.3%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </div>
              <div className="flex items-center text-red-600">
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-sm font-medium">-2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">4.6</div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm font-medium">+0.2</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search products by name, SKU, or category..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select defaultValue="all-categories">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performing Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { 
                name: "Premium Headphones", 
                sales: "₹2.8L", 
                growth: "+25%", 
                units: "1,240",
                rating: 4.8
              },
              { 
                name: "Gaming Mouse Pro", 
                sales: "₹1.9L", 
                growth: "+18%", 
                units: "890",
                rating: 4.7
              },
              { 
                name: "Wireless Charger", 
                sales: "₹1.2L", 
                growth: "+32%", 
                units: "2,100",
                rating: 4.5
              }
            ].map((product, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{product.name}</div>
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    {product.growth}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Revenue</div>
                    <div className="font-medium">{product.sales}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Units</div>
                    <div className="font-medium">{product.units}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Rating</div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Underperforming Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { 
                name: "Basic Earphones", 
                sales: "₹45K", 
                decline: "-28%", 
                units: "120",
                rating: 3.2,
                issue: "Low ratings"
              },
              { 
                name: "Phone Case v1", 
                sales: "₹32K", 
                decline: "-15%", 
                units: "85",
                rating: 4.1,
                issue: "Poor conversion"
              },
              { 
                name: "Old Model Watch", 
                sales: "₹28K", 
                decline: "-35%", 
                units: "45",
                rating: 3.8,
                issue: "Declining sales"
              }
            ].map((product, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{product.name}</div>
                  <Badge variant="destructive" className="bg-red-100 text-red-700">
                    {product.decline}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                  <div>
                    <div className="text-muted-foreground">Revenue</div>
                    <div className="font-medium">{product.sales}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Units</div>
                    <div className="font-medium">{product.units}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Rating</div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {product.issue}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Analyze
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">↗️ +18%</div>
                <div className="text-sm text-muted-foreground">vs last month</div>
              </div>
              <div className="space-y-2">
                {["Week 1", "Week 2", "Week 3", "Week 4"].map((week, index) => (
                  <div key={week} className="flex items-center justify-between">
                    <span className="text-sm">{week}</span>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${75 + index * 5}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      ₹{(2.5 + index * 0.5).toFixed(1)}L
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Customer Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold">92%</div>
                <div className="text-xs text-muted-foreground">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">68%</div>
                <div className="text-xs text-muted-foreground">Repeat Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">2.3</div>
                <div className="text-xs text-muted-foreground">Avg Orders</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">₹1,850</div>
                <div className="text-xs text-muted-foreground">Avg Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Market Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Market Share</span>
                <span className="font-medium">12.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Competitor Price Gap</span>
                <span className="font-medium text-green-600">-8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Demand Trend</span>
                <Badge variant="default" className="bg-green-100 text-green-700">
                  Rising
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Seasonality</span>
                <span className="font-medium">High Season</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}