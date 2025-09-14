import React, { useState, useEffect } from "react";
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
  Activity
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface SimpleHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MovementData {
  id: string;
  inventory_detail_id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  occurred_at: string;
  notes?: string;
  reason?: string;
  product_name?: string;
  sku?: string;
  warehouse_location?: string;
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

export default function SimpleHistoryDialog({
  open,
  onOpenChange,
}: SimpleHistoryDialogProps) {
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      // Simple direct query with manual join
      const { data: logs, error: logsError } = await supabase
        .from('inventory_logs')
        .select(`
          id,
          inventory_detail_id,
          movement_type,
          quantity,
          unit_cost,
          occurred_at,
          notes,
          reason
        `)
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      if (!logs || logs.length === 0) {
        setMovements([]);
        return;
      }

      // Get unique inventory detail IDs
      const inventoryIds = [...new Set(logs.map(log => log.inventory_detail_id))];

      // Fetch inventory details
      const { data: inventoryDetails, error: detailsError } = await supabase
        .from('inventory_details')
        .select('id, product_name, sku, warehouse_location')
        .in('id', inventoryIds);

      if (detailsError) throw detailsError;

      // Create lookup map
      const detailsMap = new Map();
      inventoryDetails?.forEach(detail => {
        detailsMap.set(detail.id, detail);
      });

      // Combine data
      const combinedMovements: MovementData[] = logs.map(log => {
        const detail = detailsMap.get(log.inventory_detail_id);
        return {
          ...log,
          product_name: detail?.product_name || `Unknown Product (${log.inventory_detail_id?.substring(0, 8)})`,
          sku: detail?.sku || 'UNKNOWN',
          warehouse_location: detail?.warehouse_location || 'Unknown Warehouse'
        };
      });

      // Group movements by time and inventory_detail_id to handle duplicates
      // Keep the entry with the most information (notes, reason, etc.)
      const movementGroups = new Map();

      combinedMovements.forEach(movement => {
        const timeKey = new Date(movement.occurred_at).getTime();
        const groupKey = `${movement.inventory_detail_id}-${movement.movement_type}-${movement.quantity}-${Math.floor(timeKey / 10000)}`; // Group within 10 seconds

        const existing = movementGroups.get(groupKey);
        if (!existing ||
            (movement.notes && !existing.notes) ||
            (movement.reason && !existing.reason) ||
            (movement.reference_type && !existing.reference_type)) {
          movementGroups.set(groupKey, movement);
        }
      });

      const filteredMovements = Array.from(movementGroups.values())
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

      setMovements(filteredMovements);
    } catch (error) {
      console.error('Error fetching movements:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMovements();
    }
  }, [open]);

  // Calculate summary statistics
  const summary = {
    totalIn: movements
      .filter(m => m.movement_type === 'IN')
      .reduce((sum, m) => sum + m.quantity, 0),
    totalOut: movements
      .filter(m => m.movement_type === 'OUT')
      .reduce((sum, m) => sum + m.quantity, 0),
    adjustments: movements
      .filter(m => m.movement_type === 'ADJUST')
      .length,
    transfers: movements
      .filter(m => m.movement_type === 'TRANSFER')
      .length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Inventory Movement History
            <span className="text-muted-foreground">({movements.length} movements)</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
            <p>Loading movement history...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="rounded-none">
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

              <Card className="rounded-none">
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

              <Card className="rounded-none">
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

              <Card className="rounded-none">
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
                <h3 className="text-lg font-semibold mb-2">No movements found</h3>
                <p className="text-muted-foreground">
                  No stock movements have been recorded yet.
                </p>
              </div>
            ) : (
              <div className="border rounded-none overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Reference</TableHead>
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
                              {movement.product_name}
                            </div>
                            <div className="text-muted-foreground">
                              SKU: {movement.sku}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${movementTypeColors[movement.movement_type as keyof typeof movementTypeColors] || 'bg-gray-100 text-gray-800'} flex items-center gap-1 w-fit rounded-none`}
                          >
                            {movementTypeIcons[movement.movement_type as keyof typeof movementTypeIcons]}
                            {movement.movement_type}
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
                            {movement.quantity}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{movement.warehouse_location}</div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {movement.reference_type ? (
                            <div className="text-sm">
                              <div className="font-medium capitalize">{movement.reference_type.replace('_', ' ')}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {movement.notes || movement.reason ? (
                            <span className="text-sm">{movement.notes || movement.reason}</span>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}