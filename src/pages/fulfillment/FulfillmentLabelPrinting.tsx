import { FulfillmentHeader } from "@/components/fulfillment/FulfillmentHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Package, Truck, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FulfillmentLabelPrinting() {
  return (
    <div className="h-full">
      <FulfillmentHeader
        title="Label Printing"
        breadcrumbs={[{ label: "Label Printing" }]}
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Labels Printed
                  </p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <Printer className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ready to Print
                  </p>
                  <p className="text-2xl font-bold">89</p>
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
                    Shipped Today
                  </p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <Truck className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Label Templates
                  </p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Label Printing System
            </CardTitle>
            <CardDescription>
              Batch label generation and printing management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-12">
              <Printer className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                The label printing system is under development. You'll be able to generate 
                shipping labels in batches, manage printer settings, and track printing status.
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