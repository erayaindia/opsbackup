import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  AlertTriangle,
  Star,
  Clock,
  User,
  Mail,
  Phone,
  Package,
  Calendar,
  Send,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { FeedbackComplaint, UpdateFeedbackData } from '@/types/feedback.types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface FeedbackDetailDrawerProps {
  feedback: FeedbackComplaint | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateFeedback?: (id: string, updates: UpdateFeedbackData) => Promise<boolean>
}

export function FeedbackDetailDrawer({
  feedback,
  open,
  onOpenChange,
  onUpdateFeedback
}: FeedbackDetailDrawerProps) {
  const [response, setResponse] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  if (!feedback) return null

  const getTypeIcon = (type: FeedbackComplaint['type']) => {
    switch (type) {
      case 'feedback':
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case 'complaint':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'suggestion':
        return <Star className="h-5 w-5 text-blue-500" />
      case 'inquiry':
        return <MessageSquare className="h-5 w-5 text-gray-500" />
      default:
        return <MessageSquare className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: FeedbackComplaint['status']) => {
    const colors = {
      new: 'bg-blue-50 text-blue-700 border-blue-200',
      in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      resolved: 'bg-green-50 text-green-700 border-green-200',
      closed: 'bg-gray-50 text-gray-700 border-gray-200',
      escalated: 'bg-red-50 text-red-700 border-red-200'
    }

    const labels = {
      new: 'New',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      escalated: 'Escalated'
    }

    return (
      <Badge className={cn('border', colors[status])}>
        {labels[status]}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: FeedbackComplaint['priority']) => {
    const colors = {
      low: 'text-green-600 bg-green-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-orange-600 bg-orange-50',
      urgent: 'text-red-600 bg-red-50'
    }

    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    }

    return (
      <Badge className={cn('border-0', colors[priority])}>
        {labels[priority]}
      </Badge>
    )
  }

  const getRatingStars = (rating?: number) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              'h-4 w-4',
              index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            )}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-2">({rating}/5)</span>
      </div>
    )
  }

  const handleStatusUpdate = async (newStatus: FeedbackComplaint['status']) => {
    if (!onUpdateFeedback) return
    
    setUpdatingStatus(true)
    try {
      await onUpdateFeedback(feedback.id, { status: newStatus })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSendResponse = () => {
    if (!response.trim()) return
    // TODO: Implement response sending
    setResponse('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {getTypeIcon(feedback.type)}
            <SheetTitle className="flex-1">{feedback.subject}</SheetTitle>
          </div>
          <SheetDescription>
            Feedback ID: {feedback.id.substring(0, 8)}...
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={feedback.status}
                onValueChange={handleStatusUpdate}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <div>{getPriorityBadge(feedback.priority)}</div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {feedback.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{feedback.customer_name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {feedback.customer_email}
                  </div>
                </div>
              </div>
              
              {feedback.customer_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {feedback.customer_phone}
                </div>
              )}
              
              {feedback.order_id && (
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    Order: {feedback.order_id}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Feedback Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Feedback Details</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{feedback.category.replace('_', ' ')}</Badge>
                <Badge variant="secondary">{feedback.source.replace('_', ' ')}</Badge>
              </div>
              
              {feedback.rating && (
                <div>
                  {getRatingStars(feedback.rating)}
                </div>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed">{feedback.description}</p>
            </div>

            {feedback.tags && feedback.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Tags:</span>
                {feedback.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Feedback created</div>
                  <div className="text-muted-foreground">
                    {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {feedback.resolved_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Feedback resolved</div>
                    <div className="text-muted-foreground">
                      {formatDistanceToNow(new Date(feedback.resolved_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              )}

              {feedback.escalated_at && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium">Feedback escalated</div>
                    <div className="text-muted-foreground">
                      {formatDistanceToNow(new Date(feedback.escalated_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {feedback.resolution_notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Resolution Notes</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm">{feedback.resolution_notes}</p>
                </div>
              </div>
            </>
          )}

          {feedback.satisfaction_score && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Customer Satisfaction</h4>
                <div className="text-lg font-semibold text-green-600">
                  {feedback.satisfaction_score}/10
                </div>
              </div>
            </>
          )}

          {/* Quick Actions */}
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {feedback.status !== 'resolved' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate('resolved')}
                  disabled={updatingStatus}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
              {feedback.status !== 'escalated' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate('escalated')}
                  disabled={updatingStatus}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Escalate
                </Button>
              )}
            </div>
          </div>

          {/* Response Section */}
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Response</h3>
            <div className="space-y-2">
              <Textarea
                placeholder="Type your response to the customer..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={handleSendResponse}
                  disabled={!response.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}