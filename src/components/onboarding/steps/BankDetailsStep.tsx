import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData, INDIAN_BANKS } from '@/types/onboarding.types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Building2, Hash, User, MapPin, Smartphone } from 'lucide-react'

interface BankDetailsStepProps {
  form: UseFormReturn<OnboardingFormData>
}

export function BankDetailsStep({ form }: BankDetailsStepProps) {
  const { register, watch, setValue, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <Card className="bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-white">Bank Information:</span> Please provide your bank account details for salary processing. 
            All fields are required. All information will be securely encrypted and used only for employment purposes.
          </p>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_number" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                  <Hash className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                </div>
                Account Number *
              </Label>
              <Input
                id="account_number"
                type="text"
                placeholder="e.g. 1234567890123456"
                autoComplete="off"
                {...register('bank_details.account_number')}
                className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.bank_details?.account_number ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
              />
              {errors.bank_details?.account_number && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.bank_details.account_number.message}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your bank account number (8-20 digits)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_holder_name" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                  <User className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                </div>
                Account Holder Name *
              </Label>
              <Input
                id="account_holder_name"
                type="text"
                placeholder="e.g. Ravi Kumar Singh"
                autoComplete="name"
                {...register('bank_details.account_holder_name')}
                className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.bank_details?.account_holder_name ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
              />
              {errors.bank_details?.account_holder_name && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.bank_details.account_holder_name.message}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Name should match exactly as per bank records
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_name" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                <Building2 className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              </div>
              Bank Name *
            </Label>
            <Select
              onValueChange={(value) => setValue('bank_details.bank_name', value)}
              defaultValue={watch('bank_details.bank_name')}
            >
              <SelectTrigger className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.bank_details?.bank_name ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}>
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_BANKS.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bank_details?.bank_name && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.bank_details.bank_name.message}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your bank from the list
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ifsc_code" className="text-slate-700 dark:text-slate-300 font-medium">IFSC Code *</Label>
              <Input
                id="ifsc_code"
                type="text"
                placeholder="e.g., SBIN0000123"
                autoComplete="off"
                {...register('bank_details.ifsc_code')}
                className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 uppercase ${errors.bank_details?.ifsc_code ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.bank_details?.ifsc_code && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.bank_details.ifsc_code.message}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                11-character code (e.g., SBIN0000123)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_name" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                </div>
                Branch Name
              </Label>
              <Input
                id="branch_name"
                type="text"
                placeholder="e.g. Patna Main Branch"
                autoComplete="off"
                {...register('bank_details.branch_name')}
                className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.bank_details?.branch_name ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
              />
              {errors.bank_details?.branch_name && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.bank_details.branch_name.message}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your bank branch name (optional)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UPI Details */}
      <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            UPI Information (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upi_id" className="text-slate-700 dark:text-slate-300 font-medium">UPI ID</Label>
            <Input
              id="upi_id"
              type="text"
              placeholder="e.g., 9876543210@paytm"
              autoComplete="off"
              {...register('bank_details.upi_id')}
              className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.bank_details?.upi_id ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
            />
            {errors.bank_details?.upi_id && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.bank_details.upi_id.message}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your UPI ID for quick payments (optional)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium text-blue-900 dark:text-blue-200">Security Notice:</span> Your banking information is encrypted with bank-grade security. 
            This information will be used only for salary processing and will be accessible only to authorized finance personnel. 
            We never store your complete account details in plain text.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}