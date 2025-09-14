import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings as SettingsIcon,
  Building,
  Zap,
  Bell,
  Shield,
  Database,
  Truck,
  CreditCard
} from "lucide-react";
import { SecureInput } from "@/components/SecureInput";
import { shopifyIntegrationSchema, courierIntegrationSchema } from "@/lib/validations";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateApiKey = (value: string, type: 'shopify' | 'courier') => {
    try {
      if (type === 'shopify') {
        shopifyIntegrationSchema.shape.apiKey.parse(value);
      } else {
        courierIntegrationSchema.shape.apiKey.parse(value);
      }
      return true;
    } catch {
      return false;
    }
  };

  const validateShopifyStore = (value: string) => {
    try {
      shopifyIntegrationSchema.shape.storeUrl.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveSettings = (section: string) => {
    toast({
      title: "Settings saved",
      description: `${section} settings have been updated successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="Eraya Operations" />
                </div>
                <div>
                  <Label htmlFor="company-email">Company Email</Label>
                  <Input id="company-email" type="email" defaultValue="ops@eraya.com" />
                </div>
                <div>
                  <Label htmlFor="company-phone">Phone Number</Label>
                  <Input id="company-phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc-5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                      <SelectItem value="utc-7">Mountain Time (UTC-7)</SelectItem>
                      <SelectItem value="utc-6">Central Time (UTC-6)</SelectItem>
                      <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="address">Company Address</Label>
                <Textarea id="address" defaultValue="123 Business Ave, Suite 100&#10;Business City, BC 12345" />
              </div>
              <Button onClick={() => handleSaveSettings("Company")}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Default Order Priority</Label>
                  <p className="text-sm text-muted-foreground">Default priority for new orders</p>
                </div>
                <Select defaultValue="normal">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-assign Orders</Label>
                  <p className="text-sm text-muted-foreground">Automatically assign orders to available packers</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Barcode Scanning</Label>
                  <p className="text-sm text-muted-foreground">Allow barcode/QR scanning for inventory</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button onClick={() => handleSaveSettings("System")}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                API Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shopify Integration */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Shopify</h3>
                      <p className="text-sm text-muted-foreground">E-commerce platform integration</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="shopify-store">Store URL</Label>
                    <Input 
                      id="shopify-store" 
                      placeholder="your-store.myshopify.com"
                      onChange={(e) => {
                        const isValid = validateShopifyStore(e.target.value);
                        if (!isValid && e.target.value.length > 0) {
                          setFormErrors(prev => ({ ...prev, shopifyStore: "Invalid Shopify store URL format" }));
                        } else {
                          setFormErrors(prev => ({ ...prev, shopifyStore: "" }));
                        }
                      }}
                    />
                    {formErrors.shopifyStore && (
                      <p className="text-sm text-destructive mt-1">{formErrors.shopifyStore}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="shopify-key">API Key</Label>
                    <SecureInput 
                      id="shopify-key" 
                      isApiKey
                      placeholder="Enter Shopify API key"
                      onValidate={(value) => validateApiKey(value, 'shopify')}
                      validationMessage="API key must be 32-256 characters with valid format"
                    />
                  </div>
                  <Button variant="outline">Test Connection</Button>
                </div>
              </div>

              {/* Shipping Courier Integration */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                      <Truck className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Shipping Couriers</h3>
                      <p className="text-sm text-muted-foreground">FedEx, UPS, DHL integration</p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Primary Courier</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select courier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fedex">FedEx</SelectItem>
                        <SelectItem value="ups">UPS</SelectItem>
                        <SelectItem value="dhl">DHL</SelectItem>
                        <SelectItem value="usps">USPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="courier-key">API Credentials</Label>
                    <SecureInput 
                      id="courier-key" 
                      isApiKey
                      placeholder="Enter courier API credentials"
                      onValidate={(value) => validateApiKey(value, 'courier')}
                      validationMessage="API credentials must be 16-256 characters"
                    />
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Order Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified when new orders arrive</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Status Updates</Label>
                    <p className="text-sm text-muted-foreground">Notifications for order status changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Support Ticket Alerts</Label>
                    <p className="text-sm text-muted-foreground">New support tickets and updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Maintenance</Label>
                    <p className="text-sm text-muted-foreground">Scheduled maintenance notifications</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Reports</Label>
                    <p className="text-sm text-muted-foreground">End-of-day summary reports</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button onClick={() => handleSaveSettings("Notification")}>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all user accounts</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Select defaultValue="60">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all system activities</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch />
                </div>
              </div>
              <Button onClick={() => handleSaveSettings("Security")}>Update Security Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}