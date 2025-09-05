import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ExternalLink,
  Copy,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Star,
  FileText,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { ShopifyOrder } from '@/hooks/useShopifyOrders';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrderDetailDrawerProps {
  order: ShopifyOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDrawer({ order, open, onOpenChange }: OrderDetailDrawerProps) {
  const [jsonExpanded, setJsonExpanded] = useState(false);

  if (!order) return null;

  const getStatusBadge = (status: string | null) => {
    const statusConfig = {
      'Packed': { variant: 'secondary' as const, icon: Package, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'Shipped': { variant: 'default' as const, icon: Truck, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'Unfulfilled': { variant: 'outline' as const, icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'Dispute': { variant: 'destructive' as const, icon: AlertTriangle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'outline' as const,
      icon: CheckCircle,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {status || 'Unknown'}
      </Badge>
    );
  };

  const getFinancialStatusBadge = (status: string | null) => {
    const statusConfig = {
      'paid': { variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      'pending': { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'refunded': { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
      'cancelled': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    };
    
    const config = statusConfig[status?.toLowerCase() as keyof typeof statusConfig] || {
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status || 'Unknown'}
      </Badge>
    );
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '-';
    try {
      return format(new Date(dateTime), 'PPP p');
    } catch {
      return dateTime;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const copyRawData = () => {
    if (order.raw) {
      navigator.clipboard.writeText(JSON.stringify(order.raw, null, 2));
      toast.success('Raw data copied to clipboard');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details: {order.order_id}
          </SheetTitle>
          <SheetDescription>
            Complete order information and status
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Order Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Order ID</div>
                  <div className="font-mono text-sm font-medium flex items-center gap-2">
                    {order.order_id}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(order.order_id, 'Order ID')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Order Name</div>
                  <div className="font-medium">{order.name || '-'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Total Price</div>
                  <div className="font-semibold text-lg flex items-center gap-1">
                    <IndianRupee className="h-4 w-4" />
                    {formatPrice(order.total_price)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Order Time</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDateTime(order['Order Time'])}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Order Status</div>
                  {getStatusBadge(order['Order Status'])}
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Financial Status</div>
                  {getFinancialStatusBadge(order.financial_status)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </h3>
              <div className="space-y-4">
                {order.email && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="break-all">{order.email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(order.email!, 'Email')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {order.phone && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{order.phone}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(order.phone!, 'Phone')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {order['Customer Address'] && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Address
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <div className="whitespace-pre-wrap">{order['Customer Address']}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="space-y-4">
                {order['Order Note'] && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Order Note
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <div className="whitespace-pre-wrap">{order['Order Note']}</div>
                    </div>
                  </div>
                )}
                {order.Feedback && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Feedback
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <div className="whitespace-pre-wrap">{order.Feedback}</div>
                    </div>
                  </div>
                )}
                {order['Feedback Score'] && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Feedback Score
                    </div>
                    <div className="font-medium">{order['Feedback Score']}</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Actions</h3>
              <div className="flex flex-wrap gap-2">
                {order['Order URL'] && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(order['Order URL']!, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Order URL
                  </Button>
                )}
                {order.raw && (
                  <Button
                    variant="outline"
                    onClick={copyRawData}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Copy Raw Data
                  </Button>
                )}
              </div>
            </div>

            {/* Raw Data Section */}
            {order.raw && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Raw Data
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setJsonExpanded(!jsonExpanded)}
                    >
                      {jsonExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                  {jsonExpanded && (
                    <div className="bg-muted p-4 rounded-md">
                      <pre className="text-xs whitespace-pre-wrap break-all">
                        {JSON.stringify(order.raw, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}