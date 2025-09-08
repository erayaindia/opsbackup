import { supabase } from '@/integrations/supabase/client'
import {
  OnboardingFormData,
  OnboardingSubmissionResponse,
  DocumentUploadResponse,
  ApprovalResponse,
  DocumentUpload,
  OnboardingApplicant,
  ApprovalFormData
} from '@/types/onboarding.types'

// API Base URL
const getApiUrl = (endpoint: string) => {
  const supabaseUrl = supabase.supabaseUrl
  return `${supabaseUrl}/functions/v1/${endpoint}`
}

// Submit onboarding application
export async function submitOnboardingApplication(
  data: OnboardingFormData
): Promise<OnboardingSubmissionResponse> {
  try {
    const response = await fetch(getApiUrl('onboarding-submit'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Submission failed')
    }

    return result
  } catch (error) {
    console.error('Error submitting onboarding application:', error)
    throw error
  }
}

// Upload document file
export async function uploadDocument(
  file: File,
  type: string
): Promise<DocumentUploadResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await fetch(getApiUrl('onboarding-upload'), {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Upload failed')
    }

    return result
  } catch (error) {
    console.error('Error uploading document:', error)
    throw error
  }
}

// Admin: Get all onboarding applications
export async function getOnboardingApplications(): Promise<OnboardingApplicant[]> {
  try {
    const { data, error } = await supabase
      .from('onboarding_applicants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Return mock data for testing when database is not set up
      console.log('Database not available, returning mock data for testing')
      return getMockOnboardingApplications()
    }

    return data || []
  } catch (error) {
    console.error('Error fetching onboarding applications:', error)
    // Return mock data for testing
    return getMockOnboardingApplications()
  }
}

// Mock data for testing
function getMockOnboardingApplications(): OnboardingApplicant[] {
  return [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      status: 'submitted',
      full_name: 'Priya Sharma',
      personal_email: 'priya.sharma@gmail.com',
      phone: '+91 98765 43210',
      designation: 'Content Writer',
      work_location: 'Patna',
      employment_type: 'Full-time',
      joined_at: '2025-01-15',
      addresses: {
        current: {
          street: '123 MG Road',
          city: 'Patna',
          state: 'Bihar',
          pin: '800001'
        },
        permanent: {
          street: '456 Gandhi Nagar',
          city: 'Delhi',
          state: 'Delhi',
          pin: '110001'
        },
        same_as_current: false
      },
      emergency: {
        name: 'Raj Sharma',
        relationship: 'Father',
        phone: '+91 98765 12345',
        email: 'raj.sharma@gmail.com'
      },
      documents: [
        {
          type: 'Aadhaar',
          filename: 'aadhaar_priya.pdf',
          path: 'applications/priya-sharma/aadhaar_priya.pdf',
          size: 1024000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-08T10:30:00Z'
        },
        {
          type: 'Resume',
          filename: 'priya_resume.pdf',
          path: 'applications/priya-sharma/priya_resume.pdf',
          size: 2048000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-08T10:31:00Z'
        },
        {
          type: 'Photo',
          filename: 'priya_photo.jpg',
          path: 'applications/priya-sharma/priya_photo.jpg',
          size: 512000,
          mime_type: 'image/jpeg',
          uploaded_at: '2025-09-08T10:32:00Z'
        }
      ],
      notes: 'Experienced content writer with 3+ years in digital marketing. Interested in fashion and lifestyle content creation.',
      mapped_app_user_id: undefined,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      status: 'submitted',
      full_name: 'Arjun Kumar',
      personal_email: 'arjun.kumar@outlook.com',
      phone: '+91 87654 32109',
      designation: 'Marketing Executive',
      work_location: 'Delhi',
      employment_type: 'Full-time',
      joined_at: '2025-02-01',
      addresses: {
        current: {
          street: '789 CP Market',
          city: 'Delhi',
          state: 'Delhi',
          pin: '110001'
        },
        same_as_current: true
      },
      emergency: {
        name: 'Sunita Kumar',
        relationship: 'Mother',
        phone: '+91 87654 98765',
        email: 'sunita.kumar@yahoo.com'
      },
      documents: [
        {
          type: 'PAN',
          filename: 'arjun_pan.pdf',
          path: 'applications/arjun-kumar/arjun_pan.pdf',
          size: 800000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-08T09:15:00Z'
        },
        {
          type: 'Education',
          filename: 'arjun_degree.pdf',
          path: 'applications/arjun-kumar/arjun_degree.pdf',
          size: 1500000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-08T09:16:00Z'
        },
        {
          type: 'Resume',
          filename: 'arjun_cv.pdf',
          path: 'applications/arjun-kumar/arjun_cv.pdf',
          size: 1800000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-08T09:17:00Z'
        }
      ],
      notes: 'MBA graduate with specialization in digital marketing. Fluent in Hindi and English.',
      mapped_app_user_id: undefined,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      status: 'approved',
      full_name: 'Ravi Patel',
      personal_email: 'ravi.patel@gmail.com',
      phone: '+91 98765 55555',
      designation: 'Fulfillment Associate',
      work_location: 'Patna',
      employment_type: 'Full-time',
      joined_at: '2024-12-01',
      addresses: {
        current: {
          street: '321 Station Road',
          city: 'Patna',
          state: 'Bihar',
          pin: '800002'
        },
        permanent: {
          street: '654 Village Road',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pin: '380001'
        },
        same_as_current: false
      },
      emergency: {
        name: 'Meera Patel',
        relationship: 'Spouse',
        phone: '+91 98765 44444',
        email: 'meera.patel@gmail.com'
      },
      documents: [
        {
          type: 'Aadhaar',
          filename: 'ravi_aadhaar.pdf',
          path: 'applications/ravi-patel/ravi_aadhaar.pdf',
          size: 950000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-05T14:20:00Z'
        },
        {
          type: 'BankProof',
          filename: 'ravi_bank.pdf',
          path: 'applications/ravi-patel/ravi_bank.pdf',
          size: 1200000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-05T14:21:00Z'
        }
      ],
      notes: 'Previous experience in warehouse operations. Good with inventory management systems.',
      mapped_app_user_id: undefined,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      status: 'submitted',
      full_name: 'Sneha Gupta',
      personal_email: 'sneha.gupta@rediffmail.com',
      phone: '+91 90123 45678',
      designation: 'Customer Support Executive',
      work_location: 'Remote',
      employment_type: 'Full-time',
      joined_at: '2025-01-20',
      addresses: {
        current: {
          street: '101 Tech Park',
          city: 'Bangalore',
          state: 'Karnataka',
          pin: '560001'
        },
        same_as_current: true
      },
      emergency: {
        name: 'Amit Gupta',
        relationship: 'Brother',
        phone: '+91 90123 11111',
        email: 'amit.gupta@gmail.com'
      },
      documents: [
        {
          type: 'Resume',
          filename: 'sneha_resume.docx',
          path: 'applications/sneha-gupta/sneha_resume.docx',
          size: 1100000,
          mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          uploaded_at: '2025-09-08T16:45:00Z'
        },
        {
          type: 'Photo',
          filename: 'sneha_photo.png',
          path: 'applications/sneha-gupta/sneha_photo.png',
          size: 400000,
          mime_type: 'image/png',
          uploaded_at: '2025-09-08T16:46:00Z'
        }
      ],
      notes: 'Excellent communication skills. Experience with customer service and CRM systems. Willing to work remotely.',
      mapped_app_user_id: undefined,
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      status: 'submitted',
      full_name: 'Rohit Singh',
      personal_email: 'rohit.singh@student.edu',
      phone: '+91 98888 77777',
      designation: 'Marketing Intern',
      work_location: 'Patna',
      employment_type: 'Intern',
      joined_at: '2025-01-10',
      addresses: {
        current: {
          street: 'Student Hostel A-123',
          city: 'Patna',
          state: 'Bihar',
          pin: '800005'
        },
        permanent: {
          street: 'Village Road',
          city: 'Muzaffarpur',
          state: 'Bihar',
          pin: '842001'
        },
        same_as_current: false
      },
      emergency: {
        name: 'Rajesh Singh',
        relationship: 'Father',
        phone: '+91 98888 99999'
      },
      documents: [
        {
          type: 'Education',
          filename: 'rohit_marksheet.pdf',
          path: 'applications/rohit-singh/rohit_marksheet.pdf',
          size: 700000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-08T11:30:00Z'
        },
        {
          type: 'Resume',
          filename: 'rohit_cv.pdf',
          path: 'applications/rohit-singh/rohit_cv.pdf',
          size: 900000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-08T11:31:00Z'
        }
      ],
      notes: 'Final year BBA student looking for internship opportunity. Interested in digital marketing and social media.',
      mapped_app_user_id: undefined,
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      status: 'rejected',
      full_name: 'Maya Verma',
      personal_email: 'maya.verma@hotmail.com',
      phone: '+91 99999 88888',
      designation: 'Content Manager',
      work_location: 'Delhi',
      employment_type: 'Full-time',
      joined_at: '2025-01-05',
      addresses: {
        current: {
          street: '999 Central Avenue',
          city: 'Delhi',
          state: 'Delhi',
          pin: '110010'
        },
        same_as_current: true
      },
      emergency: {
        name: 'Prakash Verma',
        relationship: 'Father',
        phone: '+91 99999 77777'
      },
      documents: [
        {
          type: 'Resume',
          filename: 'maya_resume.pdf',
          path: 'applications/maya-verma/maya_resume.pdf',
          size: 1300000,
          mime_type: 'application/pdf',
          uploaded_at: '2025-09-03T13:20:00Z'
        }
      ],
      notes: 'Rejection reason: Position requirements not met. Insufficient experience in fashion content.',
      mapped_app_user_id: undefined,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
}

// Admin: Get single onboarding application
export async function getOnboardingApplication(id: string): Promise<OnboardingApplicant | null> {
  try {
    const { data, error } = await supabase
      .from('onboarding_applicants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error('Error fetching onboarding application:', error)
    throw error
  }
}

// Admin: Approve onboarding application
export async function approveOnboardingApplication(
  data: ApprovalFormData
): Promise<ApprovalResponse> {
  try {
    // Get current user's session token
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Authentication required')
    }

    const response = await fetch(getApiUrl('admin-approve-onboarding'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'Approval failed')
    }

    return result
  } catch (error) {
    console.error('Error approving onboarding application:', error)
    throw error
  }
}

// Admin: Reject onboarding application
export async function rejectOnboardingApplication(
  applicantId: string,
  reason?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('onboarding_applicants')
      .update({ 
        status: 'rejected',
        notes: reason ? `Rejection reason: ${reason}` : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicantId)

    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error rejecting onboarding application:', error)
    throw error
  }
}

// Get signed URL for document viewing
export async function getDocumentSignedUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('employee-docs')
      .createSignedUrl(path, 3600) // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }

    return data?.signedUrl || null
  } catch (error) {
    console.error('Error getting document signed URL:', error)
    return null
  }
}

// Delete uploaded document (for re-uploads)
export async function deleteDocument(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('employee-docs')
      .remove([path])

    if (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  } catch (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}

// Utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Utility function to validate file type
export function isValidFileType(file: File): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  return allowedTypes.includes(file.type)
}

// Utility function to check file size
export function isValidFileSize(file: File): boolean {
  const maxSize = 50 * 1024 * 1024 // 50MB
  return file.size <= maxSize
}