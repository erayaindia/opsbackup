import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData, RELATIONSHIPS } from '@/types/onboarding.types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Phone, Mail, UserCheck } from 'lucide-react'

interface AddressEmergencyStepProps {
  form: UseFormReturn<OnboardingFormData>
}

export function AddressEmergencyStep({ form }: AddressEmergencyStepProps) {
  const { register, watch, setValue, formState: { errors } } = form

  const sameAsCurrent = watch('addresses.same_as_current')
  const currentAddress = watch('addresses.current')

  const handleSameAsCurrentChange = (checked: boolean) => {
    setValue('addresses.same_as_current', checked)
    if (checked && currentAddress) {
      setValue('addresses.permanent', currentAddress)
    } else {
      setValue('addresses.permanent', {})
    }
  }

  return (
    <div className="space-y-8">
      {/* Current Address */}
      <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            Current Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_street" className="text-slate-700 dark:text-slate-300 font-medium">Street Address</Label>
            <Input
              id="current_street"
              placeholder="House/Flat number, Street name"
              {...register('addresses.current.street')}
              className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.addresses?.current?.street ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
            />
            {errors.addresses?.current?.street && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.addresses.current.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_city" className="text-slate-700 dark:text-slate-300 font-medium">City</Label>
              <Input
                id="current_city"
                placeholder="City name"
                {...register('addresses.current.city')}
                className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.addresses?.current?.city ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
              />
              {errors.addresses?.current?.city && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.addresses.current.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_state" className="text-slate-700 dark:text-slate-300 font-medium">State</Label>
              <Input
                id="current_state"
                placeholder="State name"
                {...register('addresses.current.state')}
                className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.addresses?.current?.state ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
              />
              {errors.addresses?.current?.state && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.addresses.current.state.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_pin" className="text-slate-700 dark:text-slate-300 font-medium">PIN Code</Label>
            <Input
              id="current_pin"
              placeholder="6-digit PIN code"
              maxLength={6}
              {...register('addresses.current.pin')}
              className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.addresses?.current?.pin ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
            />
            {errors.addresses?.current?.pin && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.addresses.current.pin.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permanent Address */}
      <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            Permanent Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same_as_current"
              checked={sameAsCurrent || false}
              onCheckedChange={handleSameAsCurrentChange}
            />
            <Label 
              htmlFor="same_as_current" 
              className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Same as current address
            </Label>
          </div>

          {!sameAsCurrent && (
            <>
              <div className="space-y-2">
                <Label htmlFor="permanent_street" className="text-slate-700 dark:text-slate-300 font-medium">Street Address</Label>
                <Input
                  id="permanent_street"
                  placeholder="House/Flat number, Street name"
                  {...register('addresses.permanent.street')}
                  className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="permanent_city" className="text-slate-700 dark:text-slate-300 font-medium">City</Label>
                  <Input
                    id="permanent_city"
                    placeholder="City name"
                    {...register('addresses.permanent.city')}
                    className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanent_state" className="text-slate-700 dark:text-slate-300 font-medium">State</Label>
                  <Input
                    id="permanent_state"
                    placeholder="State name"
                    {...register('addresses.permanent.state')}
                    className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permanent_pin" className="text-slate-700 dark:text-slate-300 font-medium">PIN Code</Label>
                <Input
                  id="permanent_pin"
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  {...register('addresses.permanent.pin')}
                  className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_name" className="text-slate-700 dark:text-slate-300 font-medium">Contact Name</Label>
            <Input
              id="emergency_name"
              placeholder="Full name of emergency contact"
              {...register('emergency.name')}
              className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.emergency?.name ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
            />
            {errors.emergency?.name && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.emergency.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_relationship" className="text-slate-700 dark:text-slate-300 font-medium">Relationship</Label>
            <Select
              onValueChange={(value) => setValue('emergency.relationship', value)}
              defaultValue={watch('emergency.relationship')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((relationship) => (
                  <SelectItem key={relationship} value={relationship}>
                    {relationship}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_phone" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                <Phone className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              </div>
              Phone Number
            </Label>
            <Input
              id="emergency_phone"
              type="tel"
              placeholder="+91 98765 43210"
              {...register('emergency.phone')}
              className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.emergency?.phone ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
            />
            {errors.emergency?.phone && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.emergency.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_email" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                <Mail className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              </div>
              Email Address
            </Label>
            <Input
              id="emergency_email"
              type="email"
              placeholder="contact.email@example.com"
              {...register('emergency.email')}
              className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.emergency?.email ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
            />
            {errors.emergency?.email && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.emergency.email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium text-amber-900 dark:text-amber-200">Note:</span> Emergency contact information is kept confidential 
            and will only be used in case of emergencies. Please ensure all details are current and accurate.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}