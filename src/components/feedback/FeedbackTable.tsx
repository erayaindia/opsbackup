import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MoreHorizontal,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Package,
  Calendar
} from 'lucide-react'
import type { FeedbackComplaint } from '@/types/feedback.types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface FeedbackTableProps {
  feedback: FeedbackComplaint[]
  loading?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  onViewFeedback?: (feedback: FeedbackComplaint) => void
  onUpdateStatus?: (id: string, status: FeedbackComplaint['status']) => void
  onUpdatePriority?: (id: string, priority: FeedbackComplaint['priority']) => void
}

export function FeedbackTable({
  feedback,
  loading,
  selectedIds = [],
  onSelectionChange,
  onViewFeedback,
  onUpdateStatus,
  onUpdatePriority
}: FeedbackTableProps) {
  const [sortField, setSortField] = useState<keyof FeedbackComplaint>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: keyof FeedbackComplaint) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(feedback.map(item => item.id))
    } else {
      onSelectionChange?.([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedIds, id])
    } else {
      onSelectionChange?.(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const getTypeIcon = (type: FeedbackComplaint['type']) => {
    switch (type) {
      case 'feedback':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'complaint':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'suggestion':
        return <Star className="h-4 w-4 text-blue-500" />
      case 'inquiry':
        return <MessageSquare className="h-4 w-4 text-gray-500" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: FeedbackComplaint['type']) => {
    const variants = {
      feedback: 'default',
      complaint: 'destructive',
      suggestion: 'secondary',
      inquiry: 'outline'
    } as const

    const labels = {
      feedback: 'Feedback',
      complaint: 'Complaint',
      suggestion: 'Suggestion',
      inquiry: 'Inquiry'
    }

    return (
      <Badge variant={variants[type]} className="flex items-center gap-1">
        {getTypeIcon(type)}
        {labels[type]}
      </Badge>
    )
  }

  const getStatusBadge = (status: FeedbackComplaint['status']) => {
    const variants = {
      new: 'secondary',
      in_progress: 'default',
      resolved: 'success',
      closed: 'outline',
      escalated: 'destructive'
    } as const

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
              'h-3 w-3',
              index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating})</span>
      </div>
    )
  }

  const sortedFeedback = [...feedback].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1
    
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return sortDirection === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (feedback.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={false}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    No feedback found matching your criteria
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === feedback.length}
                indeterminate={selectedIds.length > 0 && selectedIds.length < feedback.length}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-foreground"
              onClick={() => handleSort('type')}
            >
              Type
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-foreground"
              onClick={() => handleSort('subject')}
            >
              Subject
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead 
              className="cursor-pointer hover:text-foreground"
              onClick={() => handleSort('status')}
            >
              Status
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-foreground"
              onClick={() => handleSort('priority')}
            >
              Priority
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-foreground"
              onClick={() => handleSort('created_at')}
            >
              Created
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFeedback.map((item) => (
            <TableRow 
              key={item.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onViewFeedback?.(item)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                />
              </TableCell>
              <TableCell>
                {getTypeBadge(item.type)}
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="space-y-1">
                  <div className="font-medium truncate">{item.subject}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {item.description}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.order_id && (
                      <Badge variant="outline" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {item.order_id}
                      </Badge>
                    )}
                    {item.rating && getRatingStars(item.rating)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {item.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{item.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.customer_email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(item.status)}
              </TableCell>
              <TableCell>
                {getPriorityBadge(item.priority)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewFeedback?.(item)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {onUpdateStatus && (
                      <>
                        <DropdownMenuItem onClick={() => onUpdateStatus(item.id, 'in_progress')}>
                          <Clock className="h-4 w-4 mr-2" />
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(item.id, 'resolved')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(item.id, 'escalated')}>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Escalate
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}