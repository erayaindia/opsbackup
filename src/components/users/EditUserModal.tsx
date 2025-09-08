import React, { useState, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Building2, 
  Settings, 
  FileText,
  X,
  Save,
  UserCheck
} from 'lucide-react'
import { User as UserType, UpdateUserData, updateUser } from '@/services/usersService'
import { toast } from 'sonner'

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
  { id: 'analytics', label: 'Analytics', description: 'Data analysis and insights' },
  { id: 'training', label: 'Training', description: 'Training and knowledge management' },
  { id: 'alerts', label: 'Alerts', description: 'System notifications and alerts' },
]

const editUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  company_email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  personal_email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  designation: z.string().optional(),
  work_location: z.string().optional(),
  employment_type: z.string().optional(),
  module_access: z.array(z.string()).min(1, 'At least one module must be selected'),
  notes: z.string().optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserType | null
  onUserUpdated: () => void
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ 
  open, 
  onOpenChange, 
  user,
  onUserUpdated 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: '',
      company_email: '',
      role: '',
      department: '',
      personal_email: '',
      phone: '',
      designation: '',
      work_location: 'Patna',
      employment_type: 'Full-time',
      module_access: ['dashboard'],
      notes: '',
    },
  })

  // Reset form when user changes
  useEffect(() => {
    if (user && open) {
      form.reset({
        full_name: user.full_name || '',
        company_email: user.company_email || '',
        role: user.role || '',
        department: user.department || '',
        personal_email: user.personal_email || '',
        phone: user.phone || '',
        designation: user.designation || '',
        work_location: user.work_location || 'Patna',
        employment_type: user.employment_type || 'Full-time',
        module_access: user.module_access || ['dashboard'],
        notes: user.notes || '',
      })
      setActiveTab('basic')
    }
  }, [user, open, form])

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return

    try {
      setIsSubmitting(true)
      
      const updateData: UpdateUserData = {
        full_name: data.full_name,
        company_email: data.company_email,
        role: data.role,
        department: data.department,
        personal_email: data.personal_email || undefined,
        phone: data.phone || undefined,
        designation: data.designation || undefined,
        work_location: data.work_location,
        employment_type: data.employment_type,
        module_access: data.module_access,
        notes: data.notes || undefined,
      }

      const result = await updateUser(user.id, updateData)
      
      if (result.success) {
        toast.success(`User ${data.full_name} updated successfully!`)
        onUserUpdated()
        onOpenChange(false)
      } else {
        toast.error('Failed to update user', {
          description: result.error || 'Unknown error occurred'
        })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              <DialogTitle>Edit User - {user.full_name}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Update user information, permissions, and access control settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="work" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Work Details
                </TabsTrigger>
                <TabsTrigger value="access" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Access Control
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
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
                        <FormLabel>Company Email *</FormLabel>
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
                        <FormLabel>Personal Email</FormLabel>
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Work Details Tab */}
              <TabsContent value="work" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
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
                        <FormLabel>Department *</FormLabel>
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
                            <SelectItem value="Ops">Operations</SelectItem>
                            <SelectItem value="HR">Human Resources</SelectItem>
                            <SelectItem value="IT">Information Technology</SelectItem>
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
                          <Input placeholder="Senior Developer" {...field} />
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
                        <FormLabel>Work Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Patna">Patna</SelectItem>
                            <SelectItem value="Delhi">Delhi</SelectItem>
                            <SelectItem value="Remote">Remote</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
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
                </div>
              </TabsContent>

              {/* Access Control Tab */}
              <TabsContent value="access" className="space-y-4">
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
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about this user..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional notes for internal reference
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}