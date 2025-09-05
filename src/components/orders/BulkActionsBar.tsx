import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Truck,
  AlertTriangle,
  X,
  CheckCircle
} from 'lucide-react';
import { OrderStatus } from '@/hooks/useShopifyOrders';
import { toast } from 'sonner';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkStatusUpdate: (status: OrderStatus) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActionsBar({ 
  selectedCount, 
  onBulkStatusUpdate, 
  onClearSelection 
}: BulkActionsBarProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');

  const handleBulkUpdate = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    setIsUpdating(true);
    try {
      await onBulkStatusUpdate(selectedStatus as OrderStatus);
      setSelectedStatus('');
      toast.success(`Updated ${selectedCount} orders to ${selectedStatus}`);
    } catch (error) {
      toast.error('Failed to update orders');
    } finally {
      setIsUpdating(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-20 bg-background border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {selectedCount} selected
          </Badge>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Update status to:</span>
            <Select 
              value={selectedStatus} 
              onValueChange={(value: string) => setSelectedStatus(value as OrderStatus | '')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Packed">
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    Packed
                  </div>
                </SelectItem>
                <SelectItem value="Shipped">
                  <div className="flex items-center gap-2">
                    <Truck className="h-3 w-3" />
                    Shipped
                  </div>
                </SelectItem>
                <SelectItem value="Unfulfilled">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    Unfulfilled
                  </div>
                </SelectItem>
                <SelectItem value="Dispute">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    Dispute
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleBulkUpdate} 
              disabled={!selectedStatus || isUpdating}
              size="sm"
            >
              {isUpdating ? 'Updating...' : 'Apply'}
            </Button>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Clear Selection
        </Button>
      </div>
    </div>
  );
}