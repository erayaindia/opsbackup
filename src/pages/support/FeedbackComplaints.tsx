import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  MessageSquare,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  AlertTriangle,
  TrendingUp,
  List,
  RefreshCw,
  Eye,
  Settings,
  Archive,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronDown,
  Save,
  X,
  FilterX,
  Star
} from 'lucide-react'
import { useFeedbackComplaints } from '@/hooks/useFeedbackComplaints'
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

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
    useMockData: true
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
    console.log('Bulk action:', action, 'on items:', selectedIds)
  }

  const handleExport = () => {
    console.log('Exporting feedback data...')
  }

  // Stats calculation similar to inventory page
  const getStats = () => {
    const totalFeedback = feedback.filter(item => item.type === 'feedback').length
    const totalComplaints = feedback.filter(item => item.type === 'complaint').length
    const newItems = feedback.filter(item => item.status === 'new').length
    const inProgress = feedback.filter(item => item.status === 'in_progress').length
    const resolved = feedback.filter(item => item.status === 'resolved').length
    const escalated = feedback.filter(item => item.status === 'escalated').length

    return {
      totalItems: feedback.length,
      totalFeedback,
      totalComplaints,
      newItems,
      inProgress,
      resolved,
      escalated
    }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        {/* Header with sticky search and filters */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="px-4 py-8 pb-6">
            {/* Page Title */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1 max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground leading-tight">Feedback & Complaints</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-muted-foreground">Live tracking enabled</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-2 w-2 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Real-time updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-2 w-2 text-green-600 dark:text-green-400" />
                    </div>
                    <span>Auto-resolution</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Star className="h-2 w-2 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Sentiment analysis</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="px-6 shadow-sm"
                    onClick={refreshFeedback}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="px-6 shadow-sm"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <NewFeedbackModal 
                    onCreateFeedback={createFeedback}
                    trigger={
                      <Button size="default" className="px-6 shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Feedback
                      </Button>
                    }
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Last updated: 2 mins ago</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <span>System online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8 px-4 pb-8">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Items</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalItems}</p>
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+8% vs last month</span>
                  </div>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Feedback</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.totalFeedback}</p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12% vs last month</span>
                  </div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Complaints</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.totalComplaints}</p>
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>-5% vs last month</span>
                  </div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">New Items</p>
                  <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.newItems}</p>
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Clock className="h-3 w-3" />
                    <span>Pending review</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">In Progress</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.inProgress}</p>
                  <div className="flex items-center gap-1 text-sm text-purple-600">
                    <Settings className="h-3 w-3" />
                    <span>Being handled</span>
                  </div>
                </div>
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-xl p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Resolved</p>
                  <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{stats.resolved}</p>
                  <div className="flex items-center gap-1 text-sm text-indigo-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Successfully closed</span>
                  </div>
                </div>
                <Archive className="h-8 w-8 text-indigo-600" />
              </div>
            </Card>
          </div>

          {/* Filters Section */}
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Advanced Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeedbackFiltersComponent 
                filters={filters} 
                onFiltersChange={setFilters} 
              />
            </CardContent>
          </Card>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">
                    {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('resolve')}
                    className="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Resolved
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('escalate')}
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Escalate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedIds([])}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Table/Grid Content */}
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5 text-primary" />
                  Feedback & Complaints ({totalCount})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <FeedbackTable
                feedback={feedback}
                loading={loading}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onViewFeedback={handleViewFeedback}
                onUpdateStatus={handleUpdateStatus}
              />
            </CardContent>
          </Card>
        </div>
      </div>

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