import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData, WORK_LOCATIONS, EMPLOYMENT_TYPES } from '@/types/onboarding.types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Briefcase, MapPin, Clock, Calendar } from 'lucide-react'

interface WorkDetailsStepProps {
  form: UseFormReturn<OnboardingFormData>
}

export function WorkDetailsStep({ form }: WorkDetailsStepProps) {
  const { register, watch, setValue, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <Card className="bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-white">Work Information:</span> Please provide your employment details. 
            Some fields may be filled in by HR during the approval process.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Designation */}
        <div className="space-y-2">
          <Label htmlFor="designation" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <Briefcase className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
            Job Title / Designation
          </Label>
          <Input
            id="designation"
            type="text"
            placeholder="e.g., E-commerce Manager, Content Writer, Digital Marketing Executive"
            {...register('designation')}
            className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.designation ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
          />
          {errors.designation && (
            <p className="text-sm text-red-500 dark:text-red-400">{errors.designation.message}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your official job title as mentioned in your offer letter
          </p>
        </div>

        {/* Work Location */}
        <div className="space-y-2">
          <Label htmlFor="work_location" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <MapPin className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
            Work Location *
          </Label>
          <Select
            onValueChange={(value) => setValue('work_location', value)}
            defaultValue={watch('work_location')}
          >
            <SelectTrigger className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.work_location ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}>
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
            <p className="text-sm text-red-500 dark:text-red-400">{errors.work_location.message}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your primary work location
          </p>
        </div>

        {/* Employment Type */}
        <div className="space-y-2">
          <Label htmlFor="employment_type" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <Clock className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
            Employment Type *
          </Label>
          <Select
            onValueChange={(value) => setValue('employment_type', value)}
            defaultValue={watch('employment_type')}
          >
            <SelectTrigger className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.employment_type ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}>
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
            <p className="text-sm text-red-500 dark:text-red-400">{errors.employment_type.message}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your employment type as per your contract
          </p>
        </div>

        {/* Joining Date */}
        <div className="space-y-2">
          <Label htmlFor="joined_at" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <Calendar className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
            Joining Date *
          </Label>
          <DatePicker
            value={watch('joined_at') ? new Date(watch('joined_at')) : undefined}
            onChange={(date) => {
              setValue('joined_at', date ? date.toISOString().split('T')[0] : '')
            }}
            placeholder="Select your joining date"
            className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.joined_at ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
          />
          {errors.joined_at && (
            <p className="text-sm text-red-500 dark:text-red-400">{errors.joined_at.message}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your official joining date as mentioned in your offer letter
          </p>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-50/30 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Work Locations</h4>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <div><span className="font-medium text-slate-800 dark:text-slate-200">Patna:</span> Main office location</div>
              <div><span className="font-medium text-slate-800 dark:text-slate-200">Delhi:</span> Branch office</div>
              <div><span className="font-medium text-slate-800 dark:text-slate-200">Remote:</span> Work from home</div>
              <div><span className="font-medium text-slate-800 dark:text-slate-200">Hybrid:</span> Mix of office and remote</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/30 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">Employment Types</h4>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <div><span className="font-medium text-slate-800 dark:text-slate-200">Full-time:</span> Regular permanent position</div>
              <div><span className="font-medium text-slate-800 dark:text-slate-200">Part-time:</span> Reduced hours position</div>
              <div><span className="font-medium text-slate-800 dark:text-slate-200">Intern:</span> Internship position</div>
              <div><span className="font-medium text-slate-800 dark:text-slate-200">Contractor:</span> Contract-based work</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card className="bg-slate-50/30 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Note:</span> Some details like department and reporting manager 
            will be assigned during the approval process. You can update your work information later through 
            your employee profile.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}