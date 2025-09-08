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
    <div className="w-full max-w-none">
      {/* Step Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Employee Onboarding</h2>
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Step {currentStep} of {steps.length}
          </div>
        </div>
        
        <Progress value={progress} className="h-2 mb-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 max-w-5xl mx-auto">
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
                  flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 border-2
                  ${isCurrent 
                    ? 'bg-primary/10 border-primary/50 text-primary shadow-md ring-2 ring-primary/20' 
                    : isCompleted
                    ? 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20'
                    : isAccessible
                    ? 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                    : 'bg-muted/30 border-muted text-muted-foreground/50 cursor-not-allowed'
                  }
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-colors
                  ${isCurrent 
                    ? 'bg-primary/20' 
                    : isCompleted 
                    ? 'bg-green-500/20' 
                    : 'bg-muted'
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
      <Card className="shadow-2xl border border-border/50 bg-card/95 backdrop-blur-xl max-w-none">
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-3">
              <div className="w-7 h-7 bg-primary/20 rounded-lg flex items-center justify-center">
                <currentStepData.icon className="w-4 h-4 text-primary" />
              </div>
              {currentStepData.title}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">{currentStepData.description}</p>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <CurrentStepComponent form={form} />
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-border max-w-4xl mx-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2 h-10"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 h-10 px-6"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 h-10 px-6 bg-green-600 hover:bg-green-700 text-white"
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
        <Card className="mt-4 border-destructive/20 bg-destructive/5 max-w-4xl mx-auto">
          <CardContent className="p-4">
            <h4 className="font-medium text-destructive mb-2">Please fix the following errors:</h4>
            <ul className="text-sm text-destructive/80 space-y-1">
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