import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData, WORK_LOCATIONS, EMPLOYMENT_TYPES } from '@/types/onboarding.types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Briefcase, MapPin, Clock, Calendar } from 'lucide-react'

interface WorkDetailsStepProps {
  form: UseFormReturn<OnboardingFormData>
}

export function WorkDetailsStep({ form }: WorkDetailsStepProps) {
  const { register, watch, setValue, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <Card className="bg-green-50/50 border-green-200">
        <CardContent className="p-4">
          <p className="text-sm text-green-800">
            <span className="font-medium">Work Information:</span> Please provide your employment details. 
            Some fields may be filled in by HR during the approval process.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Designation */}
        <div className="space-y-2">
          <Label htmlFor="designation" className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="w-4 h-4" />
            Job Title / Designation
          </Label>
          <Input
            id="designation"
            type="text"
            placeholder="e.g., Software Engineer, Content Writer, Marketing Executive"
            {...register('designation')}
            className={errors.designation ? 'border-red-300 focus:ring-red-500' : ''}
          />
          {errors.designation && (
            <p className="text-sm text-red-600">{errors.designation.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Enter your official job title as mentioned in your offer letter
          </p>
        </div>

        {/* Work Location */}
        <div className="space-y-2">
          <Label htmlFor="work_location" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4" />
            Work Location *
          </Label>
          <Select
            onValueChange={(value) => setValue('work_location', value)}
            defaultValue={watch('work_location')}
          >
            <SelectTrigger className={errors.work_location ? 'border-red-300' : ''}>
              <SelectValue placeholder="Select your work location" />
            </SelectTrigger>
            <SelectContent>
              {WORK_LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.work_location && (
            <p className="text-sm text-red-600">{errors.work_location.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Select your primary work location
          </p>
        </div>

        {/* Employment Type */}
        <div className="space-y-2">
          <Label htmlFor="employment_type" className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4" />
            Employment Type *
          </Label>
          <Select
            onValueChange={(value) => setValue('employment_type', value)}
            defaultValue={watch('employment_type')}
          >
            <SelectTrigger className={errors.employment_type ? 'border-red-300' : ''}>
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.employment_type && (
            <p className="text-sm text-red-600">{errors.employment_type.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Select your employment type as per your contract
          </p>
        </div>

        {/* Joining Date */}
        <div className="space-y-2">
          <Label htmlFor="joined_at" className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            Joining Date
          </Label>
          <Input
            id="joined_at"
            type="date"
            {...register('joined_at')}
            className={errors.joined_at ? 'border-red-300 focus:ring-red-500' : ''}
          />
          {errors.joined_at && (
            <p className="text-sm text-red-600">{errors.joined_at.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Select your official joining date (leave blank if not yet determined)
          </p>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Work Locations</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div><span className="font-medium">Patna:</span> Main office location</div>
              <div><span className="font-medium">Delhi:</span> Branch office</div>
              <div><span className="font-medium">Remote:</span> Work from home</div>
              <div><span className="font-medium">Hybrid:</span> Mix of office and remote</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-purple-900 mb-2">Employment Types</h4>
            <div className="text-sm text-purple-700 space-y-1">
              <div><span className="font-medium">Full-time:</span> Regular permanent position</div>
              <div><span className="font-medium">Part-time:</span> Reduced hours position</div>
              <div><span className="font-medium">Intern:</span> Internship position</div>
              <div><span className="font-medium">Contractor:</span> Contract-based work</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Note:</span> Some details like department and reporting manager 
            will be assigned during the approval process. You can update your work information later through 
            your employee profile.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}