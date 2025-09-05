import { FulfillmentHeader } from "@/components/fulfillment/FulfillmentHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FulfillmentInventorySync() {
  return (
    <div className="h-full">
      <FulfillmentHeader
        title="Inventory Sync"
        breadcrumbs={[{ label: "Inventory Sync" }]}
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Sync
                  </p>
                  <p className="text-2xl font-bold">2h ago</p>
                </div>
                <Database className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sync Status
                  </p>
                  <p className="text-2xl font-bold">Active</p>
                </div>
                <RefreshCw className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Records Updated
                  </p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sync Errors
                  </p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Inventory Synchronization
            </CardTitle>
            <CardDescription>
              Stock updates and inventory synchronization system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                The inventory sync system is in development. You'll be able to automatically 
                sync stock levels, track inventory changes, and manage multi-channel inventory.
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