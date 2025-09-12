import { z } from 'zod'
import { WORK_LOCATIONS, EMPLOYMENT_TYPES, USER_ROLES, DEPARTMENTS, RELATIONSHIPS, INDIAN_BANKS, GENDERS } from '@/types/onboarding.types'

// Step 1: Basic Information Schema
export const basicInfoSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\.']+$/, 'Full name can only contain letters, spaces, and periods'),
  personal_email: z
    .string()
    .email('Please enter a valid email address')
    .transform(val => val.toLowerCase()),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number'),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 18 && age <= 80
    }, 'Age must be between 18 and 80 years'),
  gender: z.enum(GENDERS)
})

// Step 2: Address & Emergency Schema
export const addressEmergencySchema = z.object({
  addresses: z.object({
    current: z.object({
      street: z.string().min(1, 'Street address is required').optional(),
      city: z.string().min(1, 'City is required').optional(),
      state: z.string().min(1, 'State is required').optional(),
      pin: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits').optional()
    }).optional(),
    permanent: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pin: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits').optional()
    }).optional(),
    same_as_current: z.boolean().default(false)
  }).default({}),
  emergency: z.object({
    name: z.string().min(2, 'Emergency contact name is required'),
    relationship: z.enum(RELATIONSHIPS),
    phone: z
      .string()
      .min(1, 'Emergency contact phone is required')
      .regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number'),
    email: z.string().email('Please enter a valid email').optional().or(z.literal(''))
  }).default({})
  .refine((data) => {
    return true; // Will add phone validation in complete form schema
  })
})

// Step 3: Work Details Schema
export const workDetailsSchema = z.object({
  designation: z
    .string()
    .min(2, 'Designation must be at least 2 characters')
    .max(100, 'Designation must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  work_location: z
    .enum(WORK_LOCATIONS),
  employment_type: z
    .enum(EMPLOYMENT_TYPES),
  joined_at: z
    .string()
    .min(1, 'Joining date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
})

// Step 4: Bank Details Schema
export const bankDetailsSchema = z.object({
  bank_details: z.object({
    account_number: z
      .string()
      .min(1, 'Account number is required')
      .min(8, 'Account number must be at least 8 digits')
      .max(20, 'Account number must be less than 20 digits')
      .regex(/^\d+$/, 'Account number should contain only digits'),
    account_holder_name: z
      .string()
      .min(1, 'Account holder name is required')
      .min(2, 'Account holder name must be at least 2 characters')
      .max(100, 'Account holder name must be less than 100 characters')
      .regex(/^[a-zA-Z\s\.]+$/, 'Account holder name can only contain letters, spaces, and periods'),
    bank_name: z
      .string()
      .min(1, 'Bank name is required'),
    ifsc_code: z
      .string()
      .min(1, 'IFSC code is required')
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code (e.g., SBIN0000123)'),
    branch_name: z
      .string()
      .min(2, 'Branch name must be at least 2 characters')
      .max(100, 'Branch name must be less than 100 characters')
      .optional()
      .or(z.literal('')),
    upi_id: z
      .string()
      .regex(/^[\w.-]+@[\w.-]+$/, 'Please enter a valid UPI ID (e.g., username@paytm)')
      .optional()
      .or(z.literal(''))
  }).default({})
})

// Step 5: Documents Schema
export const documentsSchema = z.object({
  documents: z.array(z.object({
    type: z.string(),
    filename: z.string(),
    path: z.string(),
    size: z.number(),
    mime_type: z.string(),
    uploaded_at: z.string(),
    signed_url: z.string().optional()
  })).default([])
  .refine((docs) => {
    const requiredTypes = ['Aadhaar Front', 'Aadhaar Back', 'PAN', 'BankPassbook', 'Photo', 'Education'];
    const uploadedTypes = docs.map(doc => doc.type);
    return requiredTypes.every(type => uploadedTypes.includes(type));
  }, {
    message: 'Please upload all required documents: Aadhaar Card Front, Aadhaar Card Back, PAN Card, Bank Passbook Photo, Profile Photo, and Education Certificates'
  }),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  ndaAccepted: z
    .boolean()
    .refine(val => val === true, 'You must accept the NDA agreement to proceed'),
  dataPrivacyAccepted: z
    .boolean()
    .refine(val => val === true, 'You must accept the Data Privacy agreement to proceed')
})

// Complete Form Schema
export const onboardingFormSchema = z.object({
  ...basicInfoSchema.shape,
  ...addressEmergencySchema.shape,
  ...workDetailsSchema.shape,
  ...bankDetailsSchema.shape,
  ...documentsSchema.shape
})
.refine((data) => {
  // Validate emergency contact phone is different from user phone
  const userPhone = data.phone?.replace(/[\s\-\(\)]/g, '');
  const emergencyPhone = data.emergency?.phone?.replace(/[\s\-\(\)]/g, '');
  
  if (userPhone && emergencyPhone && userPhone === emergencyPhone) {
    return false;
  }
  return true;
}, {
  message: 'Emergency contact phone number must be different from your phone number',
  path: ['emergency', 'phone']
})

// Admin Approval Schema
export const approvalFormSchema = z.object({
  applicant_id: z.string().uuid('Invalid applicant ID'),
  company_email: z
    .string()
    .email('Please enter a valid email address')
    .refine(email => email.endsWith('@erayastyle.com'), 'Email must end with @erayastyle.com')
    .transform(val => val.toLowerCase())
    .optional()
    .or(z.literal('')), // Make company email optional
  role: z.enum(USER_ROLES),
  department: z.enum(DEPARTMENTS),
  set_active: z.boolean().default(false),
  temp_password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be less than 50 characters')
})

// Validation helper functions
export const validateStep = (step: number, data: any) => {
  switch (step) {
    case 1:
      return basicInfoSchema.safeParse(data)
    case 2:
      return addressEmergencySchema.safeParse(data)
    case 3:
      return workDetailsSchema.safeParse(data)
    case 4:
      return bankDetailsSchema.safeParse(data)
    case 5:
      return documentsSchema.safeParse(data)
    default:
      return { success: false, error: { message: 'Invalid step' } }
  }
}

export const validateFullForm = (data: any) => {
  return onboardingFormSchema.safeParse(data)
}

export const validateApproval = (data: any) => {
  return approvalFormSchema.safeParse(data)
}

// Type exports
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>
export type AddressEmergencyFormData = z.infer<typeof addressEmergencySchema>
export type WorkDetailsFormData = z.infer<typeof workDetailsSchema>
export type BankDetailsFormData = z.infer<typeof bankDetailsSchema>
export type DocumentsFormData = z.infer<typeof documentsSchema>
export type OnboardingFormData = z.infer<typeof onboardingFormSchema>
export type ApprovalFormData = z.infer<typeof approvalFormSchema>