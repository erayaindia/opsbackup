import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData, GENDERS } from '@/types/onboarding.types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { User, Mail, Phone, Calendar, Users } from 'lucide-react'

interface BasicInfoStepProps {
  form: UseFormReturn<OnboardingFormData>
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const { register, setValue, watch, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <p className="text-gray-300 mb-8">
        Welcome to Eraya Style! Please provide your basic information to join our e-commerce team. All fields are required.
      </p>

      <div className="space-y-6">
        {/* Full Name */}
        <div className="space-y-3">
          <Label htmlFor="full_name" className="text-lg font-medium text-gray-200">
            What's your full name ?
          </Label>
          <Input
            id="full_name"
            type="text"
            placeholder="e.g. Ravi Kumar Singh"
            {...register('full_name')}
            className="h-14 bg-gray-800/50 border-gray-700 text-gray-300 placeholder:text-gray-500 rounded-xl focus:border-purple-400 focus:ring-purple-400/20"
          />
          {errors.full_name && (
            <p className="text-sm text-red-400">{errors.full_name.message}</p>
          )}
        </div>

        {/* Personal Email */}
        <div className="space-y-3">
          <Label htmlFor="personal_email" className="text-lg font-medium text-gray-200">
            Email Address
          </Label>
          <Input
            id="personal_email"
            type="email"
            placeholder="e.g. ravi.kumar@gmail.com"
            {...register('personal_email')}
            className="h-14 bg-gray-800/50 border-gray-700 text-gray-300 placeholder:text-gray-500 rounded-xl focus:border-purple-400 focus:ring-purple-400/20"
          />
          {errors.personal_email && (
            <p className="text-sm text-red-400">{errors.personal_email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-3">
          <Label htmlFor="phone" className="text-lg font-medium text-gray-200">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. +91 9876543210"
            {...register('phone')}
            className="h-14 bg-gray-800/50 border-gray-700 text-gray-300 placeholder:text-gray-500 rounded-xl focus:border-purple-400 focus:ring-purple-400/20"
          />
          {errors.phone && (
            <p className="text-sm text-red-400">{errors.phone.message}</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-3">
          <Label htmlFor="gender" className="text-lg font-medium text-gray-200">
            Gender
          </Label>
          <Select
            onValueChange={(value) => setValue('gender', value as 'Male' | 'Female')}
            defaultValue={watch('gender')}
          >
            <SelectTrigger className="h-14 bg-gray-800/50 border-gray-700 text-gray-300 placeholder:text-gray-500 rounded-xl">
              <SelectValue placeholder="Select your gender" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {GENDERS.map((gender) => (
                <SelectItem key={gender} value={gender} className="text-gray-300">
                  {gender}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-sm text-red-400">{errors.gender.message}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-3">
          <Label htmlFor="date_of_birth" className="text-lg font-medium text-gray-200">
            Date of Birth
          </Label>
          <DatePicker
            value={watch('date_of_birth') ? new Date(watch('date_of_birth')) : undefined}
            onChange={(date) => {
              setValue('date_of_birth', date ? date.toISOString().split('T')[0] : '')
            }}
            placeholder="Select your date of birth"
            className="h-14 bg-gray-800/50 border-gray-700 text-gray-300 placeholder:text-gray-500 rounded-xl focus:border-purple-400 focus:ring-purple-400/20"
          />
          {errors.date_of_birth && (
            <p className="text-sm text-red-400">{errors.date_of_birth.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}