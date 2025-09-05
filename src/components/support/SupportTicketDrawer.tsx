import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { Save, X, User, Mail, Phone, Calendar, Tag, MessageSquare, Package, Shield, Globe, Monitor } from "lucide-react";
import type { SupportTicket, TicketStatus, TicketPriority } from "@/hooks/useEnhancedSupportTickets";

interface SupportTicketDrawerProps {
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<SupportTicket>) => void;
}

export function SupportTicketDrawer({ ticket, open, onOpenChange, onUpdateTicket }: SupportTicketDrawerProps) {
  const [editData, setEditData] = useState<Partial<SupportTicket>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    if (ticket && Object.keys(editData).length > 0) {
      onUpdateTicket(ticket.id, editData);
      setEditData({});
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };

  const updateField = (field: keyof SupportTicket, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
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

  if (!ticket) return null;

  const currentStatus = editData.status || ticket.status || 'new';
  const currentPriority = editData.priority || ticket.priority || 'normal';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials(ticket.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">
                  {ticket.full_name || 'Unknown Customer'}
                </SheetTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  Ticket #{ticket.ticket_id || ticket.id?.slice(0, 8)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant={getStatusBadgeVariant(currentStatus)} className="flex items-center gap-1">
              {currentStatus}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(currentPriority)} className="flex items-center gap-1">
              {currentPriority}
            </Badge>
            {ticket.is_urgent && (
              <Badge variant="destructive">Urgent</Badge>
            )}
            {ticket.consent_given && (
              <Badge variant="outline" className="text-green-600">
                <Shield className="h-3 w-3 mr-1" />
                Consent Given
              </Badge>
            )}
          </div>
          <Separator />
        </SheetHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editData.full_name || ticket.full_name || ''}
                      onChange={(e) => updateField('full_name', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1 font-medium">{ticket.full_name || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editData.email || ticket.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{ticket.email || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editData.phone || ticket.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{ticket.phone || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Order ID
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editData.order_id || ticket.order_id || ''}
                      onChange={(e) => updateField('order_id', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1 font-mono">{ticket.order_id || '-'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issue Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Issue Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Channel</Label>
                  {isEditing ? (
                    <Input
                      value={editData.contact_channel || ticket.contact_channel || ''}
                      onChange={(e) => updateField('contact_channel', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1">
                      <Badge variant="outline">{ticket.contact_channel || 'Unknown'}</Badge>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Issue Type</Label>
                  {isEditing ? (
                    <Input
                      value={editData.issue_type || ticket.issue_type || ''}
                      onChange={(e) => updateField('issue_type', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1">
                      <Badge variant="secondary">{ticket.issue_type || 'General'}</Badge>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  {isEditing ? (
                    <Select
                      value={currentStatus}
                      onValueChange={(value: TicketStatus) => updateField('status', value)}
                    >
                      <SelectTrigger className="mt-1">
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
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(currentStatus)}>
                        {currentStatus}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  {isEditing ? (
                    <Select
                      value={currentPriority}
                      onValueChange={(value: TicketPriority) => updateField('priority', value)}
                    >
                      <SelectTrigger className="mt-1">
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
                    <div className="mt-1">
                      <Badge variant={getPriorityBadgeVariant(currentPriority)}>
                        {currentPriority}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Summary</Label>
                {isEditing ? (
                  <Input
                    value={editData.summary || ticket.summary || ''}
                    onChange={(e) => updateField('summary', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1 font-medium">{ticket.summary || '-'}</p>
                )}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {ticket.has_attachments && (
                    <Badge variant="outline" className="text-xs">
                      {ticket.attachment_count || 0} attachments
                    </Badge>
                  )}
                  {ticket.consent_given && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Consent given
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editData.description || ticket.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Ticket description..."
                  rows={6}
                  className="min-h-[120px]"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {ticket.description || 'No description provided.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {ticket.created_at && format(new Date(ticket.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ticket.created_at && format(new Date(ticket.created_at), 'h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Updated:</span>
                  <div className="text-right">
                    <div className="font-medium">
                      {ticket.updated_at && formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ticket.updated_at && format(new Date(ticket.updated_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Source:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {ticket.source || 'Unknown'}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Timezone:</span>
                  <span className="ml-2 font-mono text-xs">
                    {ticket.timezone || 'UTC'}
                  </span>
                </div>
                {ticket.user_agent && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">User Agent:</span>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {ticket.user_agent}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}