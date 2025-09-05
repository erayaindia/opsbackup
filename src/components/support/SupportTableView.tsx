import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { Eye, Edit, AlertCircle, Clock, CheckCircle, Circle, Flame, Package, Phone, Mail } from "lucide-react";
import type { SupportTicket, TicketStatus, TicketPriority } from "@/hooks/useEnhancedSupportTickets";

interface SupportTableViewProps {
  tickets: SupportTicket[];
  loading: boolean;
  onUpdateTicket: (ticketId: string, updates: Partial<SupportTicket>) => void;
  onViewTicket: (ticket: SupportTicket) => void;
  onBulkUpdate?: (updates: Partial<SupportTicket>) => void;
  selectedTickets?: string[];
  onSelectTickets?: (ticketIds: string[]) => void;
}

export function SupportTableView({ 
  tickets, 
  loading, 
  onUpdateTicket, 
  onViewTicket, 
  onBulkUpdate,
  selectedTickets = [],
  onSelectTickets 
}: SupportTableViewProps) {
  const [editingCell, setEditingCell] = useState<{ ticketId: string; field: string } | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="h-3 w-3" />;
      case 'open': return <Circle className="h-3 w-3" />;
      case 'waiting': return <Clock className="h-3 w-3" />;
      case 'solved': return <CheckCircle className="h-3 w-3" />;
      case 'closed': return <CheckCircle className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'open': return 'default';
      case 'waiting': return 'secondary';
      case 'solved': return 'outline';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Flame className="h-3 w-3" />;
      case 'high': return <AlertCircle className="h-3 w-3" />;
      case 'normal': return <Circle className="h-3 w-3" />;
      case 'low': return <Circle className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    onUpdateTicket(ticketId, { status: newStatus });
    setEditingCell(null);
  };

  const handlePriorityChange = (ticketId: string, newPriority: TicketPriority) => {
    onUpdateTicket(ticketId, { priority: newPriority });
    setEditingCell(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectTickets) return;
    if (checked) {
      onSelectTickets(tickets.map(t => t.id));
    } else {
      onSelectTickets([]);
    }
  };

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (!onSelectTickets) return;
    if (checked) {
      onSelectTickets([...selectedTickets, ticketId]);
    } else {
      onSelectTickets(selectedTickets.filter(id => id !== ticketId));
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return format(date, 'MMM d · h:mm a');
  };

  const formatTimestampFull = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return format(date, 'MMMM d, yyyy h:mm:ss a');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TableRow className="border-b">
            {onSelectTickets && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={tickets.length > 0 && selectedTickets.length === tickets.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all tickets"
                />
              </TableHead>
            )}
            <TableHead className="w-[100px] font-semibold">Ticket ID</TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold">Phone</TableHead>
            <TableHead className="hidden md:table-cell font-semibold">Order ID</TableHead>
            <TableHead className="hidden md:table-cell font-semibold">Channel</TableHead>
            <TableHead className="hidden lg:table-cell font-semibold">Issue Type</TableHead>
            <TableHead className="font-semibold">Summary</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Priority</TableHead>
            <TableHead className="hidden xl:table-cell font-semibold">Created</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onSelectTickets ? 12 : 11} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                  <p>No tickets found.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow 
                key={ticket.id} 
                className="cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/50"
                onClick={() => onViewTicket(ticket)}
              >
                {onSelectTickets && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTickets.includes(ticket.id)}
                      onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                      aria-label={`Select ticket ${ticket.ticket_id || ticket.id?.slice(0, 8)}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-mono text-sm font-medium text-primary">
                  #{ticket.ticket_id || ticket.id?.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-muted">
                        {getInitials(ticket.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{ticket.full_name || '-'}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {ticket.phone ? (
                      <>
                        <Phone className="h-3 w-3" />
                        {ticket.phone}
                      </>
                    ) : '-'}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2 text-sm">
                    {ticket.order_id ? (
                      <>
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-primary">{ticket.order_id}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className="text-xs">
                    {ticket.contact_channel || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant="secondary" className="text-xs">
                    {ticket.issue_type || 'General'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="truncate text-sm">
                    {ticket.summary || ticket.description?.slice(0, 50) + '...' || '-'}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {editingCell?.ticketId === ticket.id && editingCell?.field === 'status' ? (
                    <Select
                      value={ticket.status || 'new'}
                      onValueChange={(value: TicketStatus) => handleStatusChange(ticket.id, value)}
                      onOpenChange={(open) => !open && setEditingCell(null)}
                    >
                      <SelectTrigger className="w-[100px] h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="solved">Solved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={getStatusBadgeVariant(ticket.status || 'new')}
                      className="cursor-pointer flex items-center gap-1 w-fit hover:opacity-80 transition-opacity"
                      onClick={() => setEditingCell({ ticketId: ticket.id, field: 'status' })}
                    >
                      {getStatusIcon(ticket.status || 'new')}
                      <span className="capitalize">{ticket.status || 'new'}</span>
                    </Badge>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {editingCell?.ticketId === ticket.id && editingCell?.field === 'priority' ? (
                    <Select
                      value={ticket.priority || 'normal'}
                      onValueChange={(value: TicketPriority) => handlePriorityChange(ticket.id, value)}
                      onOpenChange={(open) => !open && setEditingCell(null)}
                    >
                      <SelectTrigger className="w-[100px] h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={getPriorityBadgeVariant(ticket.priority || 'normal')}
                      className="cursor-pointer flex items-center gap-1 w-fit hover:opacity-80 transition-opacity"
                      onClick={() => setEditingCell({ ticketId: ticket.id, field: 'priority' })}
                    >
                      {getPriorityIcon(ticket.priority || 'normal')}
                      <span className="capitalize">{ticket.priority || 'normal'}</span>
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                  <span title={formatTimestampFull(ticket.created_at)}>
                    {formatTimestamp(ticket.created_at)}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewTicket(ticket)}
                    className="h-8 w-8 p-0 hover:bg-muted"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}