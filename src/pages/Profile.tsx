import { useState } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building, 
  Users, 
  FileText,
  Download,
  Eye,
  AlertCircle,
  Loader2,
  Edit,
  Shield,
  CreditCard,
  Clock,
  CheckCircle,
  RefreshCw,
  Key,
  Lock
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { DocumentPreview } from '@/components/profile/DocumentPreview'

export default function Profile() {
  const { profile, loading, error, refetch } = useUserProfile()
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Helper function to safely display address
  const formatAddress = (address: any) => {
    if (!address || typeof address !== 'object') return 'N/A'
    const parts = [
      address.street,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'N/A'
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setIsChangingPassword(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Password updated successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      toast.error('Failed to update password')
      console.error('Password update error:', error)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="mb-4">Error loading profile: {error}</p>
              <Button onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { appUser, employeeDetails, profilePicture, documentsWithUrls } = profile

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* No Data Available */}
      {!appUser && !employeeDetails && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Profile Data Found</h3>
              <p className="text-muted-foreground mb-4">
                Your profile information is not available in the system. Please contact your administrator.
              </p>
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Content */}
      {(appUser || employeeDetails) && (
        <>
          {/* Profile Header Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {employeeDetails?.employee_id || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Employee ID</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {appUser?.role || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Role</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {appUser?.department || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Department</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {documentsWithUrls.length}
                </div>
                <div className="text-sm text-muted-foreground">Documents</div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Header with Avatar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="w-24 h-24">
                    <AvatarImage 
                      src={profilePicture?.signedUrl || ""} 
                      alt={appUser?.full_name || employeeDetails?.full_name || "Profile"}
                    />
                    <AvatarFallback className="text-2xl font-bold">
                      {getUserInitials(appUser?.full_name || employeeDetails?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold mb-2">
                    {appUser?.full_name || employeeDetails?.full_name || 'N/A'}
                  </h2>
                  <p className="text-muted-foreground mb-3">
                    {appUser?.designation || employeeDetails?.designation || 'N/A'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {appUser?.role && (
                      <Badge variant="default">{appUser.role}</Badge>
                    )}
                    {appUser?.department && (
                      <Badge variant="secondary">{appUser.department}</Badge>
                    )}
                    {appUser?.work_location && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {appUser.work_location}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="mt-1 font-medium">{appUser?.full_name || employeeDetails?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                      <p className="mt-1 font-medium">{employeeDetails?.employee_id || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Company Email</label>
                      <p className="mt-1 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {appUser?.company_email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Personal Email</label>
                      <p className="mt-1 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {employeeDetails?.personal_email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {employeeDetails?.phone_number || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="mt-1">{employeeDetails?.date_of_birth || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gender</label>
                      <p className="mt-1">{employeeDetails?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                      <p className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {appUser?.joined_at ? new Date(appUser.joined_at).toLocaleDateString() : 
                         employeeDetails?.joining_date ? new Date(employeeDetails.joining_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Employment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Role</label>
                      <div className="mt-1">
                        <Badge variant="default">{appUser?.role || 'N/A'}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Department</label>
                      <div className="mt-1">
                        <Badge variant="secondary">{appUser?.department || 'N/A'}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Designation</label>
                      <p className="mt-1">{appUser?.designation || employeeDetails?.designation || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Work Location</label>
                      <p className="mt-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {appUser?.work_location || employeeDetails?.work_location || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Employment Type</label>
                      <p className="mt-1">{appUser?.employment_type || employeeDetails?.employment_type || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              {employeeDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Current Address</label>
                      <p className="mt-1">{formatAddress(employeeDetails.current_address)}</p>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Permanent Address</label>
                      <p className="mt-1">
                        {employeeDetails.same_as_current ? 'Same as current address' : formatAddress(employeeDetails.permanent_address)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Emergency Contact */}
              {employeeDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="mt-1">{employeeDetails.emergency_contact?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                        <p className="mt-1">{employeeDetails.emergency_contact?.relationship || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="mt-1 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {employeeDetails.emergency_contact?.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="mt-1 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {employeeDetails.emergency_contact?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            newPassword: e.target.value
                          }))}
                          className="pl-10"
                          placeholder="Enter new password"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            confirmPassword: e.target.value
                          }))}
                          className="pl-10"
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* System Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appUser?.module_access && appUser.module_access.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {appUser.module_access.map((module) => (
                        <Badge key={module} variant="outline" className="text-xs">
                          {module}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No system access modules assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Bank Details */}
              {employeeDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Bank Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Holder</label>
                      <p className="mt-1 text-sm">{employeeDetails.bank_details?.account_holder_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bank Name</label>
                      <p className="mt-1 text-sm">{employeeDetails.bank_details?.bank_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">IFSC Code</label>
                      <p className="mt-1 text-sm font-mono">{employeeDetails.bank_details?.ifsc_code || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Number</label>
                      <p className="mt-1 text-sm font-mono">{employeeDetails.bank_details?.account_number || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">UPI ID</label>
                      <p className="mt-1 text-sm">{employeeDetails.bank_details?.upi_id || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents ({documentsWithUrls.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentsWithUrls.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Documents</h3>
                  <p className="text-muted-foreground text-sm">No documents have been uploaded to your profile yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentsWithUrls.map((doc, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{doc.type || 'Unknown'}</h4>
                            <p className="text-xs text-muted-foreground truncate">{doc.filename || 'N/A'}</p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">
                            {doc.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          {doc.signedUrl ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => setSelectedDocument(doc)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(doc.signedUrl, '_blank')}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <div className="text-center w-full py-2">
                              <p className="text-xs text-muted-foreground mb-2">
                                Document not accessible
                              </p>
                              <p className="text-xs text-orange-600">
                                Contact admin to re-upload
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DocumentPreview
          document={selectedDocument}
          open={!!selectedDocument}
          onOpenChange={() => setSelectedDocument(null)}
        />
      )}
    </div>
  )
}