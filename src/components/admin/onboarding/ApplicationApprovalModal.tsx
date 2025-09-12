import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { OnboardingApplicant, ApprovalFormData } from '@/types/onboarding.types'
import { approvalFormSchema } from '@/schemas/onboarding.schemas'
import { approveOnboardingApplication } from '@/services/onboardingService'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { USER_ROLES, DEPARTMENTS } from '@/types/onboarding.types'
import { UserCheck, AlertTriangle, Key, Mail, User, Building } from 'lucide-react'
import { toast } from 'sonner'

interface ApplicationApprovalModalProps {
  application: OnboardingApplicant
  open: boolean
  onOpenChange: (open: boolean) => void
  onApproved: () => void
}

export function ApplicationApprovalModal({
  application,
  open,
  onOpenChange,
  onApproved
}: ApplicationApprovalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      applicant_id: application.id,
      company_email: '', // Make company email optional
      role: 'employee',
      department: 'Content',
      set_active: false,
      temp_password: '' // Add password field
    }
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form

  const handleApproval = async (data: ApprovalFormData) => {
    setIsSubmitting(true)

    try {
      const response = await approveOnboardingApplication(data)

      if (response.ok && response.data) {
        toast.success('Application approved successfully!')
        
        // Show success details with login email
        toast.success(
          `User account created for ${application.full_name}. Login: ${response.data.login_email} | Password: ${response.data.temp_password}`,
          { duration: 15000 }
        )

        onApproved()
        onOpenChange(false)
      } else {
        throw new Error(response.error?.message || 'Approval failed')
      }
    } catch (error) {
      console.error('Error approving application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateEmailFromName = (fullName: string) => {
    return fullName
      .toLowerCase()
      .trim()
      .replace(/[^a-z\s]/g, '') // Remove non-alphabetic characters except spaces
      .replace(/\s+/g, '.') // Replace spaces with dots
      + '@erayastyle.com'
  }

  // Update email when name changes
  const updateEmailSuggestion = () => {
    const suggestedEmail = generateEmailFromName(application.full_name)
    setValue('company_email', suggestedEmail)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Approve Application - {application.full_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleApproval)} className="space-y-6">
          {/* Applicant Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Applicant Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Full Name:</span>
                  <div className="font-medium">{application.full_name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Personal Email:</span>
                  <div className="font-medium">{application.personal_email}</div>
                </div>
                <div>
                  <span className="text-gray-600">Designation:</span>
                  <div className="font-medium">{application.designation || 'Not specified'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <div className="font-medium">{application.work_location}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Account Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="w-5 h-5" />
                User Account Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Login Email Info */}
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 mt-0.5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-800">Login Email</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        User will login with: <strong>{application.personal_email}</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Using the personal email provided during onboarding
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Email - Optional */}
                <div className="space-y-2">
                  <Label htmlFor="company_email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Company Email (Optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="company_email"
                      type="email"
                      {...register('company_email')}
                      className={errors.company_email ? 'border-red-300' : ''}
                      placeholder="user.name@erayastyle.com (optional)"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={updateEmailSuggestion}
                      size="sm"
                    >
                      Auto-fill
                    </Button>
                  </div>
                  {errors.company_email && (
                    <p className="text-sm text-red-600">{errors.company_email.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Optional company email for internal use. Login will use personal email above.
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">User Role *</Label>
                <Select
                  onValueChange={(value) => setValue('role', value as any)}
                  defaultValue={watch('role')}
                >
                  <SelectTrigger className={errors.role ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  onValueChange={(value) => setValue('department', value as any)}
                  defaultValue={watch('department')}
                >
                  <SelectTrigger className={errors.department ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="temp_password" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Password *
                </Label>
                <Input
                  id="temp_password"
                  type="password"
                  {...register('temp_password')}
                  className={errors.temp_password ? 'border-red-300' : ''}
                  placeholder="Enter password for user"
                />
                {errors.temp_password && (
                  <p className="text-sm text-red-600">{errors.temp_password.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  This password will be used for the user's initial login
                </p>
              </div>

              {/* Set Active */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="set_active"
                  checked={watch('set_active')}
                  onCheckedChange={(checked) => setValue('set_active', checked as boolean)}
                />
                <Label htmlFor="set_active" className="text-sm">
                  Set user as active immediately
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                If unchecked, the user will be created but marked as pending until manually activated
              </p>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-orange-800 space-y-2">
              <div className="flex items-start gap-2">
                <Key className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Temporary Password:</strong> A temporary password will be generated and must be shared with the user securely.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Email Notification:</strong> The user will NOT receive an automated email. You must communicate the login details manually.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Account Linking:</strong> The user account will be automatically linked to this onboarding application.
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Approve & Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}