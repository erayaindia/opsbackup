import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Eye, Mail, Phone, User, Clock, Tag } from "lucide-react";
import type { SupportTicket } from "@/hooks/useEnhancedSupportTickets";

interface SupportCardViewProps {
  tickets: SupportTicket[];
  loading: boolean;
  onViewTicket: (ticket: SupportTicket) => void;
}

export function SupportCardView({ tickets, loading, onViewTicket }: SupportCardViewProps) {
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

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No tickets found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                #{ticket.ticket_id || ticket.id?.slice(0, 8)}
              </CardTitle>
              <div className="flex gap-1">
                <Badge variant={getStatusBadgeVariant(ticket.status || 'new')} className="text-xs">
                  {ticket.status || 'new'}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(ticket.priority || 'normal')} className="text-xs">
                  {ticket.priority || 'normal'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold leading-tight">
                {ticket.summary || 'No Summary'}
              </h3>
              {ticket.issue_type && (
                <p className="text-sm text-muted-foreground">{ticket.issue_type}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticket.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ticket.description}
              </p>
            )}
            
            <div className="space-y-2">
              {ticket.full_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{ticket.full_name}</span>
                </div>
              )}
              {ticket.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{ticket.email}</span>
                </div>
              )}
              {ticket.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{ticket.phone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {ticket.created_at && formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewTicket(ticket)}
                className="h-8"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}