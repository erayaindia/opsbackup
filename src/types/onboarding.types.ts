// Employee Onboarding System Types

export interface OnboardingFormData {
  // Step 1: Basic Information
  full_name: string
  personal_email: string
  phone?: string
  date_of_birth: string
  gender: 'Male' | 'Female'

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

  // Step 4: Bank Details
  bank_details: {
    account_number?: string
    account_holder_name?: string
    bank_name?: string
    ifsc_code?: string
    branch_name?: string
    upi_id?: string
  }

  // Step 5: Documents
  documents: DocumentUpload[]
  notes?: string

  // Legal Consents
  ndaAccepted: boolean
  dataPrivacyAccepted: boolean
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
  | 'Aadhaar Front'
  | 'Aadhaar Back'
  | 'PAN'
  | 'BankPassbook'
  | 'Education'
  | 'Resume'
  | 'Photo'
  | 'Other'

export interface OnboardingApplicant {
  id: string
  status: 'submitted' | 'approved' | 'rejected' | 'withdrawn'
  full_name: string
  personal_email: string
  phone?: string
  date_of_birth?: string
  gender?: 'Male' | 'Female'
  designation?: string
  work_location: string
  employment_type: string
  joined_at?: string
  addresses: Record<string, any>
  emergency: Record<string, any>
  bank_details: Record<string, any>
  documents: DocumentUpload[]
  notes?: string
  mapped_app_user_id?: string
  created_at: string
  updated_at: string
  nda_accepted?: boolean
  data_privacy_accepted?: boolean
  nda_accepted_at?: string
  data_privacy_accepted_at?: string
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

export const DOCUMENT_TYPES: Array<{value: DocumentType, label: string, description: string, required: boolean, allowMultiple?: boolean}> = [
  { value: 'Aadhaar Front', label: 'Aadhaar Card (Front)', description: 'Clear photo of Aadhaar card front side (Required)', required: true },
  { value: 'Aadhaar Back', label: 'Aadhaar Card (Back)', description: 'Clear photo of Aadhaar card back side (Required)', required: true },
  { value: 'PAN', label: 'PAN Card', description: 'Permanent Account Number card (Required)', required: true },
  { value: 'BankPassbook', label: 'Bank Passbook Photo', description: 'Clear photo of bank passbook front page (Required)', required: true },
  { value: 'Photo', label: 'Profile Photo', description: 'Your clear photo for profile (Required)', required: true },
  { value: 'Education', label: 'Education Certificates', description: 'Degree/diploma certificates (Required - can upload multiple)', required: true, allowMultiple: true },
  { value: 'Resume', label: 'Resume/CV', description: 'Current resume or CV (Optional)', required: false },
  { value: 'Other', label: 'Other Documents', description: 'Any other relevant documents (Optional)', required: false, allowMultiple: true }
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

export const INDIAN_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank', 
  'Axis Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Bank of India',
  'Indian Bank',
  'Central Bank of India',
  'IDBI Bank',
  'UCO Bank',
  'Indian Overseas Bank',
  'Punjab & Sind Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Yes Bank',
  'Federal Bank',
  'South Indian Bank',
  'Karur Vysya Bank',
  'Tamilnad Mercantile Bank',
  'City Union Bank',
  'DCB Bank',
  'RBL Bank',
  'Bandhan Bank',
  'AU Small Finance Bank',
  'Equitas Small Finance Bank',
  'Jana Small Finance Bank',
  'Paytm Payments Bank',
  'Airtel Payments Bank',
  'Other'
] as const

export const GENDERS = ['Male', 'Female'] as const

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
] as const