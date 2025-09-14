import { OnboardingApplicant } from '@/types/onboarding.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  BaseTable,
  TableHeader as SharedTableHeader,
  TablePagination,
  TableFilters,
  TableExport,
  useTableState,
  type FilterOption,
  type ExportColumn
} from '@/components/shared/tables'
import { Eye, UserCheck, Calendar, MapPin, Briefcase, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ApplicationsTableProps {
  applications: OnboardingApplicant[]
  onViewApplication: (application: OnboardingApplicant) => void
  onApproveApplication: (application: OnboardingApplicant) => void
}

export function ApplicationsTable({
  applications,
  onViewApplication,
  onApproveApplication
}: ApplicationsTableProps) {
  // Define filter options and export columns
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'withdrawn', label: 'Withdrawn' }
      ],
      placeholder: 'Filter by status'
    }
  ];

  const exportColumns: ExportColumn[] = [
    { key: 'full_name', header: 'Full Name' },
    { key: 'personal_email', header: 'Email' },
    { key: 'designation', header: 'Position' },
    { key: 'work_location', header: 'Location' },
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Submitted', transform: (value) => formatDistanceToNow(new Date(value), { addSuffix: true }) }
  ];

  const tableState = useTableState({
    data: applications,
    defaultSortField: 'created_at',
    defaultSortDirection: 'desc',
    searchFields: ['full_name', 'personal_email', 'designation', 'work_location'],
    filterConfig: {
      status: { field: 'status' }
    }
  });
  const getStatusBadge = (status: OnboardingApplicant['status']) => {
    const variants = {
      submitted: { variant: 'secondary' as const, color: 'bg-orange-100 text-orange-800' },
      approved: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      withdrawn: { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
    }

    const config = variants[status] || variants.submitted

    return (
      <Badge variant={config.variant} className={`${config.color} rounded-none`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className="space-y-0">
      <TableFilters
        searchTerm={tableState.searchTerm}
        onSearchChange={tableState.setSearchTerm}
        searchPlaceholder="Search applications by name, email, position..."
        filterOptions={filterOptions}
        filters={tableState.filters}
        onFilterChange={tableState.setFilter}
        onClearFilters={tableState.clearFilters}
        className="rounded-none"
      />

      <div className="flex items-center justify-between p-4 bg-muted/20 border-b border-border/50">
        <TableExport
          data={tableState.filteredData}
          columns={exportColumns}
          filename={`applications_${new Date().toISOString().split('T')[0]}.csv`}
          className="rounded-none"
        />
        <div className="text-sm text-muted-foreground">
          Showing {tableState.startIndex}-{tableState.endIndex} of {tableState.filteredData.length} applications
        </div>
      </div>

      <BaseTable className="rounded-none border-t-0">
        <TableHeader>
          <TableRow>
            <TableHead>Applicant</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableState.paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                  <p>No applications found matching your criteria</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            tableState.paginatedData.map((application) => (
            <TableRow key={application.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{application.full_name}</div>
                  <div className="text-sm text-gray-600">{application.personal_email}</div>
                  {application.phone && (
                    <div className="text-xs text-gray-500">{application.phone}</div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="font-medium">
                      {application.designation || 'Not specified'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {application.employment_type}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{application.work_location}</span>
                </div>
              </TableCell>
              
              <TableCell>
                {getStatusBadge(application.status)}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{formatDate(application.created_at)}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  <span className="font-medium">{application.documents.length}</span>
                  <span className="text-gray-600"> files</span>
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewApplication(application)}
                    className="flex items-center gap-1 rounded-none"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                  
                  {application.status === 'submitted' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onApproveApplication(application)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 rounded-none"
                    >
                      <UserCheck className="w-3 h-3" />
                      Approve
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
          )}
        </TableBody>
      </BaseTable>

      <TablePagination
        currentPage={tableState.currentPage}
        totalPages={tableState.totalPages}
        itemsPerPage={tableState.itemsPerPage}
        totalItems={tableState.filteredData.length}
        onPageChange={tableState.setCurrentPage}
        onItemsPerPageChange={tableState.setItemsPerPage}
        startIndex={tableState.startIndex}
        endIndex={tableState.endIndex}
        className="rounded-none border-t-0"
      />
    </div>
  )
}