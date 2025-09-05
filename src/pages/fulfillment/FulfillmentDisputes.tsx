import { FulfillmentHeader } from "@/components/fulfillment/FulfillmentHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Users, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FulfillmentDisputes() {
  return (
    <div className="h-full">
      <FulfillmentHeader
        title="Disputes"
        breadcrumbs={[{ label: "Disputes" }]}
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Disputes
                  </p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assigned Cases
                  </p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Resolution Rate
                  </p>
                  <p className="text-2xl font-bold">89%</p>
                </div>
                <TrendingDown className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Disputes Management
            </CardTitle>
            <CardDescription>
              Flag and resolve customer disputes and order issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                The disputes management system is currently under development. 
                You'll be able to flag orders, track resolution status, and manage customer disputes.
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