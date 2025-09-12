import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Plus, 
  Settings, 
  MoreVertical,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useFeedbackComplaints } from '@/hooks/useFeedbackComplaints'
import { FeedbackKPICards } from '@/components/feedback/FeedbackKPICards'
import { FeedbackFiltersComponent } from '@/components/feedback/FeedbackFilters'
import { FeedbackTable } from '@/components/feedback/FeedbackTable'
import { NewFeedbackModal } from '@/components/feedback/NewFeedbackModal'
import { FeedbackDetailDrawer } from '@/components/feedback/FeedbackDetailDrawer'
import type { FeedbackComplaint, FeedbackFilters } from '@/types/feedback.types'

const FeedbackComplaints = () => {
  const [filters, setFilters] = useState<FeedbackFilters>({})
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackComplaint | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const {
    feedback,
    loading,
    totalCount,
    kpis,
    createFeedback,
    updateFeedback,
    refreshFeedback
  } = useFeedbackComplaints({
    filters,
    page: 1,
    pageSize: 50,
    useMockData: true // Using mock data for demo
  })

  const handleViewFeedback = (feedbackItem: FeedbackComplaint) => {
    setSelectedFeedback(feedbackItem)
    setDrawerOpen(true)
  }

  const handleUpdateStatus = async (id: string, status: FeedbackComplaint['status']) => {
    await updateFeedback(id, { status })
    await refreshFeedback()
  }

  const handleBulkAction = async (action: string) => {
    // TODO: Implement bulk actions
    console.log('Bulk action:', action, 'on items:', selectedIds)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting feedback data...')
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feedback & Complaints</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer feedback and handle complaints effectively.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <Badge variant="outline" className="text-sm">
              {totalCount} total items
            </Badge>
            <Badge variant="outline" className="text-sm">
              {feedback.filter(item => item.status === 'new').length} new
            </Badge>
            <Badge variant="outline" className="text-sm">
              {feedback.filter(item => item.status === 'escalated').length} escalated
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshFeedback}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <NewFeedbackModal 
            onCreateFeedback={createFeedback}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Feedback
              </Button>
            }
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                Archive Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
                Delete Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <FeedbackKPICards kpis={kpis} loading={loading} />

      {/* Filters */}
      <FeedbackFiltersComponent 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('resolve')}
              >
                Mark Resolved
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleBulkAction('escalate')}
              >
                Escalate
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Table */}
      <FeedbackTable
        feedback={feedback}
        loading={loading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onViewFeedback={handleViewFeedback}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Feedback Detail Drawer */}
      <FeedbackDetailDrawer
        feedback={selectedFeedback}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdateFeedback={updateFeedback}
      />
    </div>
  )
}

export default FeedbackComplaints