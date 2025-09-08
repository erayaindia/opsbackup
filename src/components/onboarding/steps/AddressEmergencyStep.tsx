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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5" />
            Current Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_street">Street Address</Label>
            <Input
              id="current_street"
              placeholder="House/Flat number, Street name"
              {...register('addresses.current.street')}
              className={errors.addresses?.current?.street ? 'border-red-300' : ''}
            />
            {errors.addresses?.current?.street && (
              <p className="text-sm text-red-600">{errors.addresses.current.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_city">City</Label>
              <Input
                id="current_city"
                placeholder="City name"
                {...register('addresses.current.city')}
                className={errors.addresses?.current?.city ? 'border-red-300' : ''}
              />
              {errors.addresses?.current?.city && (
                <p className="text-sm text-red-600">{errors.addresses.current.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_state">State</Label>
              <Input
                id="current_state"
                placeholder="State name"
                {...register('addresses.current.state')}
                className={errors.addresses?.current?.state ? 'border-red-300' : ''}
              />
              {errors.addresses?.current?.state && (
                <p className="text-sm text-red-600">{errors.addresses.current.state.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_pin">PIN Code</Label>
            <Input
              id="current_pin"
              placeholder="6-digit PIN code"
              maxLength={6}
              {...register('addresses.current.pin')}
              className={errors.addresses?.current?.pin ? 'border-red-300' : ''}
            />
            {errors.addresses?.current?.pin && (
              <p className="text-sm text-red-600">{errors.addresses.current.pin.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permanent Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5" />
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
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Same as current address
            </Label>
          </div>

          {!sameAsCurrent && (
            <>
              <div className="space-y-2">
                <Label htmlFor="permanent_street">Street Address</Label>
                <Input
                  id="permanent_street"
                  placeholder="House/Flat number, Street name"
                  {...register('addresses.permanent.street')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="permanent_city">City</Label>
                  <Input
                    id="permanent_city"
                    placeholder="City name"
                    {...register('addresses.permanent.city')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanent_state">State</Label>
                  <Input
                    id="permanent_state"
                    placeholder="State name"
                    {...register('addresses.permanent.state')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permanent_pin">PIN Code</Label>
                <Input
                  id="permanent_pin"
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  {...register('addresses.permanent.pin')}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="w-5 h-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_name">Contact Name</Label>
            <Input
              id="emergency_name"
              placeholder="Full name of emergency contact"
              {...register('emergency.name')}
              className={errors.emergency?.name ? 'border-red-300' : ''}
            />
            {errors.emergency?.name && (
              <p className="text-sm text-red-600">{errors.emergency.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_relationship">Relationship</Label>
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
            <Label htmlFor="emergency_phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="emergency_phone"
              type="tel"
              placeholder="+91 98765 43210"
              {...register('emergency.phone')}
              className={errors.emergency?.phone ? 'border-red-300' : ''}
            />
            {errors.emergency?.phone && (
              <p className="text-sm text-red-600">{errors.emergency.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="emergency_email"
              type="email"
              placeholder="contact.email@example.com"
              {...register('emergency.email')}
              className={errors.emergency?.email ? 'border-red-300' : ''}
            />
            {errors.emergency?.email && (
              <p className="text-sm text-red-600">{errors.emergency.email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <p className="text-sm text-amber-800">
            <span className="font-medium">Note:</span> Emergency contact information is kept confidential 
            and will only be used in case of emergencies. Please ensure all details are current and accurate.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}