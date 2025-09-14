import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  Package,
  Clock,
} from "lucide-react";
import { StockMovementWithDetails } from "@/hooks/useInventory";
import InvoiceViewer from "./InvoiceViewer";

interface StockMovementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movements: StockMovementWithDetails[];
  productName?: string;
}

const movementTypeIcons = {
  IN: <TrendingUp className="h-4 w-4 text-green-600" />,
  OUT: <TrendingDown className="h-4 w-4 text-red-600" />,
  ADJUST: <RefreshCw className="h-4 w-4 text-blue-600" />,
  TRANSFER: <ArrowRight className="h-4 w-4 text-orange-600" />,
};

const movementTypeColors = {
  IN: "bg-green-100 text-green-800 border-green-300",
  OUT: "bg-red-100 text-red-800 border-red-300",
  ADJUST: "bg-blue-100 text-blue-800 border-blue-300",
  TRANSFER: "bg-orange-100 text-orange-800 border-orange-300",
};

export default function StockMovementsDialog({
  open,
  onOpenChange,
  movements,
  productName,
}: StockMovementsDialogProps) {
  // Calculate summary statistics
  const summary = {
    totalIn: movements
      .filter(m => m.movement_type === 'IN')
      .reduce((sum, m) => sum + m.qty, 0),
    totalOut: movements
      .filter(m => m.movement_type === 'OUT')
      .reduce((sum, m) => sum + m.qty, 0),
    adjustments: movements
      .filter(m => m.movement_type === 'ADJUST')
      .length,
    transfers: movements
      .filter(m => m.movement_type === 'TRANSFER')
      .length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Movement History
            {productName && <span className="text-muted-foreground">for {productName}</span>}
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Stock In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.totalIn}</div>
              <p className="text-xs text-muted-foreground">Total units received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Stock Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.totalOut}</div>
              <p className="text-xs text-muted-foreground">Total units dispatched</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                Adjustments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.adjustments}</div>
              <p className="text-xs text-muted-foreground">Inventory adjustments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-orange-600" />
                Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.transfers}</div>
              <p className="text-xs text-muted-foreground">Location transfers</p>
            </CardContent>
          </Card>
        </div>

        {/* Movements Table */}
        {movements.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stock movements found</h3>
            <p className="text-muted-foreground">
              No stock movements have been recorded yet.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {format(new Date(movement.occurred_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(movement.occurred_at), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {movement.product_variant.product.name}
                        </div>
                        <div className="text-muted-foreground">
                          SKU: {movement.product_variant.sku}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${movementTypeColors[movement.movement_type as keyof typeof movementTypeColors] || 'bg-gray-100 text-gray-800'} flex items-center gap-1 w-fit`}
                      >
                        {movementTypeIcons[movement.movement_type as keyof typeof movementTypeIcons]}
                        {movement.movement_type_detail.code}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className={`font-medium ${
                        movement.movement_type === 'IN' ? 'text-green-600' :
                        movement.movement_type === 'OUT' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {movement.movement_type === 'IN' ? '+' :
                         movement.movement_type === 'OUT' ? '-' : '±'}
                        {movement.qty}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{movement.warehouse.name}</div>
                        <div className="text-muted-foreground">{movement.warehouse.code}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {movement.reference_type && movement.reference_id ? (
                        <div className="text-sm">
                          <div className="font-medium">{movement.reference_type}</div>
                          <div className="text-muted-foreground">{movement.reference_id}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <InvoiceViewer
                        invoiceUrl={movement.invoice_file_url}
                        fileName={movement.invoice_file_name}
                        fileSize={movement.invoice_file_size}
                        compact={true}
                      />
                    </TableCell>

                    <TableCell>
                      {movement.unit_cost ? (
                        <span className="font-medium">
                          ₹{movement.unit_cost.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {movement.notes ? (
                        <span className="text-sm">{movement.notes}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}