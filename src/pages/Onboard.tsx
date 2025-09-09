import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import EmployeeOnboardingWizard from '@/components/onboarding/EmployeeOnboardingWizard'
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
      date_of_birth: '',
      gender: 'Male',
      work_location: '',
      employment_type: '',
      joined_at: '',
      addresses: {},
      emergency: {},
      bank_details: {},
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="shadow-2xl border border-border/50 bg-card/95 backdrop-blur-xl">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 ring-2 ring-green-500/30">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Application Submitted Successfully!
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-2">
                Thank you for applying to join Eraya Style
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-foreground mb-2">Application Details</h3>
                <p className="text-foreground/80">
                  <span className="font-medium">Application ID:</span> {applicationId}
                </p>
                <p className="text-foreground/80 mt-1">
                  <span className="font-medium">Status:</span> Submitted for Review
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">What happens next?</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-primary/30">
                      <span className="text-primary font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Application Review</p>
                      <p className="text-muted-foreground text-sm">Our HR team will review your application and documents</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-primary/30">
                      <span className="text-primary font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Account Creation</p>
                      <p className="text-muted-foreground text-sm">If approved, we'll create your company account</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-primary/30">
                      <span className="text-primary font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Welcome Email</p>
                      <p className="text-muted-foreground text-sm">You'll receive login credentials via email</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-6 max-w-none">
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Eraya Style</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Employee Onboarding Portal</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Shield className="h-4 w-4" />
            <span>Secure Application</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 py-12 shrink-0">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
        <div className="relative px-6 max-w-none w-full">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Join <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Eraya Style</span>
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300">
                Start your journey with us by completing this simple 5-step onboarding process. 
                We'll guide you through each step to ensure a smooth experience.
              </p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Form Section - Full Width */}
      <div className="flex-1 px-6 py-6 max-w-none">
        <div className="w-full max-w-none">
          <EmployeeOnboardingWizard />
        </div>
      </div>
      
      {/* Modern Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur shrink-0">
        <div className="w-full px-6 py-6 max-w-none">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">© 2024 Eraya Style. All rights reserved.</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Need help?</span>
              <a href="mailto:hr@erayastyle.com" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                hr@erayastyle.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}