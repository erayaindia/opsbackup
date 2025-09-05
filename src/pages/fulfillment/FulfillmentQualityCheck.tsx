import { FulfillmentHeader } from "@/components/fulfillment/FulfillmentHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FulfillmentQualityCheck() {
  return (
    <div className="h-full">
      <FulfillmentHeader
        title="Quality Check"
        breadcrumbs={[{ label: "Quality Check" }]}
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Photos Reviewed
                  </p>
                  <p className="text-2xl font-bold">247</p>
                </div>
                <Camera className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="enhanced-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Approved
                  </p>
                  <p className="text-2xl font-bold">231</p>
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
                    Rejected
                  </p>
                  <p className="text-2xl font-bold">9</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
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
                  <p className="text-2xl font-bold">7</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Quality Check System
            </CardTitle>
            <CardDescription>
              Photo and engraving verification for quality control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-12">
              <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                The quality check system is in development. You'll be able to review photos, 
                verify engravings, and approve/reject products before shipping.
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