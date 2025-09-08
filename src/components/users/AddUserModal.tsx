import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  User, 
  Building2, 
  Settings, 
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Sparkles
} from 'lucide-react'
import { createUser, CreateUserData } from '@/services/usersService'
import { toast } from 'sonner'

const userSchema = z.object({
  // Step 1: Basic Info
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  company_email: z.string().email('Invalid email format').refine(
    (email) => email.endsWith('@erayastyle.com'),
    'Must be an @erayastyle.com email'
  ),
  personal_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),

  // Step 2: Work Info
  role: z.enum(['super_admin', 'admin', 'manager', 'employee', 'intern', 'external']),
  department: z.enum(['Content', 'Fulfillment', 'Support', 'Marketing', 'Finance', 'Admin', 'Ops', 'HR', 'IT']),
  designation: z.string().optional(),
  work_location: z.string().default('Patna'),
  employment_type: z.enum(['Full-time', 'Part-time', 'Intern', 'Contractor']).default('Full-time'),
  joined_at: z.string().min(1, 'Joining date is required'),

  // Step 3: Access & Permissions
  module_access: z.array(z.string()).min(1, 'Select at least one module'),

  // Step 4: Additional Info
  notes: z.string().optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: () => void
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Personal and contact details', icon: User, color: 'bg-blue-100 text-blue-700' },
  { id: 2, title: 'Work Details', description: 'Role and department information', icon: Building2, color: 'bg-green-100 text-green-700' },
  { id: 3, title: 'Access Control', description: 'System modules and permissions', icon: Settings, color: 'bg-purple-100 text-purple-700' },
  { id: 4, title: 'Review & Submit', description: 'Review details and create user', icon: Check, color: 'bg-orange-100 text-orange-700' },
]

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard', description: 'View analytics and KPIs', icon: '📊', required: true },
  { id: 'orders', label: 'Orders', description: 'Manage customer orders', icon: '📦' },
  { id: 'fulfillment', label: 'Fulfillment', description: 'Packing and shipping workflow', icon: '🚚' },
  { id: 'support', label: 'Support', description: 'Customer support tickets', icon: '🎧' },
  { id: 'content', label: 'Content', description: 'Content creation and library', icon: '📝' },
  { id: 'marketing', label: 'Marketing', description: 'Campaigns and advertising', icon: '📢' },
  { id: 'products', label: 'Products', description: 'Product and inventory management', icon: '🛍️' },
  { id: 'finance', label: 'Finance', description: 'Financial reports and accounting', icon: '💰' },
  { id: 'management', label: 'Management', description: 'System settings and administration', icon: '⚙️' },
  { id: 'team-hub', label: 'Team Hub', description: 'Team communication and tasks', icon: '👥' },
  { id: 'analytics', label: 'Analytics', description: 'Advanced analytics and reporting', icon: '📈' },
  { id: 'training', label: 'Training', description: 'Training materials and courses', icon: '🎓' },
  { id: 'alerts', label: 'Alerts', description: 'System alerts and notifications', icon: '🔔' },
]

export const AddUserModal: React.FC<AddUserModalProps> = ({ 
  open, 
  onOpenChange, 
  onUserCreated 
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      company_email: '',
      personal_email: '',
      phone: '',
      role: 'employee',
      department: 'Content',
      designation: '',
      work_location: 'Patna',
      employment_type: 'Full-time',
      joined_at: new Date().toISOString().split('T')[0],
      module_access: ['dashboard'],
      notes: '',
    },
  })

  const progress = (currentStep / STEPS.length) * 100

  const nextStep = async () => {
    const stepFields = getStepFields(currentStep)
    const isValid = await form.trigger(stepFields)
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepFields = (step: number): (keyof UserFormData)[] => {
    switch (step) {
      case 1:
        return ['full_name', 'company_email', 'personal_email', 'phone']
      case 2:
        return ['role', 'department', 'designation', 'work_location', 'employment_type', 'joined_at']
      case 3:
        return ['module_access']
      case 4:
        return ['notes']
      default:
        return []
    }
  }

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsSubmitting(true)
      
      const userData: CreateUserData = {
        full_name: data.full_name,
        company_email: data.company_email,
        role: data.role,
        department: data.department,
        joined_at: data.joined_at,
        personal_email: data.personal_email || undefined,
        phone: data.phone || undefined,
        designation: data.designation || undefined,
        work_location: data.work_location,
        employment_type: data.employment_type,
        module_access: data.module_access,
        notes: data.notes || undefined,
      }

      const result = await createUser(userData)
      
      if (result.success) {
        toast.success(`🎉 User ${data.full_name} created successfully!`, {
          description: `Account created with role: ${data.role}`,
          duration: 6000,
        })
        onUserCreated()
        onOpenChange(false)
        form.reset()
        setCurrentStep(1)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      form.reset()
      setCurrentStep(1)
    }
  }

  const getCurrentStep = () => STEPS.find(s => s.id === currentStep)
  const currentStepData = getCurrentStep()

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 space-y-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentStepData?.color || 'bg-gray-100'}`}>
              {currentStepData && <currentStepData.icon className="w-6 h-6" />}
            </div>
            Add New User
          </DialogTitle>
          
          <DialogDescription className="text-base">
            {currentStepData?.description}
          </DialogDescription>

          {/* Enhanced Progress Bar */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              const isNext = currentStep + 1 === step.id
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    isCompleted
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : isCurrent
                      ? `${step.color} border-2 border-current shadow-md scale-105`
                      : isNext
                      ? 'bg-gray-50 text-gray-600 border-2 border-gray-200'
                      : 'bg-gray-50 text-gray-400 border border-gray-100'
                  }`}
                >
                  {isCompleted ? (
                    <div className="flex items-center justify-center w-4 h-4 bg-green-600 rounded-full">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span>{step.title}</span>
                  {isCurrent && <Sparkles className="w-3 h-3 text-current" />}
                </div>
              )
            })}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-4 scroll-smooth scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <Card className="border-0 shadow-none mx-2 mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <User className="w-4 h-4" />
                              Full Name *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Rajesh Kumar" 
                                className="h-11" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="company_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Mail className="w-4 h-4" />
                              Company Email *
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="rajesh.kumar@erayastyle.com" 
                                className="h-11" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Mail className="w-4 h-4" />
                              Personal Email
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="rajesh.kumar@gmail.com" 
                                className="h-11" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Phone className="w-4 h-4" />
                              Phone Number
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+91 98765 43210" 
                                className="h-11" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Work Details */}
              {currentStep === 2 && (
                <Card className="border-0 shadow-none mx-2 mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5" />
                      Work Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Users className="w-4 h-4" />
                              Role *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="super_admin">🔱 Super Admin</SelectItem>
                                <SelectItem value="admin">👑 Admin</SelectItem>
                                <SelectItem value="manager">👨‍💼 Manager</SelectItem>
                                <SelectItem value="employee">👤 Employee</SelectItem>
                                <SelectItem value="intern">🎓 Intern</SelectItem>
                                <SelectItem value="external">🔗 External</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Building2 className="w-4 h-4" />
                              Department *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Content">📝 Content</SelectItem>
                                <SelectItem value="Fulfillment">📦 Fulfillment</SelectItem>
                                <SelectItem value="Support">🎧 Support</SelectItem>
                                <SelectItem value="Marketing">📢 Marketing</SelectItem>
                                <SelectItem value="Finance">💰 Finance</SelectItem>
                                <SelectItem value="Admin">⚙️ Admin</SelectItem>
                                <SelectItem value="Ops">🔧 Operations</SelectItem>
                                <SelectItem value="HR">👥 HR</SelectItem>
                                <SelectItem value="IT">💻 IT</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="designation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Designation</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Content Writer, Senior Developer, Marketing Executive, etc." 
                                className="h-11" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="work_location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <MapPin className="w-4 h-4" />
                              Work Location
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Patna, Delhi, Mumbai, Bangalore, Remote, etc." 
                                className="h-11" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="employment_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Employment Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Full-time">⏰ Full-time</SelectItem>
                                <SelectItem value="Part-time">🕐 Part-time</SelectItem>
                                <SelectItem value="Intern">🎓 Intern</SelectItem>
                                <SelectItem value="Contractor">🤝 Contractor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="joined_at"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              <Calendar className="w-4 h-4" />
                              Joining Date *
                            </FormLabel>
                            <FormControl>
                              <Input type="date" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Access Control */}
              {currentStep === 3 && (
                <Card className="border-0 shadow-none mx-2 mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Settings className="w-5 h-5" />
                      Module Access Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="module_access"
                      render={() => (
                        <FormItem>
                          <FormDescription className="text-base mb-6">
                            Select the modules this user can access. Dashboard is required for all users.
                          </FormDescription>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {AVAILABLE_MODULES.map((module) => (
                              <FormField
                                key={module.id}
                                control={form.control}
                                name="module_access"
                                render={({ field }) => {
                                  const isRequired = module.required || false
                                  const isChecked = field.value?.includes(module.id) || isRequired
                                  
                                  return (
                                    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                                      isChecked 
                                        ? 'ring-2 ring-primary bg-primary/5' 
                                        : 'hover:bg-gray-50/80'
                                    } relative group`}>
                                      <CardContent className="p-4">
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={isChecked}
                                              disabled={isRequired}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  field.onChange([...field.value, module.id])
                                                } else {
                                                  field.onChange(
                                                    field.value?.filter((value) => value !== module.id)
                                                  )
                                                }
                                              }}
                                              className="mt-1"
                                            />
                                          </FormControl>
                                          <div className="flex-1 space-y-1">
                                            <FormLabel className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                                              <span className="text-lg">{module.icon}</span>
                                              {module.label}
                                              {isRequired && (
                                                <Badge variant="secondary" className="text-xs">
                                                  Required
                                                </Badge>
                                              )}
                                            </FormLabel>
                                            <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                                              {module.description}
                                            </p>
                                          </div>
                                        </FormItem>
                                      </CardContent>
                                    </Card>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-6 mx-2 mb-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <Card className="border-0 shadow-none">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="w-5 h-5" />
                            Additional Notes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Any additional information about the user - previous experience, special skills, training requirements, etc..."
                                rows={4}
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional notes about the user or any special considerations.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        </CardContent>
                      </Card>
                    )}
                  />

                  {/* Enhanced Summary */}
                  <Card className="border border-primary/20 shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Check className="w-5 h-5" />
                        User Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Name:</span>
                            <span>{form.watch('full_name')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Email:</span>
                            <span className="text-sm">{form.watch('company_email')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Role:</span>
                            <Badge variant="outline">{form.watch('role')}</Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Department:</span>
                            <span>{form.watch('department')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Location:</span>
                            <span>{form.watch('work_location')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Employment:</span>
                            <span>{form.watch('employment_type')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Module Access:</span>
                          <Badge variant="secondary">{form.watch('module_access')?.length || 0} modules</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {form.watch('module_access')?.map((moduleId) => {
                            const module = AVAILABLE_MODULES.find(m => m.id === moduleId)
                            return module ? (
                              <Badge key={moduleId} variant="outline" className="text-xs">
                                {module.icon} {module.label}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 flex justify-between items-center pt-4">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={isSubmitting}
                    className="h-11"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                  className="h-11"
                >
                  Cancel
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="h-11 min-w-24 bg-primary hover:bg-primary/90"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 min-w-32 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}