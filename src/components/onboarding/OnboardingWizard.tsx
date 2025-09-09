import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData } from '@/types/onboarding.types'
import { validateStep } from '@/schemas/onboarding.schemas'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, User, MapPin, Briefcase, CreditCard, Upload, CheckCircle } from 'lucide-react'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { AddressEmergencyStep } from './steps/AddressEmergencyStep'
import { WorkDetailsStep } from './steps/WorkDetailsStep'
import { BankDetailsStep } from './steps/BankDetailsStep'
import { DocumentsStep } from './steps/DocumentsStep'

interface OnboardingWizardProps {
  form: UseFormReturn<OnboardingFormData>
  onSubmit: (data: OnboardingFormData) => Promise<void>
  isSubmitting: boolean
}

const steps = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Personal details and contact information',
    icon: User,
    component: BasicInfoStep
  },
  {
    id: 2,
    title: 'Address & Emergency',
    description: 'Address details and emergency contact',
    icon: MapPin,
    component: AddressEmergencyStep
  },
  {
    id: 3,
    title: 'Work Details',
    description: 'Job role and employment information',
    icon: Briefcase,
    component: WorkDetailsStep
  },
  {
    id: 4,
    title: 'Bank Details',
    description: 'Banking information for salary processing',
    icon: CreditCard,
    component: BankDetailsStep
  },
  {
    id: 5,
    title: 'Documents',
    description: 'Upload required documents',
    icon: Upload,
    component: DocumentsStep
  }
]

export function OnboardingWizard({ form, onSubmit, isSubmitting }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const { watch, trigger, handleSubmit, formState: { errors } } = form

  const validateCurrentStep = async () => {
    const formData = watch()
    const result = validateStep(currentStep, formData)
    
    if (result.success) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
      return true
    } else {
      await trigger()
      return false
    }
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleStepClick = async (stepId: number) => {
    if (stepId === currentStep) return
    
    if (stepId < currentStep) {
      setCurrentStep(stepId)
    } else {
      const isCurrentStepValid = await validateCurrentStep()
      if (isCurrentStepValid) {
        setCurrentStep(stepId)
      }
    }
  }

  const handleFormSubmit = async (data: OnboardingFormData) => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      await onSubmit(data)
    }
  }

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100
  const currentStepData = steps[currentStep - 1]
  const CurrentStepComponent = currentStepData.component

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header with Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{currentStepData.title}</h2>
          <div className="flex items-center gap-2 text-purple-400 font-medium">
            <span>{currentStep}/{steps.length}</span>
            <div className="px-3 py-1 bg-purple-500/20 rounded-full text-sm">
              Next
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          <CurrentStepComponent form={form} />

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-700">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <h4 className="font-medium text-red-400 mb-2">Please fix the following errors:</h4>
          <ul className="text-sm text-red-300 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>• {error?.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}