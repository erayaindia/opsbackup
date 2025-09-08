import { OnboardingApplicant } from '@/types/onboarding.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, UserCheck, Calendar, MapPin, Briefcase } from 'lucide-react'
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
  const getStatusBadge = (status: OnboardingApplicant['status']) => {
    const variants = {
      submitted: { variant: 'secondary' as const, color: 'bg-orange-100 text-orange-800' },
      approved: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      withdrawn: { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
    }

    const config = variants[status] || variants.submitted

    return (
      <Badge variant={config.variant} className={config.color}>
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
    <div className="overflow-x-auto">
      <Table>
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
          {applications.map((application) => (
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
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                  
                  {application.status === 'submitted' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onApproveApplication(application)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="w-3 h-3" />
                      Approve
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}