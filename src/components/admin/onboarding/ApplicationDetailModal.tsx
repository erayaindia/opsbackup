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
  Clock,
  CreditCard,
  Shield,
  Eye,
  Image as ImageIcon
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useState, useEffect } from 'react'

interface ApplicationDetailModalProps {
  application: OnboardingApplicant
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: () => void
}

// Enhanced Document Preview Card Component
function DocumentPreviewCard({ 
  doc, 
  loadingDocument, 
  onPreview, 
  onDownload, 
  formatRelativeDate, 
  getDocumentIcon 
}: {
  doc: any
  loadingDocument: string | null
  onPreview: (path: string, filename: string, signedUrl?: string) => void
  onDownload: (path: string, filename: string) => void
  formatRelativeDate: (date: string) => string
  getDocumentIcon: (mimeType: string) => JSX.Element
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showInlinePreview, setShowInlinePreview] = useState(false)

  const isImage = doc.mime_type?.startsWith('image/')

  useEffect(() => {
    if (isImage && doc.signed_url && showInlinePreview) {
      setPreviewUrl(doc.signed_url)
    }
  }, [isImage, doc.signed_url, showInlinePreview])

  const handleTogglePreview = async () => {
    if (!isImage) {
      onPreview(doc.path, doc.filename, doc.signed_url)
      return
    }

    if (!showInlinePreview) {
      setShowInlinePreview(true)
      if (!previewUrl && doc.signed_url) {
        setPreviewUrl(doc.signed_url)
      } else if (!previewUrl) {
        // Generate signed URL for preview
        try {
          const { getDocumentSignedUrl } = await import('@/services/onboardingService')
          const signedUrl = await getDocumentSignedUrl(doc.path)
          if (signedUrl) {
            setPreviewUrl(signedUrl)
          }
        } catch (error) {
          console.error('Error loading image preview:', error)
          onPreview(doc.path, doc.filename, doc.signed_url)
        }
      }
    } else {
      setShowInlinePreview(false)
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            {getDocumentIcon(doc.mime_type)}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{doc.type}</div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{doc.filename}</span>
              <span className="mx-2">•</span>
              <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
              <span className="mx-2">•</span>
              <span>{doc.mime_type}</span>
            </div>
            {doc.uploaded_at && (
              <div className="text-xs text-gray-500 mt-1">
                Uploaded {formatRelativeDate(doc.uploaded_at)}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Preview Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePreview}
            disabled={loadingDocument === doc.path}
            className="flex items-center gap-1"
          >
            {loadingDocument === doc.path ? (
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
            {isImage && showInlinePreview ? 'Hide' : 'Preview'}
          </Button>
          
          {/* Download Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(doc.path, doc.filename)}
            disabled={loadingDocument === doc.path}
            className="flex items-center gap-1"
          >
            {loadingDocument === doc.path ? (
              <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            Download
          </Button>
        </div>
      </div>

      {/* Inline Image Preview */}
      {isImage && showInlinePreview && (
        <div className="mt-4 border-t pt-4">
          {previewUrl ? (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt={doc.filename}
                className="max-w-full max-h-96 rounded-lg shadow-md object-contain bg-white"
                onError={() => {
                  console.error('Failed to load image preview')
                  setPreviewUrl(null)
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm">Loading preview...</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ApplicationDetailModal({
  application,
  open,
  onOpenChange,
  onApprove
}: ApplicationDetailModalProps) {
  const [loadingDocument, setLoadingDocument] = useState<string | null>(null)
  
  // Debug: Log application data when modal opens
  useState(() => {
    if (open) {
      console.log('🏢 Application loaded:', application)
      console.log('📄 Documents:', application.documents)
    }
  })

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

  const handlePreviewDocument = async (docPath: string, filename: string, existingSignedUrl?: string) => {
    try {
      setLoadingDocument(docPath)
      console.log('🔍 Previewing document:', { docPath, filename, existingSignedUrl })
      
      // Use existing signed URL if available and not expired
      if (existingSignedUrl && isSignedUrlValid(existingSignedUrl)) {
        console.log('✅ Using existing signed URL')
        window.open(existingSignedUrl, '_blank')
        return
      }
      
      // Generate new signed URL
      console.log('🔄 Generating new signed URL...')
      const signedUrl = await getDocumentSignedUrl(docPath)
      console.log('🔗 Got signed URL:', signedUrl)
      
      if (signedUrl) {
        console.log('✅ Opening document in new tab')
        window.open(signedUrl, '_blank')
      } else {
        console.error('❌ No signed URL returned for document:', docPath)
        alert(`Failed to get document URL for: ${filename}\nPath: ${docPath}\n\nThe document might not be available in storage.`)
      }
    } catch (error) {
      console.error('💥 Error previewing document:', error)
      alert(`Error previewing document: ${filename}\n\n${error.message || error}`)
    } finally {
      setLoadingDocument(null)
    }
  }

  const isSignedUrlValid = (signedUrl: string): boolean => {
    try {
      const url = new URL(signedUrl)
      const exp = url.searchParams.get('exp')
      if (exp) {
        const expiryTime = parseInt(exp) * 1000 // Convert to milliseconds
        const now = Date.now()
        return expiryTime > now + 60000 // Valid if expires more than 1 minute from now
      }
      return false
    } catch {
      return false
    }
  }

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-blue-600" />
    }
    return <FileText className="w-4 h-4 text-blue-600" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {application.full_name}
            </div>
            {getStatusBadge(application.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
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

                  {/* Date of Birth */}
                  {application.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Date of Birth</div>
                        <div className="font-medium">{format(new Date(application.date_of_birth), 'PPP')}</div>
                      </div>
                    </div>
                  )}

                  {/* Gender */}
                  {application.gender && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">Gender</div>
                        <div className="font-medium">{application.gender}</div>
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

            {/* Bank Details */}
            {application.bank_details && Object.keys(application.bank_details).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="w-5 h-5" />
                    Bank Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {application.bank_details.account_holder_name && (
                      <div>
                        <div className="text-sm text-gray-600">Account Holder Name</div>
                        <div className="font-medium">{application.bank_details.account_holder_name}</div>
                      </div>
                    )}
                    
                    {application.bank_details.bank_name && (
                      <div>
                        <div className="text-sm text-gray-600">Bank Name</div>
                        <div className="font-medium">{application.bank_details.bank_name}</div>
                      </div>
                    )}
                    
                    {application.bank_details.account_number && (
                      <div>
                        <div className="text-sm text-gray-600">Account Number</div>
                        <div className="font-medium font-mono">{application.bank_details.account_number}</div>
                      </div>
                    )}
                    
                    {application.bank_details.ifsc_code && (
                      <div>
                        <div className="text-sm text-gray-600">IFSC Code</div>
                        <div className="font-medium font-mono">{application.bank_details.ifsc_code}</div>
                      </div>
                    )}
                    
                    {application.bank_details.branch_name && (
                      <div>
                        <div className="text-sm text-gray-600">Branch Name</div>
                        <div className="font-medium">{application.bank_details.branch_name}</div>
                      </div>
                    )}
                    
                    {application.bank_details.upi_id && (
                      <div>
                        <div className="text-sm text-gray-600">UPI ID</div>
                        <div className="font-medium font-mono">{application.bank_details.upi_id}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legal Agreements */}
            {(application.nda_accepted !== undefined || application.data_privacy_accepted !== undefined) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5" />
                    Legal Agreements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {application.nda_accepted !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">NDA Agreement</div>
                          <div className="font-medium">
                            {application.nda_accepted ? 'Accepted' : 'Not Accepted'}
                          </div>
                          {application.nda_accepted_at && (
                            <div className="text-xs text-gray-500">
                              {formatDate(application.nda_accepted_at)}
                            </div>
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${application.nda_accepted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    )}
                    
                    {application.data_privacy_accepted !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Data Privacy Policy</div>
                          <div className="font-medium">
                            {application.data_privacy_accepted ? 'Accepted' : 'Not Accepted'}
                          </div>
                          {application.data_privacy_accepted_at && (
                            <div className="text-xs text-gray-500">
                              {formatDate(application.data_privacy_accepted_at)}
                            </div>
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${application.data_privacy_accepted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    )}
                  </div>
                  
                  {(application.nda_accepted === false || application.data_privacy_accepted === false) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                      <div className="w-4 h-4 text-red-600 mt-0.5">⚠️</div>
                      <div className="text-sm text-red-800">
                        <strong>Warning:</strong> One or more legal agreements have not been accepted.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Documents ({(() => {
                    if (!application.documents || typeof application.documents !== 'object') return 0
                    let count = 0
                    Object.values(application.documents).forEach(value => {
                      if (Array.isArray(value)) {
                        count += value.filter(doc => doc && doc.path).length
                      } else if (value && typeof value === 'object' && value.path) {
                        count += 1
                      }
                    })
                    return count
                  })()})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Convert documents object to array for display
                  const documentEntries = []
                  
                  if (application.documents && typeof application.documents === 'object') {
                    // Handle object format like { pan: {...}, aadhaarFront: {...}, education: [...] }
                    Object.entries(application.documents).forEach(([key, value]) => {
                      if (value && typeof value === 'object') {
                        if (Array.isArray(value)) {
                          // Handle arrays like education: [...]
                          value.forEach((doc, idx) => {
                            if (doc && doc.path) {
                              documentEntries.push({
                                ...doc,
                                type: key.charAt(0).toUpperCase() + key.slice(1) + (value.length > 1 ? ` ${idx + 1}` : ''),
                                originalKey: key
                              })
                            }
                          })
                        } else if (value.path) {
                          // Handle single objects like pan: {...}
                          documentEntries.push({
                            ...value,
                            type: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
                            originalKey: key
                          })
                        }
                      }
                    })
                  } else if (Array.isArray(application.documents)) {
                    // Handle array format (legacy)
                    documentEntries.push(...application.documents)
                  }
                  
                  return documentEntries.length > 0 ? (
                    <div className="space-y-4">
                      {documentEntries.map((doc, index) => (
                      <DocumentPreviewCard 
                        key={index} 
                        doc={doc} 
                        loadingDocument={loadingDocument}
                        onPreview={handlePreviewDocument}
                        onDownload={handleDownloadDocument}
                        formatRelativeDate={formatRelativeDate}
                        getDocumentIcon={getDocumentIcon}
                      />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <div className="font-medium">No Documents Uploaded</div>
                      <div className="text-sm mt-1">This applicant hasn't uploaded any documents yet.</div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

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
        </div>

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