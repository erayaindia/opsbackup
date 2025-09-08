import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData } from '@/types/onboarding.types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { User, Mail, Phone, Calendar } from 'lucide-react'

interface BasicInfoStepProps {
  form: UseFormReturn<OnboardingFormData>
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <Card className="bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-white">Welcome!</span> Please provide your basic information to get started. 
            All fields marked with * are required.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <User className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
            Full Name *
          </Label>
          <Input
            id="full_name"
            type="text"
            placeholder="Enter your full name"
            {...register('full_name')}
            className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.full_name ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
          />
          {errors.full_name && (
            <p className="text-sm text-red-500 dark:text-red-400">{errors.full_name.message}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please enter your full name as it appears on official documents
          </p>
        </div>

        {/* Personal Email */}
        <div className="space-y-2">
          <Label htmlFor="personal_email" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <Mail className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
            Personal Email Address *
          </Label>
          <Input
            id="personal_email"
            type="email"
            placeholder="your.email@example.com"
            {...register('personal_email')}
            className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.personal_email ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
          />
          {errors.personal_email && (
            <p className="text-sm text-red-500 dark:text-red-400">{errors.personal_email.message}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We'll use this email for important communications during the onboarding process
          </p>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <Phone className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            {...register('phone')}
            className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.phone ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
          />
          {errors.phone && (
            <p className="text-sm text-red-500 dark:text-red-400">{errors.phone.message}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Include country code for international numbers (optional)
          </p>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="date_of_birth" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <Calendar className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </div>
            Date of Birth *
          </Label>
          <Input
            id="date_of_birth"
            type="date"
            {...register('date_of_birth')}
            className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.date_of_birth ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-red-500 dark:text-red-400">{errors.date_of_birth.message}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Must be between 18 and 80 years of age
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <Card className="bg-slate-50/30 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Privacy Notice:</span> Your personal information will be securely stored 
            and used only for employment-related purposes. We follow strict data protection guidelines to ensure 
            your privacy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}