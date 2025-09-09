import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Plus, TrendingUp, Clock, Package, AlertTriangle } from 'lucide-react';

export default function Lifecycle() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Lifecycle Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage product lifecycle stages from concept to retirement
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-muted-foreground">Development</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">45</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">8</div>
            <div className="text-sm text-muted-foreground">Declining</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">3</div>
            <div className="text-sm text-muted-foreground">Discontinued</div>
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
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Development Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Development Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Smart Watch Pro", progress: 75, daysLeft: 15 },
              { name: "Wireless Earbuds V2", progress: 45, daysLeft: 28 },
              { name: "Fitness Tracker Lite", progress: 90, daysLeft: 5 }
            ].map((product, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{product.name}</div>
                  <Badge variant="outline" className="text-blue-600">
                    {product.progress}%
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${product.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {product.daysLeft} days to launch
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Premium Headphones", sales: "₹2.5L", growth: "+15%" },
              { name: "Gaming Mouse", sales: "₹1.8L", growth: "+8%" },
              { name: "Smartphone Case", sales: "₹95K", growth: "+22%" }
            ].map((product, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{product.name}</div>
                  <Badge variant="default" className="bg-green-100 text-green-700">
                    {product.growth}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Monthly Sales: {product.sales}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Declining Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Declining Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Old Model Phone", sales: "₹45K", decline: "-25%" },
              { name: "Basic Earphones", sales: "₹32K", decline: "-18%" }
            ].map((product, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{product.name}</div>
                  <Badge variant="destructive" className="bg-yellow-100 text-yellow-700">
                    {product.decline}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Monthly Sales: {product.sales}
                </div>
                <div className="mt-2">
                  <Button variant="outline" size="sm">
                    Review Strategy
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Discontinued Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-red-600" />
              Discontinued Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Legacy Tablet", discontinuedDate: "2024-01-15" },
              { name: "Old Smartwatch", discontinuedDate: "2023-12-20" }
            ].map((product, index) => (
              <div key={index} className="border rounded-lg p-3 opacity-75">
                <div className="font-medium text-muted-foreground">{product.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Discontinued: {new Date(product.discontinuedDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}