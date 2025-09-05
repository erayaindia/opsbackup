import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Lock,
  UserCheck,
  Download
} from "lucide-react";

const auditLogs = [
  { id: "LOG-001", user: "Sarah Johnson", action: "Updated order status", resource: "Order #1027", timestamp: "2024-01-15 10:30:45", status: "success" },
  { id: "LOG-002", user: "Mike Chen", action: "Failed login attempt", resource: "User account", timestamp: "2024-01-15 10:25:12", status: "warning" },
  { id: "LOG-003", user: "Emma Wilson", action: "Assigned packing order", resource: "Order #1026", timestamp: "2024-01-15 10:20:33", status: "success" },
  { id: "LOG-004", user: "System", action: "Automatic backup completed", resource: "Database", timestamp: "2024-01-15 03:00:00", status: "success" }
];

export default function Security() {
  const getStatusBadge = (status: string) => {
    const config = {
      success: { variant: "default" as const, icon: CheckCircle, color: "text-success" },
      warning: { variant: "secondary" as const, icon: AlertTriangle, color: "text-warning" },
      error: { variant: "destructive" as const, icon: AlertTriangle, color: "text-destructive" }
    };
    
    const { variant, icon: Icon, color } = config[status as keyof typeof config];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security & Logs</h1>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">98.5%</div>
            <div className="text-sm text-muted-foreground">Security Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">3</div>
            <div className="text-sm text-muted-foreground">Active Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">2</div>
            <div className="text-sm text-muted-foreground">Failed Logins (24h)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-sm text-muted-foreground">Total Log Entries</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Log ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.id}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="text-sm">{log.timestamp}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Access Control Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Role-Based Permissions</h3>
                  <p className="text-sm text-muted-foreground mb-3">Configure access permissions for different user roles</p>
                  <Button variant="outline">Manage Roles</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Session Management</h3>
                  <p className="text-sm text-muted-foreground mb-3">Control user session timeouts and concurrent logins</p>
                  <Button variant="outline">Configure Sessions</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Permission Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { role: "Administrator", permissions: ["All system access", "User management", "System settings"] },
                  { role: "Operations Manager", permissions: ["Orders", "Packing", "Team management", "Analytics"] },
                  { role: "Support Lead", permissions: ["Support tickets", "Chat", "Customer data"] },
                  { role: "Packer", permissions: ["Packing orders", "Chat"] }
                ].map((role, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="font-medium mb-2">{role.role}</div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}