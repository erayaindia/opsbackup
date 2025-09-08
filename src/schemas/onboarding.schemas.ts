import { z } from 'zod'
import { WORK_LOCATIONS, EMPLOYMENT_TYPES, USER_ROLES, DEPARTMENTS, RELATIONSHIPS } from '@/types/onboarding.types'

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
    .regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal(''))
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
    name: z.string().min(2, 'Emergency contact name is required').optional(),
    relationship: z.enum(RELATIONSHIPS).optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number')
      .optional()
      .or(z.literal('')),
    email: z.string().email('Please enter a valid email').optional().or(z.literal(''))
  }).default({})
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
    .enum(WORK_LOCATIONS)
    .default('Patna'),
  employment_type: z
    .enum(EMPLOYMENT_TYPES)
    .default('Full-time'),
  joined_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
    .optional()
    .or(z.literal(''))
})

// Step 4: Documents Schema
export const documentsSchema = z.object({
  documents: z.array(z.object({
    type: z.string(),
    filename: z.string(),
    path: z.string(),
    size: z.number(),
    mime_type: z.string(),
    uploaded_at: z.string(),
    signed_url: z.string().optional()
  })).default([]),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal(''))
})

// Complete Form Schema
export const onboardingFormSchema = z.object({
  ...basicInfoSchema.shape,
  ...addressEmergencySchema.shape,
  ...workDetailsSchema.shape,
  ...documentsSchema.shape
})

// Admin Approval Schema
export const approvalFormSchema = z.object({
  applicant_id: z.string().uuid('Invalid applicant ID'),
  company_email: z
    .string()
    .email('Please enter a valid email address')
    .refine(email => email.endsWith('@erayastyle.com'), 'Email must end with @erayastyle.com')
    .transform(val => val.toLowerCase()),
  role: z.enum(USER_ROLES),
  department: z.enum(DEPARTMENTS),
  set_active: z.boolean().default(false)
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
export type DocumentsFormData = z.infer<typeof documentsSchema>
export type OnboardingFormData = z.infer<typeof onboardingFormSchema>
export type ApprovalFormData = z.infer<typeof approvalFormSchema>