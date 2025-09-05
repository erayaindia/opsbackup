import { FulfillmentHeader } from "@/components/fulfillment/FulfillmentHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Package, CheckSquare, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FulfillmentPickLists() {
  return (
    <div className="h-full">
      <FulfillmentHeader
        title="Pick Lists"
        breadcrumbs={[{ label: "Pick Lists" }]}
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Pick Lists
                  </p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Items to Pick
                  </p>
                  <p className="text-2xl font-bold">247</p>
                </div>
                <Package className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Completed Today
                  </p>
                  <p className="text-2xl font-bold">189</p>
                </div>
                <CheckSquare className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Pickers
                  </p>
                  <p className="text-2xl font-bold">6</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Pick Lists Management
            </CardTitle>
            <CardDescription>
              SKU-wise pick sheets and inventory picking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                The pick lists system is in development. You'll be able to generate 
                SKU-based pick sheets, assign to pickers, and track picking progress.
              </p>
              <Badge variant="secondary" className="mt-4">
                In Development
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}