import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Users, Check } from "lucide-react";
import type { TicketStatus, TicketPriority } from "@/hooks/useEnhancedSupportTickets";

interface BulkActionsProps {
  selectedCount: number;
  onBulkUpdate: (updates: { status?: TicketStatus; priority?: TicketPriority }) => void;
  onClearSelection: () => void;
}

export function BulkActions({ selectedCount, onBulkUpdate, onClearSelection }: BulkActionsProps) {
  if (selectedCount === 0) return null;

  const handleStatusChange = (status: TicketStatus) => {
    onBulkUpdate({ status });
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    onBulkUpdate({ priority });
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <Badge variant="secondary">
          {selectedCount} selected
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Bulk Actions:</span>
        
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue placeholder="Set Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Set to New</SelectItem>
            <SelectItem value="open">Set to Open</SelectItem>
            <SelectItem value="waiting">Set to Waiting</SelectItem>
            <SelectItem value="solved">Set to Solved</SelectItem>
            <SelectItem value="closed">Set to Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue placeholder="Set Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Set to Low</SelectItem>
            <SelectItem value="normal">Set to Normal</SelectItem>
            <SelectItem value="high">Set to High</SelectItem>
            <SelectItem value="urgent">Set to Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelection}
        className="ml-auto"
      >
        <X className="h-4 w-4 mr-1" />
        Clear Selection
      </Button>
    </div>
  );
}