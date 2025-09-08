// Employee Onboarding System Types

export interface OnboardingFormData {
  // Step 1: Basic Information
  full_name: string
  personal_email: string
  phone?: string

  // Step 2: Address & Emergency
  addresses: {
    current?: {
      street?: string
      city?: string
      state?: string
      pin?: string
    }
    permanent?: {
      street?: string
      city?: string
      state?: string
      pin?: string
    }
    same_as_current?: boolean
  }
  emergency: {
    name?: string
    relationship?: string
    phone?: string
    email?: string
  }

  // Step 3: Work Details
  designation?: string
  work_location: string
  employment_type: string
  joined_at?: string

  // Step 4: Documents
  documents: DocumentUpload[]
  notes?: string
}

export interface DocumentUpload {
  type: DocumentType
  filename: string
  path: string
  size: number
  mime_type: string
  uploaded_at: string
  signed_url?: string
}

export type DocumentType = 
  | 'Aadhaar'
  | 'PAN'
  | 'BankProof'
  | 'Education'
  | 'Experience'
  | 'Resume'
  | 'Photo'
  | 'Other'

export interface OnboardingApplicant {
  id: string
  status: 'submitted' | 'approved' | 'rejected' | 'withdrawn'
  full_name: string
  personal_email: string
  phone?: string
  designation?: string
  work_location: string
  employment_type: string
  joined_at?: string
  addresses: Record<string, any>
  emergency: Record<string, any>
  documents: DocumentUpload[]
  notes?: string
  mapped_app_user_id?: string
  created_at: string
  updated_at: string
}

export interface ApprovalFormData {
  applicant_id: string
  company_email: string
  role: string
  department: string
  set_active: boolean
}

// API Response Types
export interface OnboardingSubmissionResponse {
  ok: boolean
  data?: {
    applicant_id: string
    message: string
    status: string
  }
  error?: {
    message: string
    errors?: Array<{
      field: string
      message: string
    }>
  }
  timestamp: string
}

export interface DocumentUploadResponse {
  ok: boolean
  data?: {
    path: string
    type: string
    filename: string
    size: number
    mime_type: string
    signed_url?: string
    uploaded_at: string
  }
  error?: {
    message: string
  }
  timestamp: string
}

export interface ApprovalResponse {
  ok: boolean
  data?: {
    app_user_id: string
    auth_user_id: string
    company_email: string
    temp_password: string
    tempPasswordSet: boolean
    status: string
    message: string
  }
  error?: {
    message: string
  }
  timestamp: string
}

// Form Step Configuration
export interface FormStep {
  id: number
  title: string
  description: string
  icon: React.ComponentType
  isValid?: boolean
  isOptional?: boolean
}

// Constants
export const WORK_LOCATIONS = ['Patna', 'Delhi', 'Remote', 'Hybrid'] as const
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Intern', 'Contractor'] as const
export const USER_ROLES = ['employee', 'intern', 'manager', 'admin'] as const
export const DEPARTMENTS = [
  'Content',
  'Fulfillment', 
  'Support',
  'Marketing',
  'Finance',
  'Admin',
  'Ops',
  'HR',
  'IT'
] as const

export const DOCUMENT_TYPES: Array<{value: DocumentType, label: string, description: string}> = [
  { value: 'Aadhaar', label: 'Aadhaar Card', description: 'Government issued identity proof' },
  { value: 'PAN', label: 'PAN Card', description: 'Permanent Account Number card' },
  { value: 'BankProof', label: 'Bank Account Proof', description: 'Bank statement or passbook' },
  { value: 'Education', label: 'Education Certificates', description: 'Degree/diploma certificates' },
  { value: 'Experience', label: 'Experience Letters', description: 'Previous employment proof' },
  { value: 'Resume', label: 'Resume/CV', description: 'Current resume or CV' },
  { value: 'Photo', label: 'Passport Photo', description: 'Recent passport size photo' },
  { value: 'Other', label: 'Other Documents', description: 'Any other relevant documents' }
]

export const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Spouse',
  'Brother',
  'Sister',
  'Son',
  'Daughter',
  'Friend',
  'Other'
] as const