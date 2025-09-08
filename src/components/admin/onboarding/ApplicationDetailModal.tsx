import { OnboardingApplicant } from '@/types/onboarding.types'
import { getDocumentSignedUrl } from '@/services/onboardingService'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar,
  Users,
  FileText,
  Download,
  ExternalLink,
  UserCheck,
  Clock
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useState } from 'react'

interface ApplicationDetailModalProps {
  application: OnboardingApplicant
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: () => void
}

export function ApplicationDetailModal({
  application,
  open,
  onOpenChange,
  onApprove
}: ApplicationDetailModalProps) {
  const [loadingDocument, setLoadingDocument] = useState<string | null>(null)

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
      return format(new Date(dateString), 'PPP at p')
    } catch {
      return 'Invalid date'
    }
  }

  const formatRelativeDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const handleDownloadDocument = async (docPath: string, filename: string) => {
    try {
      setLoadingDocument(docPath)
      const signedUrl = await getDocumentSignedUrl(docPath)
      
      if (signedUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a')
        link.href = signedUrl
        link.download = filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        throw new Error('Failed to get document URL')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
    } finally {
      setLoadingDocument(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {application.full_name}
            </div>
            {getStatusBadge(application.status)}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Personal Email</div>
                      <div className="font-medium">{application.personal_email}</div>
                    </div>
                  </div>
                  
                  {application.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Phone Number</div>
                        <div className="font-medium">{application.phone}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Work Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5" />
                  Work Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Designation</div>
                    <div className="font-medium">{application.designation || 'Not specified'}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Work Location</div>
                      <div className="font-medium">{application.work_location}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Employment Type</div>
                    <div className="font-medium">{application.employment_type}</div>
                  </div>
                  
                  {application.joined_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Joining Date</div>
                        <div className="font-medium">{format(new Date(application.joined_at), 'PPP')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            {(application.addresses?.current || application.addresses?.permanent) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application.addresses.current && (
                    <div>
                      <div className="font-medium mb-2">Current Address</div>
                      <div className="text-sm text-gray-600">
                        {[
                          application.addresses.current.street,
                          application.addresses.current.city,
                          application.addresses.current.state,
                          application.addresses.current.pin
                        ].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {application.addresses.permanent && !application.addresses.same_as_current && (
                    <div>
                      <div className="font-medium mb-2">Permanent Address</div>
                      <div className="text-sm text-gray-600">
                        {[
                          application.addresses.permanent.street,
                          application.addresses.permanent.city,
                          application.addresses.permanent.state,
                          application.addresses.permanent.pin
                        ].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Emergency Contact */}
            {application.emergency?.name && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Name</div>
                      <div className="font-medium">{application.emergency.name}</div>
                    </div>
                    
                    {application.emergency.relationship && (
                      <div>
                        <div className="text-sm text-gray-600">Relationship</div>
                        <div className="font-medium">{application.emergency.relationship}</div>
                      </div>
                    )}
                    
                    {application.emergency.phone && (
                      <div>
                        <div className="text-sm text-gray-600">Phone</div>
                        <div className="font-medium">{application.emergency.phone}</div>
                      </div>
                    )}
                    
                    {application.emergency.email && (
                      <div>
                        <div className="text-sm text-gray-600">Email</div>
                        <div className="font-medium">{application.emergency.email}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {application.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    Documents ({application.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {application.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{doc.type}</div>
                            <div className="text-sm text-gray-600">
                              {doc.filename} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.path, doc.filename)}
                          disabled={loadingDocument === doc.path}
                          className="flex items-center gap-1"
                        >
                          {loadingDocument === doc.path ? (
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {application.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {application.notes}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Submitted</div>
                  <div className="font-medium">{formatDate(application.created_at)}</div>
                  <div className="text-xs text-gray-500">{formatRelativeDate(application.created_at)}</div>
                </div>
                
                {application.updated_at !== application.created_at && (
                  <div>
                    <div className="text-sm text-gray-600">Last Updated</div>
                    <div className="font-medium">{formatDate(application.updated_at)}</div>
                    <div className="text-xs text-gray-500">{formatRelativeDate(application.updated_at)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          
          {application.status === 'submitted' && (
            <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
              <UserCheck className="w-4 h-4 mr-2" />
              Approve Application
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}