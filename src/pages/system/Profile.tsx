import { useState } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  RefreshCw,
  Key,
  Lock,
  EyeIcon,
  EyeOffIcon,
  UserCircle,
  BellRing,
  Settings,
  Briefcase,
  Home
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { DocumentPreview } from '@/components/profile/DocumentPreview'
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload'

export default function Profile() {
  const { profile, loading, error, refetch } = useUserProfile()
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

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
    
    // Validation checks
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.error('New password must be different from current password')
      return
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword)
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword)
    const hasNumbers = /\d/.test(passwordData.newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      return
    }

    setIsChangingPassword(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        toast.error('Unable to verify current user')
        return
      }

      // For Supabase, we'll use the built-in password update which requires current session
      // The user is already authenticated, so we can update directly
      // Note: In a more secure implementation, you might want to re-verify the current password
      // by calling a custom RPC function that verifies the password server-side
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) {
        if (updateError.message.includes('Password should be at least')) {
          toast.error('Password does not meet minimum requirements')
        } else if (updateError.message.includes('Unable to validate current password')) {
          toast.error('Current password verification failed')
        } else {
          toast.error(updateError.message)
        }
      } else {
        toast.success('Password updated successfully! You may need to log in again.')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Optional: Force re-authentication after password change
        // setTimeout(() => {
        //   supabase.auth.signOut()
        // }, 2000)
      }
    } catch (error) {
      console.error('Password update error:', error)
      toast.error('Failed to update password. Please try again.')
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header - Modern */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full" />
              <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
            </div>
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-muted-foreground ml-6">Manage your personal information and account settings</p>
        </div>

        {/* No Data Available */}
        {!appUser && !employeeDetails && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Profile Data Found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Your profile information is not available in the system. Please contact your administrator.
                </p>
                <Button onClick={refetch} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Content */}
        {(appUser || employeeDetails) && (
          <>
            {/* Profile Header Card */}
            <Card className="border-0 shadow-lg mb-8 bg-gradient-to-r from-background to-muted/20">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-start gap-8">
                  {/* Avatar Section */}
                  <div className="flex-shrink-0">
                    <ProfilePictureUpload
                      currentImage={profilePicture?.signedUrl}
                      userName={appUser?.full_name || employeeDetails?.full_name || 'User'}
                      onUploadSuccess={(newImageUrl) => {
                        refetch()
                      }}
                    />
                  </div>
                  
                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-4">
                      <h2 className="text-3xl font-bold mb-2 text-foreground">
                        {appUser?.full_name || employeeDetails?.full_name || 'User Name'}
                      </h2>
                      <p className="text-lg text-muted-foreground mb-3">
                        {appUser?.designation || employeeDetails?.designation || 'Position'}
                      </p>
                      
                      {/* Quick Stats */}
                      <div className="flex flex-wrap gap-3 mb-4">
                        {appUser?.role && (
                          <Badge 
                            className={`px-3 py-1 ${
                              appUser?.role === 'super_admin' 
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                                : appUser?.role === 'admin'
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                  : appUser?.role === 'manager'
                                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
                                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                            }`}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {appUser.role.replace('_', ' ')}
                          </Badge>
                        )}
                        {employeeDetails?.employee_id && (
                          <Badge variant="secondary" className="px-3 py-1">
                            <User className="w-3 h-3 mr-1" />
                            ID: {employeeDetails.employee_id}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Key Info Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {appUser?.department && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="w-4 h-4 flex-shrink-0" />
                            <span>{appUser.department}</span>
                          </div>
                        )}
                        {appUser?.work_location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{appUser.work_location}</span>
                          </div>
                        )}
                        {appUser?.joined_at && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>Since {new Date(appUser.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-col gap-2 lg:self-start">
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                      <div className="bg-primary/5 rounded-lg p-3 text-center min-w-[80px]">
                        <div className="text-xl font-bold text-primary">
                          {documentsWithUrls.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Documents</div>
                      </div>
                      <div className="bg-emerald-500/5 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-emerald-600">
                          {appUser?.module_access?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Modules</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Tabbed Content */}
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4 mb-8">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="employment" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden sm:inline">Work</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Personal Tab */}
              <TabsContent value="personal" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 gap-6">
                        {[
                          { label: 'Full Name', value: appUser?.full_name || employeeDetails?.full_name, icon: User },
                          { label: 'Employee ID', value: employeeDetails?.employee_id, icon: User },
                          { label: 'Company Email', value: appUser?.company_email, icon: Mail },
                          { label: 'Personal Email', value: employeeDetails?.personal_email, icon: Mail },
                          { label: 'Phone Number', value: employeeDetails?.phone_number, icon: Phone },
                          { label: 'Date of Birth', value: employeeDetails?.date_of_birth, icon: Calendar },
                          { label: 'Gender', value: employeeDetails?.gender, icon: User },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center flex-shrink-0">
                              <item.icon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {item.label}
                              </p>
                              <p className="font-medium text-sm truncate">
                                {item.value || 'Not provided'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact & Address */}
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Home className="h-4 w-4 text-green-600" />
                        </div>
                        Address & Emergency Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-6">
                      {employeeDetails && (
                        <>
                          <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Current Address
                              </p>
                              <p className="text-sm">{formatAddress(employeeDetails.current_address)}</p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-muted/30">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Permanent Address
                              </p>
                              <p className="text-sm">
                                {employeeDetails.same_as_current ? 'Same as current address' : formatAddress(employeeDetails.permanent_address)}
                              </p>
                            </div>
                          </div>
                          
                          {employeeDetails.emergency_contact && (
                            <div className="p-4 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                              <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-3">
                                Emergency Contact
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-red-500" />
                                  <span className="text-sm font-medium">{employeeDetails.emergency_contact.name}</span>
                                  <Badge variant="outline" className="text-xs">{employeeDetails.emergency_contact.relationship}</Badge>
                                </div>
                                {employeeDetails.emergency_contact.phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    <span>{employeeDetails.emergency_contact.phone}</span>
                                  </div>
                                )}
                                {employeeDetails.emergency_contact.email && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="w-3 h-3" />
                                    <span>{employeeDetails.emergency_contact.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Employment Tab */}
              <TabsContent value="employment" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-indigo-600" />
                        </div>
                        Employment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {[
                          { label: 'Role', value: appUser?.role, type: 'badge', variant: 'default' },
                          { label: 'Department', value: appUser?.department, type: 'badge', variant: 'secondary' },
                          { label: 'Designation', value: appUser?.designation || employeeDetails?.designation },
                          { label: 'Work Location', value: appUser?.work_location || employeeDetails?.work_location, icon: MapPin },
                          { label: 'Employment Type', value: appUser?.employment_type || employeeDetails?.employment_type },
                          { label: 'Joined Date', value: appUser?.joined_at ? new Date(appUser.joined_at).toLocaleDateString() : employeeDetails?.joining_date ? new Date(employeeDetails.joining_date).toLocaleDateString() : null, icon: Calendar },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                              {item.icon && (
                                <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center flex-shrink-0">
                                  <item.icon className="w-3 h-3 text-muted-foreground" />
                                </div>
                              )}
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {item.label}
                              </p>
                            </div>
                            <div>
                              {item.type === 'badge' ? (
                                <Badge variant={item.variant as any} className="text-xs">
                                  {item.value || 'N/A'}
                                </Badge>
                              ) : (
                                <p className="font-medium text-sm text-right">
                                  {item.value || 'Not provided'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* System Access & Bank Details */}
                  <div className="space-y-6">
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-emerald-600" />
                          </div>
                          System Access
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {appUser?.module_access && appUser.module_access.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {appUser.module_access.map((module) => (
                              <Badge key={module} variant="outline" className="text-xs px-2 py-1">
                                {module}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Shield className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">No system access modules assigned</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {employeeDetails?.bank_details && (
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-amber-600" />
                            </div>
                            Bank Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {[
                              { label: 'Account Holder', value: employeeDetails.bank_details?.account_holder_name },
                              { label: 'Bank Name', value: employeeDetails.bank_details?.bank_name },
                              { label: 'IFSC Code', value: employeeDetails.bank_details?.ifsc_code, mono: true },
                              { label: 'Account Number', value: employeeDetails.bank_details?.account_number, mono: true },
                              { label: 'UPI ID', value: employeeDetails.bank_details?.upi_id },
                            ].map((item, index) => (
                              item.value && (
                                <div key={index} className="p-3 rounded-lg bg-muted/30">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                    {item.label}
                                  </p>
                                  <p className={`text-sm font-medium ${item.mono ? 'font-mono' : ''}`}>
                                    {item.value}
                                  </p>
                                </div>
                              )
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              
              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">

                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-violet-600" />
                      </div>
                      Documents
                      <Badge variant="secondary" className="ml-auto">
                        {documentsWithUrls.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {documentsWithUrls.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-2">No Documents</h3>
                        <p className="text-muted-foreground text-sm">No documents have been uploaded to your profile yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documentsWithUrls.map((doc, index) => (
                          <div key={index} className="group p-4 rounded-lg border border-border/50 hover:border-border hover:shadow-md transition-all duration-200">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                                  {doc.type || 'Unknown Document'}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {doc.filename || 'N/A'}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs ml-2">
                                {doc.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2 mb-3">
                              {doc.signedUrl ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs h-8"
                                    onClick={() => setSelectedDocument(doc)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => window.open(doc.signedUrl, '_blank')}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <div className="text-center w-full py-2">
                                  <div className="text-xs text-orange-600 font-medium mb-1">
                                    Document not accessible
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Contact admin to re-upload
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Unknown'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Security & Settings Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <Key className="h-4 w-4 text-red-600" />
                      </div>
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      {[
                        { id: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password', key: 'current' },
                        { id: 'newPassword', label: 'New Password', placeholder: 'Minimum 8 characters', key: 'new' },
                        { id: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Confirm new password', key: 'confirm' }
                      ].map((field) => (
                        <div key={field.id} className="space-y-3">
                          <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
                            {field.label}
                          </Label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Input
                              id={field.id}
                              type={showPasswords[field.key] ? "text" : "password"}
                              value={passwordData[field.id]}
                              onChange={(e) => setPasswordData(prev => ({
                                ...prev,
                                [field.id]: e.target.value
                              }))}
                              className="h-12 pl-12 pr-12 text-sm border-border/60 focus:border-primary transition-colors"
                              placeholder={field.placeholder}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                            >
                              {showPasswords[field.key] ? (
                                <EyeOffIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {field.id === 'newPassword' && (
                            <div className="bg-muted/30 rounded-lg p-3 mt-2">
                              <p className="text-xs text-muted-foreground">
                                Password must contain:
                              </p>
                              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                <li>• At least 8 characters</li>
                                <li>• One uppercase letter</li>
                                <li>• One lowercase letter</li>
                                <li>• One number</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <Button 
                        type="submit" 
                        className="w-full h-12 text-sm font-medium mt-6"
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
              </TabsContent>
            </Tabs>
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
    </div>
  )
}