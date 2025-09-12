import React, { useState } from 'react'
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
import {
  MoreHorizontal,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Package,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

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

  const toggleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
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
      <Badge variant={variants[type]} className="text-xs font-medium">
        {labels[type]}
      </Badge>
    )
  }

  const getStatusBadge = (status: FeedbackComplaint['status']) => {
    const variants = {
      new: 'secondary',
      in_progress: 'default',
      resolved: 'default',
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
      <Badge className={cn('border text-xs', colors[status])}>
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
      <Badge className={cn('border-0 text-xs font-medium', colors[priority])}>
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

  const getSortIcon = (field: keyof FeedbackComplaint) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    }
    return <ArrowUpDown className="h-4 w-4 opacity-50" />
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
      <div className="hidden lg:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2 border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 px-6 w-16 border-r border-border/30"></TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 w-80 border-r border-border/30">Feedback</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Customer</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Order ID</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Rating</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Status</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Priority</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Created</TableHead>
              <TableHead className="text-center font-semibold text-foreground py-4 px-6 w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index} className="h-12">
                <TableCell className="py-1 px-3 border-r border-border/30">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="py-1 px-3 border-r border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-1 px-3 border-r border-border/30">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="py-1 px-3 border-r border-border/30">
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="py-1 px-3 border-r border-border/30">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="py-1 px-3 border-r border-border/30">
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="py-1 px-3 border-r border-border/30">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="py-1 px-3 border-r border-border/30">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="py-1 px-3">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
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
      <div className="hidden lg:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2 border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 px-6 w-16">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="rounded border-border/50 text-primary focus:ring-primary/20 focus:ring-2"
                    checked={false}
                    onChange={() => handleSelectAll(false)}
                  />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 w-80 border-r border-border/30">Feedback</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Customer</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Order ID</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Rating</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Status</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Priority</TableHead>
              <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">Created</TableHead>
              <TableHead className="text-center font-semibold text-foreground py-4 px-6 w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center">
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
    <div className="hidden lg:block">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b-2 border-border/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="py-4 px-6 w-16">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  className="rounded border-border/50 text-primary focus:ring-primary/20 focus:ring-2"
                  checked={selectedIds.length === feedback.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground py-4 px-6 w-80 border-r border-border/30">
              <button
                className="flex items-center gap-2 hover:text-primary transition-colors"
                onClick={() => handleSort('subject')}
              >
                Feedback
                {getSortIcon('subject')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">
              <button
                className="flex items-center gap-2 hover:text-primary transition-colors"
                onClick={() => handleSort('customer_name')}
              >
                Customer
                {getSortIcon('customer_name')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">
              <button
                className="flex items-center gap-2 hover:text-primary transition-colors"
                onClick={() => handleSort('order_id')}
              >
                Order ID
                {getSortIcon('order_id')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">
              <button
                className="flex items-center gap-2 hover:text-primary transition-colors"
                onClick={() => handleSort('rating')}
              >
                Rating
                {getSortIcon('rating')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">
              <button
                className="flex items-center gap-2 hover:text-primary transition-colors"
                onClick={() => handleSort('status')}
              >
                Status
                {getSortIcon('status')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">
              <button
                className="flex items-center gap-2 hover:text-primary transition-colors"
                onClick={() => handleSort('priority')}
              >
                Priority
                {getSortIcon('priority')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground py-4 px-6 border-r border-border/30">
              <button
                className="flex items-center gap-2 hover:text-primary transition-colors"
                onClick={() => handleSort('created_at')}
              >
                Created
                {getSortIcon('created_at')}
              </button>
            </TableHead>
            <TableHead className="text-center font-semibold text-foreground py-4 px-6 w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFeedback.map((item, index) => (
            <React.Fragment key={item.id}>
              <TableRow 
                className={`group hover:bg-muted/30 transition-colors border-b last:border-b-0 cursor-pointer h-12 ${
                  selectedIds.includes(item.id) ? 'bg-primary/5 border-primary/20' : 
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                }`}
                onClick={() => toggleExpandRow(item.id)}
              >
                <TableCell className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="rounded border-border/50 text-primary focus:ring-primary/20 focus:ring-2 w-3 h-3"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    />
                  </div>
                </TableCell>
                
                <TableCell className="py-1 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 overflow-hidden border border-muted/20 flex-shrink-0 flex items-center justify-center">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm leading-tight truncate">{item.subject}</div>
                      <div className="flex items-center gap-1 text-xs">
                        {getTypeBadge(item.type)}
                        <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ml-auto ${
                          expandedRows.has(item.id) ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-1 px-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {item.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm leading-tight truncate">{item.customer_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.customer_email}</div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-1 px-3">
                  {item.order_id ? (
                    <Badge variant="outline" className="text-xs">
                      <Package className="h-3 w-3 mr-1" />
                      {item.order_id}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell className="py-1 px-3">
                  {item.rating ? getRatingStars(item.rating) : (
                    <span className="text-xs text-muted-foreground">No rating</span>
                  )}
                </TableCell>

                <TableCell className="py-1 px-3 border-r border-border/30">
                  {getStatusBadge(item.status)}
                </TableCell>

                <TableCell className="py-1 px-3 border-r border-border/30">
                  {getPriorityBadge(item.priority)}
                </TableCell>

                <TableCell className="py-1 px-3 border-r border-border/30">
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </div>
                </TableCell>

                <TableCell className="py-1 px-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                      onClick={() => onViewFeedback?.(item)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {onUpdateStatus && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-900/20"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onUpdateStatus(item.id, 'in_progress')}>
                            <Clock className="h-4 w-4 mr-2" />
                            In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(item.id, 'resolved')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(item.id, 'escalated')}>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Escalate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              
              {/* Expandable Row */}
              {expandedRows.has(item.id) && (
                <TableRow className="border-0">
                  <TableCell colSpan={9} className="py-0">
                    <div className="bg-muted/20 border-t border-border/30 px-6 py-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Feedback Details */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Feedback Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Category:</span> {item.category.replace('_', ' ')}</div>
                            <div><span className="font-medium">Source:</span> {item.source.replace('_', ' ')}</div>
                            <div><span className="font-medium">Sentiment:</span> {item.sentiment || 'N/A'}</div>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-medium">Tags:</span>
                                {item.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-foreground text-sm">Description</h4>
                          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                            {item.description}
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-foreground text-sm">Additional Information</h4>
                          <div className="space-y-2 text-sm">
                            {item.customer_phone && (
                              <div><span className="font-medium">Phone:</span> {item.customer_phone}</div>
                            )}
                            {item.product_sku && (
                              <div><span className="font-medium">Product SKU:</span> {item.product_sku}</div>
                            )}
                            {item.assigned_to && (
                              <div><span className="font-medium">Assigned to:</span> {item.assigned_to}</div>
                            )}
                            {item.resolution_notes && (
                              <div>
                                <span className="font-medium">Resolution:</span>
                                <div className="mt-1 text-muted-foreground bg-green-50 p-2 rounded text-xs">
                                  {item.resolution_notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}