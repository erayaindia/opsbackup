'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { submitOnboardingApplication, uploadDocument } from '@/services/onboardingService'
import { INDIAN_STATES } from '@/types/onboarding.types'
import { toast } from 'sonner'
import {
  User,
  MapPinHouse,
  BriefcaseBusiness,
  Banknote,
  FileCheck2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  X,
  Upload,
  Image as ImageIcon,
  FileText
} from 'lucide-react'

interface DocumentMetadata {
  filename: string
  path: string
  size: number
  mime_type: string
  uploaded_at: string
  signed_url?: string
}

interface FormData {
  // Step 1: Basic Information
  fullName: string
  personalEmail: string
  phoneNumber: string
  dateOfBirth: string
  gender: string

  // Step 2: Address & Emergency Contact
  currentAddress: {
    street: string
    city: string
    state: string
    pinCode: string
  }
  permanentAddress: {
    street: string
    city: string
    state: string
    pinCode: string
  }
  sameAsCurrentAddress: boolean
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }

  // Step 3: Work Details
  designation: string
  workLocation: string
  employmentType: string
  joiningDate: string

  // Step 4: Bank Details
  accountHolderName: string
  bankAccountNumber: string
  bankName: string
  ifscCode: string
  branchName: string
  upiId: string

  // Step 5: Documents
  documents: {
    aadhaarFront: DocumentMetadata | null
    aadhaarBack: DocumentMetadata | null
    pan: DocumentMetadata | null
    bankPassbook: DocumentMetadata | null
    profilePhoto: DocumentMetadata | null
    education: DocumentMetadata[]
    resume: DocumentMetadata | null
    other: DocumentMetadata[]
  }

  // Legal Consents
  ndaAccepted: boolean
  dataPrivacyAccepted: boolean
}

interface Step {
  id: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Personal details and contact information',
    icon: User
  },
  {
    id: 2,
    title: 'Address & Emergency Contact',
    description: 'Current address and emergency contact details',
    icon: MapPinHouse
  },
  {
    id: 3,
    title: 'Work Details',
    description: 'Job role and employment information',
    icon: BriefcaseBusiness
  },
  {
    id: 4,
    title: 'Bank Details',
    description: 'Banking information for payroll',
    icon: Banknote
  },
  {
    id: 5,
    title: 'Documents Upload',
    description: 'Upload required documents',
    icon: FileCheck2
  },
  {
    id: 6,
    title: 'Review',
    description: 'Review and submit your information',
    icon: CheckCircle2
  }
]

const INDIAN_BANKS = [
  // Public Sector Banks
  'State Bank of India (SBI)',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Bank of India',
  'Central Bank of India',
  'Indian Bank',
  'Indian Overseas Bank',
  'UCO Bank',
  'Bank of Maharashtra',
  'Punjab & Sind Bank',
  
  // Private Sector Banks
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Yes Bank',
  'IDFC First Bank',
  'Bandhan Bank',
  'RBL Bank',
  'South Indian Bank',
  'Federal Bank',
  'Karur Vysya Bank',
  'Tamilnad Mercantile Bank',
  'City Union Bank',
  'DCB Bank',
  'Dhanlaxmi Bank',
  'IDBI Bank',
  'Jammu & Kashmir Bank',
  'Nainital Bank',
  
  // Small Finance Banks
  'AU Small Finance Bank',
  'Equitas Small Finance Bank',
  'Ujjivan Small Finance Bank',
  'Jana Small Finance Bank',
  'Suryoday Small Finance Bank',
  'North East Small Finance Bank',
  'Capital Small Finance Bank',
  'Fincare Small Finance Bank',
  'ESAF Small Finance Bank',
  'Utkarsh Small Finance Bank',
  
  // Regional Rural Banks & Co-operative Banks
  'Andhra Pradesh Grameena Vikas Bank',
  'Assam Gramin Vikash Bank',
  'Bihar Gramin Bank',
  'Chhattisgarh Rajya Gramin Bank',
  'Himachal Pradesh Gramin Bank',
  'Jharkhand Rajya Gramin Bank',
  'Karnataka Gramin Bank',
  'Kerala Gramin Bank',
  'Madhya Pradesh Gramin Bank',
  'Maharashtra Gramin Bank',
  'Odisha Gramya Bank',
  'Puduvai Bharathiar Grama Bank',
  'Punjab Gramin Bank',
  'Rajasthan Marudhara Gramin Bank',
  'Tamil Nadu Grama Bank',
  'Telangana Grameena Bank',
  'Tripura Gramin Bank',
  'Uttar Pradesh Gramin Bank',
  'Uttarakhand Gramin Bank',
  'West Bengal Gramin Bank',
  
  // Payment Banks
  'Paytm Payments Bank',
  'Airtel Payments Bank',
  'India Post Payments Bank',
  'Fino Payments Bank',
  'Jio Payments Bank',
  'NSDL Payments Bank',
  
  // Others
  'The Saraswat Co-operative Bank',
  'The Mumbai District Central Co-operative Bank',
  'The Delhi State Co-operative Bank',
  'Bassein Catholic Co-operative Bank',
  'Other'
]

const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Spouse',
  'Brother',
  'Sister',
  'Son',
  'Daughter',
  'Friend',
  'Other'
]

const WORK_LOCATIONS = ['Patna', 'Delhi', 'Remote', 'Hybrid']
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Intern', 'Contractor']

const DESIGNATIONS = [
  'Intern',
  'Packer',
  'Machine Operator',
  'Operations Executive',
  'Inventory Executive',
  'Fulfillment Executive',
  'Warehouse Associate',
  'Pickup Executive (Field)',
  'Customer Support Executive',
  'Sales (Telecaller)',
  'Catalog Executive',
  'Marketing Executive',
  'Content Creator',
  'Content Manager',
  'Editor',
  'Video Editor',
  'Graphic Designer',
  'Team Lead',
  'Manager',
  'Head of Operations',
  'Other'
]

const initialFormData: FormData = {
  fullName: '',
  personalEmail: '',
  phoneNumber: '',
  dateOfBirth: '',
  gender: '',
  currentAddress: {
    street: '',
    city: '',
    state: '',
    pinCode: ''
  },
  permanentAddress: {
    street: '',
    city: '',
    state: '',
    pinCode: ''
  },
  sameAsCurrentAddress: false,
  emergencyContact: {
    name: '',
    relationship: '',
    phone: ''
  },
  designation: '',
  workLocation: '',
  employmentType: '',
  joiningDate: '',
  accountHolderName: '',
  bankAccountNumber: '',
  bankName: '',
  ifscCode: '',
  branchName: '',
  upiId: '',
  documents: {
    aadhaarFront: null,
    aadhaarBack: null,
    pan: null,
    bankPassbook: null,
    profilePhoto: null,
    education: [],
    resume: null,
    other: []
  },
  ndaAccepted: false,
  dataPrivacyAccepted: false
}

const VerticalStepper: React.FC<{
  currentStep: number
  completedSteps: number[]
  onStepClick: (stepId: number) => void
}> = ({ currentStep, completedSteps, onStepClick }) => {
  return (
    <div className="w-20 flex flex-col items-center py-8">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id)
        const isCurrent = step.id === currentStep
        const isAccessible = step.id <= currentStep || isCompleted
        const Icon = step.icon

        return (
          <div key={step.id} className="flex flex-col items-center">
            <button
              onClick={() => isAccessible && onStepClick(step.id)}
              disabled={!isAccessible}
              className={`
                relative w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-200 mb-2
                ${isCurrent
                  ? 'bg-purple-600 ring-4 ring-purple-500/30 shadow-lg shadow-purple-500/30'
                  : isCompleted
                  ? 'bg-green-600 hover:bg-green-700'
                  : isAccessible
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-800 cursor-not-allowed'
                }
              `}
            >
              {isCompleted && !isCurrent ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : isAccessible ? 'text-gray-300' : 'text-gray-500'}`} />
              )}
              
              {isCurrent && (
                <div className="absolute inset-0 rounded-full bg-purple-600 animate-pulse opacity-40" />
              )}
            </button>

            {index < steps.length - 1 && (
              <div className="w-0.5 h-8 bg-gray-700 mb-2 relative">
                <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-purple-500 to-transparent animate-pulse opacity-60" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const StepLayout: React.FC<{
  title: string
  description: string
  children: React.ReactNode
}> = ({ title, description, children }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      {children}
    </div>
  )
}

const FileDrop: React.FC<{
  onDocumentsUploaded: (documents: DocumentMetadata[]) => void
  accept?: string
  multiple?: boolean
  label: string
  documents: DocumentMetadata[]
  onRemoveDocument: (index: number) => void
  className?: string
  documentType: string
}> = ({ onDocumentsUploaded, accept, multiple = false, label, documents, onRemoveDocument, className, documentType }) => {
  const [isUploading, setIsUploading] = useState(false)
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    await handleFilesSelected(droppedFiles)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      await handleFilesSelected(selectedFiles)
    }
  }

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true)
    const uploadedDocuments: DocumentMetadata[] = []
    
    try {
      for (const file of files) {
        const uploadResult = await uploadDocument(file, documentType)
        
        if (uploadResult.ok && uploadResult.data) {
          uploadedDocuments.push({
            filename: uploadResult.data.filename,
            path: uploadResult.data.path,
            size: uploadResult.data.size,
            mime_type: uploadResult.data.mime_type,
            uploaded_at: uploadResult.data.uploaded_at,
            signed_url: uploadResult.data.signed_url
          })
        } else {
          toast.error(`Failed to upload ${file.name}: ${uploadResult.error?.message}`)
        }
      }
      
      if (uploadedDocuments.length > 0) {
        onDocumentsUploaded(uploadedDocuments)
        toast.success(`Successfully uploaded ${uploadedDocuments.length} file${uploadedDocuments.length > 1 ? 's' : ''}`)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-purple-500 transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''} ${className || ''}`}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          id={`file-${label}`}
          disabled={isUploading}
        />
        <label htmlFor={`file-${label}`} className="cursor-pointer">
          {isUploading ? (
            <div className="w-8 h-8 mx-auto mb-2 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          )}
          <p className="text-gray-300 text-sm mb-1">
            {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-gray-500 text-xs">{label}</p>
        </label>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((document, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                {document.mime_type.startsWith('image/') ? (
                  <ImageIcon className="w-5 h-5 text-green-400" />
                ) : (
                  <FileText className="w-5 h-5 text-green-400" />
                )}
                <div>
                  <p className="text-gray-300 text-sm font-medium">{document.filename}</p>
                  <p className="text-gray-500 text-xs">{(document.size / 1024).toFixed(1)} KB • Uploaded</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveDocument(index)}
                className="text-gray-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const ActionBar: React.FC<{
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  isLastStep: boolean
  isSubmitting?: boolean
}> = ({ currentStep, totalSteps, onBack, onNext, isLastStep, isSubmitting = false }) => {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className="flex items-center justify-between pt-8 border-t border-gray-700">
      <div className="flex items-center space-x-4">
        <p className="text-gray-400 text-sm">
          Step {currentStep} of {totalSteps} • {Math.round(progress)}% complete
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {currentStep > 1 && (
          <Button variant="ghost" onClick={onBack} className="text-gray-400">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        <Button
          onClick={onNext}
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              {isLastStep ? 'Submit Application' : 'Continue'}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function EmployeeOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [showBankAccount, setShowBankAccount] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [applicationId, setApplicationId] = useState<string>('')
  const [showCustomDesignation, setShowCustomDesignation] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('eraya_onboarding_v1')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const loadedFormData = parsed.formData || initialFormData
        setFormData(loadedFormData)
        setCurrentStep(parsed.currentStep || 1)
        setCompletedSteps(parsed.completedSteps || [])
        
        // Check if designation is a custom one (not in the predefined list)
        if (loadedFormData.designation && !DESIGNATIONS.includes(loadedFormData.designation)) {
          setShowCustomDesignation(true)
        }
      } catch (e) {
        console.error('Failed to parse saved onboarding data:', e)
      }
    }
  }, [])

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem('eraya_onboarding_v1', JSON.stringify({
      formData,
      currentStep,
      completedSteps
    }))
  }, [formData, currentStep, completedSteps])

  // Handle same as current address toggle
  useEffect(() => {
    if (formData.sameAsCurrentAddress) {
      setFormData(prev => ({
        ...prev,
        permanentAddress: { ...prev.currentAddress }
      }))
    }
  }, [formData.sameAsCurrentAddress, formData.currentAddress])

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const validateStep = (step: number): { isValid: boolean; errors: Record<string, string> } => {
    const stepErrors: Record<string, string> = {}
    
    switch (step) {
      case 1:
        if (!formData.fullName) stepErrors.fullName = 'Full name is required'
        if (!formData.personalEmail) stepErrors.personalEmail = 'Personal email is required'
        else if (!/\S+@\S+\.\S+/.test(formData.personalEmail)) stepErrors.personalEmail = 'Please enter a valid email'
        if (!formData.phoneNumber) stepErrors.phoneNumber = 'Phone number is required'
        if (!formData.dateOfBirth) stepErrors.dateOfBirth = 'Date of birth is required'
        if (!formData.gender) stepErrors.gender = 'Gender is required'
        break
        
      case 2:
        if (!formData.currentAddress.street) stepErrors.currentStreet = 'Street address is required'
        if (!formData.currentAddress.city) stepErrors.currentCity = 'City is required'
        if (!formData.emergencyContact.name) stepErrors.emergencyName = 'Emergency contact name is required'
        if (!formData.emergencyContact.relationship) stepErrors.emergencyRelationship = 'Emergency contact relationship is required'
        if (!formData.emergencyContact.phone) stepErrors.emergencyPhone = 'Emergency contact phone is required'
        else if (formData.emergencyContact.phone === formData.phoneNumber) {
          stepErrors.emergencyPhone = 'Emergency contact phone must be different from your phone number'
        }
        break
        
      case 3:
        if (!formData.designation) stepErrors.designation = 'Designation is required'
        if (!formData.workLocation) stepErrors.workLocation = 'Work location is required'
        if (!formData.employmentType) stepErrors.employmentType = 'Employment type is required'
        if (!formData.joiningDate) stepErrors.joiningDate = 'Joining date is required'
        break
        
      case 4:
        if (!formData.accountHolderName) stepErrors.accountHolderName = 'Account holder name is required'
        if (!formData.bankAccountNumber) stepErrors.bankAccountNumber = 'Bank account number is required'
        if (!formData.bankName) stepErrors.bankName = 'Bank name is required'
        if (!formData.ifscCode) stepErrors.ifscCode = 'IFSC code is required'
        else if (!isValidIFSC(formData.ifscCode)) stepErrors.ifscCode = 'Please enter a valid IFSC code'
        break
        
      case 5:
        if (!formData.documents.aadhaarFront) stepErrors.aadhaarFront = 'Aadhaar card front is required'
        if (!formData.documents.aadhaarBack) stepErrors.aadhaarBack = 'Aadhaar card back is required'
        if (!formData.documents.pan) stepErrors.pan = 'PAN card is required'
        if (!formData.documents.bankPassbook) stepErrors.bankPassbook = 'Bank passbook photo is required'
        if (!formData.documents.profilePhoto) stepErrors.profilePhoto = 'Profile photo is required'
        if (formData.documents.education.length === 0) stepErrors.education = 'Education certificates are required'
        break
        
      case 6:
        if (!formData.ndaAccepted) stepErrors.ndaAccepted = 'You must accept the NDA agreement to proceed'
        if (!formData.dataPrivacyAccepted) stepErrors.dataPrivacyAccepted = 'You must accept the Data Privacy agreement to proceed'
        break
        
      default:
        break
    }
    
    return {
      isValid: Object.keys(stepErrors).length === 0,
      errors: stepErrors
    }
  }

  const handleNext = async () => {
    const validation = validateStep(currentStep)
    
    if (validation.isValid) {
      // Clear any existing errors for this step
      setErrors({})
      
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
      
      // If we're on the final step (step 6), submit the application
      if (currentStep === 6) {
        await handleSubmit()
      } else if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1)
      }
    } else {
      // Set errors to show under fields
      setErrors(validation.errors)
    }
  }

  const handleBack = () => {
    // Clear errors when going back
    setErrors({})
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      console.log('Submitting onboarding application:', formData)
      
      // Transform documents object to array format expected by database
      const documentArray = []
      if (formData.documents) {
        // Handle single document fields
        const singleDocs = ['aadhaarFront', 'aadhaarBack', 'pan', 'bankPassbook', 'profilePhoto', 'resume']
        singleDocs.forEach(docType => {
          if (formData.documents[docType]) {
            documentArray.push({
              ...formData.documents[docType],
              type: docType.charAt(0).toUpperCase() + docType.slice(1).replace(/([A-Z])/g, ' $1').trim()
            })
          }
        })
        
        // Handle array document fields
        if (formData.documents.education && formData.documents.education.length > 0) {
          formData.documents.education.forEach((doc, idx) => {
            documentArray.push({
              ...doc,
              type: `Education ${idx + 1}`
            })
          })
        }
        
        if (formData.documents.other && formData.documents.other.length > 0) {
          formData.documents.other.forEach((doc, idx) => {
            documentArray.push({
              ...doc,
              type: `Other ${idx + 1}`
            })
          })
        }
      }

      // Transform local formData to match employees_details database schema
      const transformedData = {
        fullName: formData.fullName,
        personalEmail: formData.personalEmail,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        currentAddress: formData.currentAddress,
        permanentAddress: formData.permanentAddress,
        sameAsCurrentAddress: formData.sameAsCurrentAddress,
        emergencyName: formData.emergencyContact.name,
        emergencyRelationship: formData.emergencyContact.relationship,
        emergencyPhone: formData.emergencyContact.phone,
        designation: formData.designation,
        workLocation: formData.workLocation,
        employmentType: formData.employmentType,
        joiningDate: formData.joiningDate,
        accountHolderName: formData.accountHolderName,
        bankAccountNumber: formData.bankAccountNumber,
        bankName: formData.bankName,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName,
        upiId: formData.upiId,
        documents: documentArray,
        notes: '',
        ndaAccepted: formData.ndaAccepted,
        dataPrivacyAccepted: formData.dataPrivacyAccepted
      }
      
      const response = await submitOnboardingApplication(transformedData)
      
      if (response.ok && response.data) {
        setIsSubmitted(true)
        toast.success('Application submitted successfully!')
        
        // Clear localStorage after successful submission
        localStorage.removeItem('eraya_onboarding_v1')
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

  const handleStepClick = (stepId: number) => {
    // Clear errors when switching steps
    setErrors({})
    setCurrentStep(stepId)
  }

  const isValidIFSC = (code: string): boolean => {
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepLayout
            title="Add Your Basic Information"
            description="We'll use this information to set up your profile"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">
                  Full Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateFormData({ fullName: e.target.value })}
                  className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.fullName ? 'border-red-500' : ''}`}
                  placeholder="e.g. Ravi Kumar Singh"
                />
                {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalEmail" className="text-gray-300">
                  Personal Email Address <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="personalEmail"
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => updateFormData({ personalEmail: e.target.value })}
                  className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.personalEmail ? 'border-red-500' : ''}`}
                  placeholder="e.g. ravi.kumar@gmail.com"
                />
                {errors.personalEmail && <p className="text-red-400 text-sm mt-1">{errors.personalEmail}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-gray-300">
                  Phone Number <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                  className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.phoneNumber ? 'border-red-500' : ''}`}
                  placeholder="e.g. +91 9876543210"
                />
                {errors.phoneNumber && <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-gray-300">
                  Date of Birth <span className="text-red-400">*</span>
                </Label>
                <DatePicker
                  value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                  onChange={(date) => {
                    updateFormData({ dateOfBirth: date ? date.toISOString().split('T')[0] : '' })
                  }}
                  placeholder="Select your date of birth"
                  className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                />
                {errors.dateOfBirth && <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="gender" className="text-gray-300">
                  Gender <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateFormData({ gender: value })}
                >
                  <SelectTrigger className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.gender ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender}</p>}
              </div>
            </div>
          </StepLayout>
        )

      case 2:
        return (
          <StepLayout
            title="Address & Emergency Contact"
            description="We need your address for official correspondence"
          >
            <div className="space-y-8">
              {/* Current Address */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Current Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="currentStreet" className="text-gray-300">Street Address <span className="text-red-400">*</span></Label>
                    <Input
                      id="currentStreet"
                      value={formData.currentAddress.street}
                      onChange={(e) => updateFormData({
                        currentAddress: { ...formData.currentAddress, street: e.target.value }
                      })}
                      className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.currentStreet ? 'border-red-500' : ''}`}
                      placeholder="e.g. 123, Connaught Place, New Delhi"
                    />
                    {errors.currentStreet && <p className="text-red-400 text-sm mt-1">{errors.currentStreet}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentCity" className="text-gray-300">City <span className="text-red-400">*</span></Label>
                    <Input
                      id="currentCity"
                      value={formData.currentAddress.city}
                      onChange={(e) => updateFormData({
                        currentAddress: { ...formData.currentAddress, city: e.target.value }
                      })}
                      className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.currentCity ? 'border-red-500' : ''}`}
                      placeholder="e.g. New Delhi"
                    />
                    {errors.currentCity && <p className="text-red-400 text-sm mt-1">{errors.currentCity}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentState" className="text-gray-300">State</Label>
                    <Select
                      value={formData.currentAddress.state}
                      onValueChange={(value) => updateFormData({
                        currentAddress: { ...formData.currentAddress, state: value }
                      })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentPin" className="text-gray-300">PIN Code</Label>
                    <Input
                      id="currentPin"
                      value={formData.currentAddress.pinCode}
                      onChange={(e) => updateFormData({
                        currentAddress: { ...formData.currentAddress, pinCode: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20"
                      placeholder="e.g. 110001"
                    />
                  </div>
                </div>
              </div>

              {/* Permanent Address */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold text-white">Permanent Address</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sameAddress"
                      checked={formData.sameAsCurrentAddress}
                      onCheckedChange={(checked) => updateFormData({ sameAsCurrentAddress: !!checked })}
                    />
                    <Label htmlFor="sameAddress" className="text-gray-300 text-sm">
                      Same as Current Address
                    </Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="permanentStreet" className="text-gray-300">Street Address</Label>
                    <Input
                      id="permanentStreet"
                      value={formData.permanentAddress.street}
                      onChange={(e) => updateFormData({
                        permanentAddress: { ...formData.permanentAddress, street: e.target.value }
                      })}
                      disabled={formData.sameAsCurrentAddress}
                      className="bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 disabled:opacity-50"
                      placeholder="e.g. 123, Connaught Place, New Delhi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permanentCity" className="text-gray-300">City</Label>
                    <Input
                      id="permanentCity"
                      value={formData.permanentAddress.city}
                      onChange={(e) => updateFormData({
                        permanentAddress: { ...formData.permanentAddress, city: e.target.value }
                      })}
                      disabled={formData.sameAsCurrentAddress}
                      className="bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 disabled:opacity-50"
                      placeholder="e.g. New Delhi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permanentState" className="text-gray-300">State</Label>
                    <Select
                      value={formData.permanentAddress.state}
                      onValueChange={(value) => updateFormData({
                        permanentAddress: { ...formData.permanentAddress, state: value }
                      })}
                      disabled={formData.sameAsCurrentAddress}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 disabled:opacity-50">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="permanentPin" className="text-gray-300">PIN Code</Label>
                    <Input
                      id="permanentPin"
                      value={formData.permanentAddress.pinCode}
                      onChange={(e) => updateFormData({
                        permanentAddress: { ...formData.permanentAddress, pinCode: e.target.value }
                      })}
                      disabled={formData.sameAsCurrentAddress}
                      className="bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 disabled:opacity-50"
                      placeholder="e.g. 110001"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName" className="text-gray-300">Contact Name <span className="text-red-400">*</span></Label>
                    <Input
                      id="emergencyName"
                      value={formData.emergencyContact.name}
                      onChange={(e) => updateFormData({
                        emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                      })}
                      className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.emergencyName ? 'border-red-500' : ''}`}
                      placeholder="e.g. Sunita Kumar"
                    />
                    {errors.emergencyName && <p className="text-red-400 text-sm mt-1">{errors.emergencyName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyRelationship" className="text-gray-300">Relationship <span className="text-red-400">*</span></Label>
                    <Select
                      value={formData.emergencyContact.relationship}
                      onValueChange={(value) => updateFormData({
                        emergencyContact: { ...formData.emergencyContact, relationship: value }
                      })}
                    >
                      <SelectTrigger className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.emergencyRelationship ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {RELATIONSHIPS.map(rel => (
                          <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.emergencyRelationship && <p className="text-red-400 text-sm mt-1">{errors.emergencyRelationship}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone" className="text-gray-300">Phone Number <span className="text-red-400">*</span></Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => updateFormData({
                        emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                      })}
                      className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.emergencyPhone ? 'border-red-500' : ''}`}
                      placeholder="+91 9876543210"
                    />
                    {errors.emergencyPhone && <p className="text-red-400 text-sm mt-1">{errors.emergencyPhone}</p>}
                  </div>
                </div>
              </div>
            </div>
          </StepLayout>
        )

      case 3:
        return (
          <StepLayout
            title="Work Details"
            description="Tell us about your role and employment preferences"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="designation" className="text-gray-300">Designation / Job Title <span className="text-red-400">*</span></Label>
                <Select
                  value={formData.designation && DESIGNATIONS.includes(formData.designation) ? formData.designation : (showCustomDesignation ? 'Other' : formData.designation)}
                  onValueChange={(value) => {
                    if (value === 'Other') {
                      setShowCustomDesignation(true)
                      updateFormData({ designation: '' })
                    } else {
                      setShowCustomDesignation(false)
                      updateFormData({ designation: value })
                    }
                  }}
                >
                  <SelectTrigger className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.designation ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select your designation" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600 max-h-[300px]">
                    {DESIGNATIONS.map(designation => (
                      <SelectItem key={designation} value={designation}>{designation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {showCustomDesignation && (
                  <Input
                    id="customDesignation"
                    value={formData.designation}
                    onChange={(e) => updateFormData({ designation: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 mt-2"
                    placeholder="Enter your designation"
                  />
                )}
                
                {errors.designation && <p className="text-red-400 text-sm mt-1">{errors.designation}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workLocation" className="text-gray-300">Work Location <span className="text-red-400">*</span></Label>
                <Select
                  value={formData.workLocation}
                  onValueChange={(value) => updateFormData({ workLocation: value })}
                >
                  <SelectTrigger className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.workLocation ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select work location" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {WORK_LOCATIONS.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workLocation && <p className="text-red-400 text-sm mt-1">{errors.workLocation}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType" className="text-gray-300">Employment Type <span className="text-red-400">*</span></Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => updateFormData({ employmentType: value })}
                >
                  <SelectTrigger className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.employmentType ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {EMPLOYMENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employmentType && <p className="text-red-400 text-sm mt-1">{errors.employmentType}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="joiningDate" className="text-gray-300">Joining Date <span className="text-red-400">*</span></Label>
                <DatePicker
                  value={formData.joiningDate ? new Date(formData.joiningDate) : undefined}
                  onChange={(date) => {
                    updateFormData({ joiningDate: date ? date.toISOString().split('T')[0] : '' })
                  }}
                  placeholder="Select your joining date"
                  className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.joiningDate ? 'border-red-500' : ''}`}
                />
                {errors.joiningDate && <p className="text-red-400 text-sm mt-1">{errors.joiningDate}</p>}
              </div>
            </div>
          </StepLayout>
        )

      case 4:
        return (
          <StepLayout
            title="Add Your Bank Details"
            description="We use this only for payroll"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName" className="text-gray-300">
                    Account Holder Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={(e) => updateFormData({ accountHolderName: e.target.value })}
                    className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.accountHolderName ? 'border-red-500' : ''}`}
                    placeholder="e.g. Ravi Kumar Singh"
                    autoComplete="off"
                  />
                  {errors.accountHolderName && <p className="text-red-400 text-sm mt-1">{errors.accountHolderName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber" className="text-gray-300">
                    Bank Account Number <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="bankAccountNumber"
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => updateFormData({ bankAccountNumber: e.target.value })}
                    className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.bankAccountNumber ? 'border-red-500' : ''}`}
                    placeholder="e.g. 1234567890123456"
                    autoComplete="off"
                  />
                  {errors.bankAccountNumber && <p className="text-red-400 text-sm mt-1">{errors.bankAccountNumber}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName" className="text-gray-300">
                    Bank Name <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.bankName}
                    onValueChange={(value) => updateFormData({ bankName: value })}
                  >
                    <SelectTrigger className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.bankName ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {INDIAN_BANKS.map(bank => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bankName && <p className="text-red-400 text-sm mt-1">{errors.bankName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode" className="text-gray-300">
                    IFSC Code <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => updateFormData({ ifscCode: e.target.value.toUpperCase() })}
                      className={`bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20 ${errors.ifscCode ? 'border-red-500' : ''}`}
                      placeholder="e.g. SBIN0000123"
                      autoComplete="off"
                    />
                    {formData.ifscCode && (
                      <Badge
                        variant={isValidIFSC(formData.ifscCode) ? "default" : "destructive"}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                      >
                        {isValidIFSC(formData.ifscCode) ? "Valid" : "Invalid"}
                      </Badge>
                    )}
                  </div>
                  {errors.ifscCode && <p className="text-red-400 text-sm mt-1">{errors.ifscCode}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchName" className="text-gray-300">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={formData.branchName}
                    onChange={(e) => updateFormData({ branchName: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20"
                    placeholder="e.g. Connaught Place Branch"
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upiId" className="text-gray-300">UPI ID</Label>
                  <Input
                    id="upiId"
                    value={formData.upiId}
                    onChange={(e) => updateFormData({ upiId: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-gray-100 focus:border-purple-500 focus:ring-purple-500/20"
                    placeholder="e.g. 9876543210@paytm"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-xs flex items-center">
                  <Lock className="w-3 h-3 mr-2" />
                  Your bank details are encrypted and never shown to others.
                </p>
              </div>
            </div>
          </StepLayout>
        )

      case 5:
        return (
          <StepLayout
            title="Upload Documents"
            description="Please upload the required documents for verification"
          >
            <div className="space-y-8">
              {/* Required Documents */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="text-xl font-semibold text-white">Required Documents</h3>
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Aadhaar Card (Front) <span className="text-red-400">*</span></Label>
                    <FileDrop
                      label="Upload Aadhaar Card Front"
                      accept="image/*,.pdf"
                      documentType="aadhaar_front"
                      documents={formData.documents.aadhaarFront ? [formData.documents.aadhaarFront] : []}
                      onDocumentsUploaded={(documents) => updateFormData({
                        documents: { ...formData.documents, aadhaarFront: documents[0] || null }
                      })}
                      onRemoveDocument={() => updateFormData({
                        documents: { ...formData.documents, aadhaarFront: null }
                      })}
                      className={errors.aadhaarFront ? 'border-red-500' : ''}
                    />
                    {errors.aadhaarFront && <p className="text-red-400 text-sm mt-1">{errors.aadhaarFront}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Aadhaar Card (Back) <span className="text-red-400">*</span></Label>
                    <FileDrop
                      label="Upload Aadhaar Card Back"
                      accept="image/*,.pdf"
                      documentType="aadhaar_back"
                      documents={formData.documents.aadhaarBack ? [formData.documents.aadhaarBack] : []}
                      onDocumentsUploaded={(documents) => updateFormData({
                        documents: { ...formData.documents, aadhaarBack: documents[0] || null }
                      })}
                      onRemoveDocument={() => updateFormData({
                        documents: { ...formData.documents, aadhaarBack: null }
                      })}
                      className={errors.aadhaarBack ? 'border-red-500' : ''}
                    />
                    {errors.aadhaarBack && <p className="text-red-400 text-sm mt-1">{errors.aadhaarBack}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">PAN Card <span className="text-red-400">*</span></Label>
                    <FileDrop
                      label="Upload PAN Card"
                      accept="image/*,.pdf"
                      documentType="pan"
                      documents={formData.documents.pan ? [formData.documents.pan] : []}
                      onDocumentsUploaded={(documents) => updateFormData({
                        documents: { ...formData.documents, pan: documents[0] || null }
                      })}
                      onRemoveDocument={() => updateFormData({
                        documents: { ...formData.documents, pan: null }
                      })}
                      className={errors.pan ? 'border-red-500' : ''}
                    />
                    {errors.pan && <p className="text-red-400 text-sm mt-1">{errors.pan}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Bank Passbook Photo <span className="text-red-400">*</span></Label>
                    <FileDrop
                      label="Upload Bank Passbook"
                      accept="image/*"
                      documentType="bank_passbook"
                      documents={formData.documents.bankPassbook ? [formData.documents.bankPassbook] : []}
                      onDocumentsUploaded={(documents) => updateFormData({
                        documents: { ...formData.documents, bankPassbook: documents[0] || null }
                      })}
                      onRemoveDocument={() => updateFormData({
                        documents: { ...formData.documents, bankPassbook: null }
                      })}
                      className={errors.bankPassbook ? 'border-red-500' : ''}
                    />
                    {errors.bankPassbook && <p className="text-red-400 text-sm mt-1">{errors.bankPassbook}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Profile Photo <span className="text-red-400">*</span></Label>
                    <FileDrop
                      label="Upload Profile Photo"
                      accept="image/*"
                      documentType="profile_photo"
                      documents={formData.documents.profilePhoto ? [formData.documents.profilePhoto] : []}
                      onDocumentsUploaded={(documents) => updateFormData({
                        documents: { ...formData.documents, profilePhoto: documents[0] || null }
                      })}
                      onRemoveDocument={() => updateFormData({
                        documents: { ...formData.documents, profilePhoto: null }
                      })}
                      className={errors.profilePhoto ? 'border-red-500' : ''}
                    />
                    {errors.profilePhoto && <p className="text-red-400 text-sm mt-1">{errors.profilePhoto}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Education Certificates <span className="text-red-400">*</span></Label>
                  <FileDrop
                    label="Upload Education Certificates (Multiple files allowed)"
                    accept="image/*,.pdf"
                    documentType="education_certificate"
                    multiple
                    documents={formData.documents.education}
                    onDocumentsUploaded={(documents) => updateFormData({
                      documents: { ...formData.documents, education: [...formData.documents.education, ...documents] }
                    })}
                    onRemoveDocument={(index) => updateFormData({
                      documents: {
                        ...formData.documents,
                        education: formData.documents.education.filter((_, i) => i !== index)
                      }
                    })}
                    className={errors.education ? 'border-red-500' : ''}
                  />
                  {errors.education && <p className="text-red-400 text-sm mt-1">{errors.education}</p>}
                </div>
              </div>

              {/* Optional Documents */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="text-xl font-semibold text-white">Optional Documents</h3>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Resume/CV</Label>
                    <FileDrop
                      label="Upload Resume"
                      accept=".pdf,.doc,.docx"
                      documentType="resume"
                      documents={formData.documents.resume ? [formData.documents.resume] : []}
                      onDocumentsUploaded={(documents) => updateFormData({
                        documents: { ...formData.documents, resume: documents[0] || null }
                      })}
                      onRemoveDocument={() => updateFormData({
                        documents: { ...formData.documents, resume: null }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Other Documents</Label>
                    <FileDrop
                      label="Upload Other Documents (Multiple files allowed)"
                      accept="*/*"
                      documentType="other"
                      multiple
                      documents={formData.documents.other}
                      onDocumentsUploaded={(documents) => updateFormData({
                        documents: { ...formData.documents, other: [...formData.documents.other, ...documents] }
                      })}
                      onRemoveDocument={(index) => updateFormData({
                        documents: {
                          ...formData.documents,
                          other: formData.documents.other.filter((_, i) => i !== index)
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </StepLayout>
        )

      case 6:
        return (
          <StepLayout
            title="Review Your Information"
            description="Please review all information before submitting"
          >
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Full Name</p>
                      <p className="text-white">{formData.fullName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Email</p>
                      <p className="text-white">{formData.personalEmail || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Phone</p>
                      <p className="text-white">{formData.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Date of Birth</p>
                      <p className="text-white">{formData.dateOfBirth || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Gender</p>
                      <p className="text-white">{formData.gender || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Work Details */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Work Details</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(3)}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Designation</p>
                      <p className="text-white">{formData.designation || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Work Location</p>
                      <p className="text-white">{formData.workLocation || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Employment Type</p>
                      <p className="text-white">{formData.employmentType || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Joining Date</p>
                      <p className="text-white">{formData.joiningDate || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Bank Details</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(4)}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Account Holder Name</p>
                      <p className="text-white">{formData.accountHolderName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Bank Name</p>
                      <p className="text-white">{formData.bankName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Account Number</p>
                      <p className="text-white">
                        {formData.bankAccountNumber ? `****${formData.bankAccountNumber.slice(-4)}` : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">IFSC Code</p>
                      <p className="text-white">{formData.ifscCode || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Documents</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(5)}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aadhaar Card (Front)</span>
                      <span className="text-white">{formData.documents.aadhaarFront ? '✓ Uploaded' : '✗ Missing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aadhaar Card (Back)</span>
                      <span className="text-white">{formData.documents.aadhaarBack ? '✓ Uploaded' : '✗ Missing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">PAN Card</span>
                      <span className="text-white">{formData.documents.pan ? '✓ Uploaded' : '✗ Missing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bank Passbook</span>
                      <span className="text-white">{formData.documents.bankPassbook ? '✓ Uploaded' : '✗ Missing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Profile Photo</span>
                      <span className="text-white">{formData.documents.profilePhoto ? '✓ Uploaded' : '✗ Missing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Education Certificates</span>
                      <span className="text-white">{formData.documents.education.length > 0 ? `✓ ${formData.documents.education.length} files` : '✗ Missing'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Consents */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Legal Agreements</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="nda-consent"
                        checked={formData.ndaAccepted}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, ndaAccepted: checked === true }))
                        }
                        className="mt-1"
                      />
                      <label htmlFor="nda-consent" className="text-sm text-gray-300 leading-relaxed">
                        I agree to the <span className="text-purple-400 font-medium">Non-Disclosure Agreement (NDA)</span> and understand that I will handle all company information, trade secrets, and confidential data with utmost care and discretion.
                      </label>
                    </div>
                    {errors.ndaAccepted && (
                      <p className="text-red-400 text-sm ml-6">{errors.ndaAccepted}</p>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="privacy-consent"
                        checked={formData.dataPrivacyAccepted}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, dataPrivacyAccepted: checked === true }))
                        }
                        className="mt-1"
                      />
                      <label htmlFor="privacy-consent" className="text-sm text-gray-300 leading-relaxed">
                        I consent to the collection, processing, and storage of my personal data in accordance with the <span className="text-purple-400 font-medium">Data Privacy Policy</span> and applicable data protection laws.
                      </label>
                    </div>
                    {errors.dataPrivacyAccepted && (
                      <p className="text-red-400 text-sm ml-6">{errors.dataPrivacyAccepted}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </StepLayout>
        )

      default:
        return null
    }
  }

  // Show success screen after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.35)] rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 ring-2 ring-green-500/30">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Application Submitted Successfully!</h1>
              <p className="text-gray-300 text-lg mb-8">
                Thank you for applying to join Eraya Style. Your application has been received and is being reviewed by our HR team.
              </p>

              <div className="text-left space-y-4 mb-8">
                <h3 className="font-semibold text-white">What happens next?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-purple-500/30">
                      <span className="text-purple-400 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Application Review</p>
                      <p className="text-gray-400 text-sm">Our HR team will review your application and documents</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-purple-500/30">
                      <span className="text-purple-400 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Account Creation</p>
                      <p className="text-gray-400 text-sm">If approved, we'll create your company account</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-purple-500/30">
                      <span className="text-purple-400 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Welcome Email</p>
                      <p className="text-gray-400 text-sm">You'll receive login credentials via email</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                <p className="text-yellow-400 text-sm">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex">
      {/* Top Right Security Indicator */}
      <div className="absolute top-6 right-6 z-10">
        <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2">
          <Lock className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-medium">Secure application</span>
        </div>
      </div>

      {/* Desktop: Vertical Stepper */}
      <div className="hidden md:block">
        <VerticalStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          {/* Mobile: Progress Bar */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Step {currentStep} of {steps.length}</h2>
              <span className="text-gray-400 text-sm">{Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content Card */}
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.35)] rounded-2xl">
            <CardContent className="p-8">
              {renderStepContent()}
              
              <ActionBar
                currentStep={currentStep}
                totalSteps={steps.length}
                onBack={handleBack}
                onNext={handleNext}
                isLastStep={currentStep === steps.length}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}