import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData } from '@/types/onboarding.types'
import { validateStep } from '@/schemas/onboarding.schemas'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, User, MapPin, Briefcase, Upload, CheckCircle } from 'lucide-react'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { AddressEmergencyStep } from './steps/AddressEmergencyStep'
import { WorkDetailsStep } from './steps/WorkDetailsStep'
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
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Employee Onboarding</h2>
          <div className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </div>
        </div>
        
        <Progress value={progress} className="h-2 mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {steps.map((step) => {
            const Icon = step.icon
            const isCompleted = completedSteps.includes(step.id)
            const isCurrent = step.id === currentStep
            const isAccessible = step.id <= currentStep || isCompleted
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                disabled={!isAccessible}
                className={`
                  flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                  ${isCurrent 
                    ? 'bg-blue-50 border-2 border-blue-200 text-blue-700' 
                    : isCompleted
                    ? 'bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100'
                    : isAccessible
                    ? 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
                    : 'bg-gray-25 border-2 border-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${isCurrent 
                    ? 'bg-blue-100' 
                    : isCompleted 
                    ? 'bg-green-100' 
                    : 'bg-gray-100'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{step.title}</p>
                  <p className="text-xs opacity-75 truncate">{step.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <currentStepData.icon className="w-5 h-5" />
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 mt-1">{currentStepData.description}</p>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <CurrentStepComponent form={form} />

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
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
        </CardContent>
      </Card>

      {/* Form Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <Card className="mt-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-red-900 mb-2">Please fix the following errors:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>• {error?.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}