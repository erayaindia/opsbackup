import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  User,
  QrCode,
  Search,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  Scan
} from "lucide-react";

const packingOrders = [
  {
    id: "#1027",
    customer: "John Doe",
    items: 3,
    assignedTo: "Sarah Johnson",
    status: "assigned",
    priority: "high",
    estimatedTime: "15 min",
    assignedAt: "10:30 AM"
  },
  {
    id: "#1026",
    customer: "Jane Smith",
    items: 1,
    assignedTo: "Mike Chen",
    status: "in-progress",
    priority: "normal",
    estimatedTime: "8 min",
    assignedAt: "10:15 AM"
  },
  {
    id: "#1025",
    customer: "Bob Wilson",
    items: 2,
    assignedTo: "Emma Wilson",
    status: "completed",
    priority: "normal",
    estimatedTime: "12 min",
    assignedAt: "09:45 AM"
  }
];

const packers = [
  { id: "1", name: "Sarah Johnson", status: "available", currentOrders: 1 },
  { id: "2", name: "Mike Chen", status: "busy", currentOrders: 2 },
  { id: "3", name: "Emma Wilson", status: "available", currentOrders: 0 },
  { id: "4", name: "David Smith", status: "break", currentOrders: 0 }
];

export default function Packing() {
  const [scanMode, setScanMode] = useState(false);
  const [scannedCode, setScannedCode] = useState("");

  const getStatusBadge = (status: string) => {
    const config = {
      assigned: { variant: "outline" as const, icon: Clock, color: "text-warning" },
      "in-progress": { variant: "default" as const, icon: Package, color: "text-primary" },
      completed: { variant: "secondary" as const, icon: CheckCircle, color: "text-success" }
    };
    
    const { variant, icon: Icon, color } = config[status as keyof typeof config];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status.replace("-", " ")}
      </Badge>
    );
  };

  const getPackerStatusBadge = (status: string) => {
    const config = {
      available: { variant: "default" as const, color: "text-success" },
      busy: { variant: "secondary" as const, color: "text-warning" },
      break: { variant: "outline" as const, color: "text-muted-foreground" }
    };
    
    const { variant, color } = config[status as keyof typeof config];
    
    return (
      <Badge variant={variant} className={color}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Packing Management</h1>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Order
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Order to Packer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Order</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select order..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1027">#1027 - John Doe (3 items)</SelectItem>
                      <SelectItem value="1028">#1028 - Mary Johnson (1 item)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign to Packer</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select packer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {packers.filter(p => p.status === "available").map(packer => (
                        <SelectItem key={packer.id} value={packer.id}>
                          {packer.name} (Available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Assign Order</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => setScanMode(!scanMode)}>
            <QrCode className="h-4 w-4 mr-2" />
            {scanMode ? "Exit Scan" : "Scan Mode"}
          </Button>
        </div>
      </div>

      {/* Scan Mode Interface */}
      {scanMode && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Product Scanning Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="scan-input">Scan Barcode/QR Code</Label>
                <Input
                  id="scan-input"
                  placeholder="Scan or enter product code..."
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setScannedCode("")}>Clear</Button>
                <Button>Process Scan</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">5</div>
            <div className="text-sm text-muted-foreground">Orders Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">12</div>
            <div className="text-sm text-muted-foreground">Completed Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">18</div>
            <div className="text-sm text-muted-foreground">Avg. per Hour</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Packers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Active Packers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packers.map((packer) => (
              <Card key={packer.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar>
                      <AvatarFallback>
                        {packer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{packer.name}</div>
                      {getPackerStatusBadge(packer.status)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current orders: {packer.currentOrders}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Packing Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Packing Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Est. Time</TableHead>
                <TableHead>Assigned At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packingOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {order.assignedTo.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {order.assignedTo}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <Badge variant={order.priority === "high" ? "destructive" : "outline"}>
                      {order.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.estimatedTime}</TableCell>
                  <TableCell>{order.assignedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}