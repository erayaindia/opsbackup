import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { OnboardingFormData } from '@/types/onboarding.types'
import { onboardingFormSchema } from '@/schemas/onboarding.schemas'
import { submitOnboardingApplication } from '@/services/onboardingService'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Building2, Users, Shield } from 'lucide-react'

export default function Onboard() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [applicationId, setApplicationId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      full_name: '',
      personal_email: '',
      phone: '',
      work_location: 'Patna',
      employment_type: 'Full-time',
      addresses: {},
      emergency: {},
      documents: [],
      notes: ''
    },
    mode: 'onChange'
  })

  const handleSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true)
    
    try {
      console.log('Submitting onboarding application:', data)
      
      const response = await submitOnboardingApplication(data)
      
      if (response.ok && response.data) {
        setApplicationId(response.data.applicant_id)
        setIsSubmitted(true)
        toast.success('Application submitted successfully!')
      } else {
        throw new Error(response.error?.message || 'Submission failed')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Application Submitted Successfully!
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Thank you for applying to join Eraya Style
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Application Details</h3>
                <p className="text-blue-700">
                  <span className="font-medium">Application ID:</span> {applicationId}
                </p>
                <p className="text-blue-700 mt-1">
                  <span className="font-medium">Status:</span> Submitted for Review
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">What happens next?</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Application Review</p>
                      <p className="text-gray-600 text-sm">Our HR team will review your application and documents</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Account Creation</p>
                      <p className="text-gray-600 text-sm">If approved, we'll create your company account</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Welcome Email</p>
                      <p className="text-gray-600 text-sm">You'll receive login credentials via email</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 text-sm">
                  <span className="font-medium">Please note:</span> Keep this Application ID safe. 
                  You may need it for future reference. We typically review applications within 2-3 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Eraya Style</h1>
              <p className="text-sm text-gray-600">Employee Onboarding</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Eraya Style!
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            We're excited to have you join our team. Please fill out the following information 
            to complete your onboarding application.
          </p>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 justify-center">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Secure & Private</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">HR Reviewed</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Quick Process</span>
            </div>
          </div>
        </div>

        {/* Onboarding Wizard */}
        <OnboardingWizard
          form={form}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
      
      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              © 2024 Eraya Style. All rights reserved.
            </div>
            <div className="text-sm text-gray-500">
              Need help? Contact HR at hr@erayastyle.com
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}