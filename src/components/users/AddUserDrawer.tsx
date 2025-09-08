import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Users
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

interface AddUserDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: () => void
}

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name and contact details', icon: User },
  { id: 2, title: 'Work Details', description: 'Role and department', icon: Building2 },
  { id: 3, title: 'Access Control', description: 'Modules and permissions', icon: Settings },
  { id: 4, title: 'Final Details', description: 'Additional information', icon: FileText },
]

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard', description: 'View analytics and KPIs' },
  { id: 'orders', label: 'Orders', description: 'Manage customer orders' },
  { id: 'fulfillment', label: 'Fulfillment', description: 'Packing and shipping workflow' },
  { id: 'support', label: 'Support', description: 'Customer support tickets' },
  { id: 'content', label: 'Content', description: 'Content creation and library' },
  { id: 'marketing', label: 'Marketing', description: 'Campaigns and advertising' },
  { id: 'products', label: 'Products', description: 'Product and inventory management' },
  { id: 'finance', label: 'Finance', description: 'Financial reports and accounting' },
  { id: 'management', label: 'Management', description: 'System settings and administration' },
  { id: 'team-hub', label: 'Team Hub', description: 'Team communication and tasks' },
  { id: 'analytics', label: 'Analytics', description: 'Advanced analytics and reporting' },
  { id: 'training', label: 'Training', description: 'Training materials and courses' },
  { id: 'alerts', label: 'Alerts', description: 'System alerts and notifications' },
]

export const AddUserDrawer: React.FC<AddUserDrawerProps> = ({ 
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
        toast.success(`User ${data.full_name} created successfully!`, {
          description: `Temporary password: ${result.data?.tempPassword}`,
          duration: 10000,
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

  const handleDrawerClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      form.reset()
      setCurrentStep(1)
    }
  }

  const getCurrentStepIcon = () => {
    const step = STEPS.find(s => s.id === currentStep)
    return step ? step.icon : User
  }

  const CurrentIcon = getCurrentStepIcon()

  return (
    <Drawer open={open} onOpenChange={handleDrawerClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <CurrentIcon className="w-5 h-5" />
            Add New User - {STEPS.find(s => s.id === currentStep)?.title}
          </DrawerTitle>
          <DrawerDescription>
            {STEPS.find(s => s.id === currentStep)?.description}
          </DrawerDescription>
          
          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex gap-2 mt-4">
            {STEPS.map((step) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                    isCompleted
                      ? 'bg-green-100 text-green-700'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="font-medium">{step.title}</span>
                </div>
              )
            })}
          </div>
        </DrawerHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6">
            <div className="min-h-[400px] space-y-6">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Full Name *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
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
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Company Email *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="john.doe@erayastyle.com" {...field} />
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
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Personal Email
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="john@gmail.com" {...field} />
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
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+91 9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Work Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Role *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="intern">Intern</SelectItem>
                              <SelectItem value="external">External</SelectItem>
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
                          <FormLabel className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Department *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Content">Content</SelectItem>
                              <SelectItem value="Fulfillment">Fulfillment</SelectItem>
                              <SelectItem value="Support">Support</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Ops">Ops</SelectItem>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
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
                          <FormLabel>Designation</FormLabel>
                          <FormControl>
                            <Input placeholder="Content Writer, HR Manager, etc." {...field} />
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
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Work Location
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Patna, Remote, etc." {...field} />
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
                          <FormLabel>Employment Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Full-time">Full-time</SelectItem>
                              <SelectItem value="Part-time">Part-time</SelectItem>
                              <SelectItem value="Intern">Intern</SelectItem>
                              <SelectItem value="Contractor">Contractor</SelectItem>
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
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Joining Date *
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Access Control */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="module_access"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-base">Module Access Permissions</FormLabel>
                        <FormDescription>
                          Select the modules this user can access. Dashboard is required for all users.
                        </FormDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {AVAILABLE_MODULES.map((module) => (
                            <FormField
                              key={module.id}
                              control={form.control}
                              name="module_access"
                              render={({ field }) => {
                                const isDisabled = module.id === 'dashboard'
                                const isChecked = field.value?.includes(module.id) || isDisabled
                                
                                return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={isChecked}
                                        disabled={isDisabled}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...field.value, module.id])
                                          } else {
                                            field.onChange(
                                              field.value?.filter((value) => value !== module.id)
                                            )
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-sm font-medium">
                                        {module.label}
                                        {isDisabled && (
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            Required
                                          </Badge>
                                        )}
                                      </FormLabel>
                                      <p className="text-xs text-muted-foreground">
                                        {module.description}
                                      </p>
                                    </div>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Additional Info */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional information about the user..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional notes about the user, their role, or any special considerations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Summary */}
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold">User Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><strong>Name:</strong> {form.watch('full_name')}</div>
                      <div><strong>Email:</strong> {form.watch('company_email')}</div>
                      <div><strong>Role:</strong> {form.watch('role')}</div>
                      <div><strong>Department:</strong> {form.watch('department')}</div>
                      <div><strong>Location:</strong> {form.watch('work_location')}</div>
                      <div><strong>Type:</strong> {form.watch('employment_type')}</div>
                    </div>
                    <div>
                      <strong>Modules:</strong> {form.watch('module_access')?.length || 0} selected
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DrawerFooter className="px-0 pt-6">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating User...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                )}

                <DrawerClose asChild>
                  <Button variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  )
}