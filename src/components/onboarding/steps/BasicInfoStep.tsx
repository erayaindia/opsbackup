import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData } from '@/types/onboarding.types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { User, Mail, Phone } from 'lucide-react'

interface BasicInfoStepProps {
  form: UseFormReturn<OnboardingFormData>
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Welcome!</span> Please provide your basic information to get started. 
            All fields marked with * are required.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium">
            <User className="w-4 h-4" />
            Full Name *
          </Label>
          <Input
            id="full_name"
            type="text"
            placeholder="Enter your full name"
            {...register('full_name')}
            className={errors.full_name ? 'border-red-300 focus:ring-red-500' : ''}
          />
          {errors.full_name && (
            <p className="text-sm text-red-600">{errors.full_name.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Please enter your full name as it appears on official documents
          </p>
        </div>

        {/* Personal Email */}
        <div className="space-y-2">
          <Label htmlFor="personal_email" className="flex items-center gap-2 text-sm font-medium">
            <Mail className="w-4 h-4" />
            Personal Email Address *
          </Label>
          <Input
            id="personal_email"
            type="email"
            placeholder="your.email@example.com"
            {...register('personal_email')}
            className={errors.personal_email ? 'border-red-300 focus:ring-red-500' : ''}
          />
          {errors.personal_email && (
            <p className="text-sm text-red-600">{errors.personal_email.message}</p>
          )}
          <p className="text-xs text-gray-500">
            We'll use this email for important communications during the onboarding process
          </p>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
            <Phone className="w-4 h-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            {...register('phone')}
            className={errors.phone ? 'border-red-300 focus:ring-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Include country code for international numbers (optional)
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Privacy Notice:</span> Your personal information will be securely stored 
            and used only for employment-related purposes. We follow strict data protection guidelines to ensure 
            your privacy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}