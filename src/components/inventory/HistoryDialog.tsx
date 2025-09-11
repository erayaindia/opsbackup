import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Package, User, FileText } from "lucide-react";
import { StockMovementWithDetails } from "@/hooks/useInventory";

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movements: StockMovementWithDetails[];
  loading: boolean;
}

export const HistoryDialog: React.FC<HistoryDialogProps> = ({
  open,
  onOpenChange,
  movements,
  loading,
}) => {
  const getMovementColor = (movementType: string) => {
    switch (movementType.toUpperCase()) {
      case 'IN':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OUT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ADJUST':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TRANSFER':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Inventory Movement History
          </DialogTitle>
          <DialogDescription>
            Complete log of all inventory movements and stock changes
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          <ScrollArea className="h-[60vh] rounded-lg border">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-muted-foreground">Loading movement history...</div>
              </div>
            ) : movements.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No movements found</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="border-r border-border/50">Date & Time</TableHead>
                    <TableHead className="border-r border-border/50">Product</TableHead>
                    <TableHead className="border-r border-border/50">SKU</TableHead>
                    <TableHead className="border-r border-border/50">Movement</TableHead>
                    <TableHead className="border-r border-border/50">Quantity</TableHead>
                    <TableHead className="border-r border-border/50">Warehouse</TableHead>
                    <TableHead className="border-r border-border/50">Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id} className="hover:bg-muted/50 h-14">
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          {formatDateTime(movement.occurred_at)}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="font-medium">
                          {movement.product_variant?.product?.name || 'Unknown Product'}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {movement.product_variant?.sku || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <Badge className={getMovementColor(movement.movement_type_detail?.code || movement.movement_type)}>
                          {movement.movement_type_detail?.code || movement.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <span className={`font-bold ${
                          movement.movement_type_detail?.code === 'IN' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.movement_type_detail?.code === 'IN' ? '+' : '-'}{movement.qty}
                        </span>
                        {movement.unit_cost && (
                          <div className="text-xs text-muted-foreground">
                            @ ₹{movement.unit_cost}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center text-sm">
                          <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                          {movement.warehouse?.name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50">
                        {movement.reference_type && (
                          <div className="text-sm">
                            <div className="font-medium">{movement.reference_type}</div>
                            {movement.reference_id && (
                              <div className="text-muted-foreground text-xs">{movement.reference_id}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.notes && (
                          <div className="text-sm text-muted-foreground max-w-48 truncate" title={movement.notes}>
                            {movement.notes}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};