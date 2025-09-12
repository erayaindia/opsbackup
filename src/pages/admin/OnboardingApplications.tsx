import { useState, useEffect } from 'react'
import { getOnboardingApplications } from '@/services/onboardingService'
import { OnboardingApplicant } from '@/types/onboarding.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ApplicationsTable } from '@/components/admin/onboarding/ApplicationsTable'
import { ApplicationDetailModal } from '@/components/admin/onboarding/ApplicationDetailModal'
import { ApplicationApprovalModal } from '@/components/admin/onboarding/ApplicationApprovalModal'
import { Users, Search, Filter, UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingApplications() {
  const [applications, setApplications] = useState<OnboardingApplicant[]>([])
  const [filteredApplications, setFilteredApplications] = useState<OnboardingApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedApplication, setSelectedApplication] = useState<OnboardingApplicant | null>(null)
  const [approvalApplication, setApprovalApplication] = useState<OnboardingApplicant | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchQuery, statusFilter])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const data = await getOnboardingApplications()
      setApplications(data)
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load onboarding applications')
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = [...applications]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(app => 
        app.full_name.toLowerCase().includes(query) ||
        app.personal_email.toLowerCase().includes(query) ||
        app.designation?.toLowerCase().includes(query) ||
        app.work_location.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }

  const handleViewApplication = (application: OnboardingApplicant) => {
    setSelectedApplication(application)
    setShowDetailModal(true)
  }

  const handleApproveApplication = (application: OnboardingApplicant) => {
    setApprovalApplication(application)
    setShowApprovalModal(true)
  }

  const handleApplicationApproved = () => {
    // Manually update the applications list to reflect approved status
    setApplications(prevApps => 
      prevApps.map(app => 
        app.id === approvalApplication?.id 
          ? { ...app, status: 'approved' as const }
          : app
      )
    )
    toast.success('Application approved successfully!')
  }

  const getStatusStats = () => {
    const stats = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: applications.length,
      submitted: stats.submitted || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0
    }
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Onboarding Applications</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Onboarding Applications</h1>
        </div>
        <Button 
          onClick={() => window.open('/onboard', '_blank')}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          View Public Form
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Users created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Not approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, designation, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="submitted">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Applications ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600 mb-4">
                {applications.length === 0 
                  ? "No onboarding applications have been submitted yet."
                  : "No applications match your current filters."
                }
              </p>
              {applications.length === 0 && (
                <Button 
                  onClick={() => window.open('/onboard', '_blank')}
                  className="flex items-center gap-2 mx-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  View Public Form
                </Button>
              )}
            </div>
          ) : (
            <ApplicationsTable 
              applications={filteredApplications}
              onViewApplication={handleViewApplication}
              onApproveApplication={handleApproveApplication}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          onApprove={() => {
            setShowDetailModal(false)
            handleApproveApplication(selectedApplication)
          }}
        />
      )}

      {approvalApplication && (
        <ApplicationApprovalModal
          application={approvalApplication}
          open={showApprovalModal}
          onOpenChange={setShowApprovalModal}
          onApproved={handleApplicationApproved}
        />
      )}
    </div>
  )
}