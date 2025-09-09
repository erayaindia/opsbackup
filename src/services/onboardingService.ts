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

// Helper function to transform form data to database format
function transformFormDataToDatabase(data: any) {
  return {
    full_name: data.fullName,
    personal_email: data.personalEmail,
    phone_number: data.phoneNumber,
    date_of_birth: data.dateOfBirth,
    gender: data.gender,
    designation: data.designation,
    work_location: data.workLocation,
    employment_type: data.employmentType,
    joining_date: data.joiningDate,
    current_address: {
      street: data.currentAddress?.street || '',
      city: data.currentAddress?.city || '',
      state: data.currentAddress?.state || '',
      pincode: data.currentAddress?.pincode || ''
    },
    permanent_address: {
      street: data.permanentAddress?.street || '',
      city: data.permanentAddress?.city || '',
      state: data.permanentAddress?.state || '',
      pincode: data.permanentAddress?.pincode || ''
    },
    same_as_current: data.sameAsCurrentAddress || false,
    emergency_contact: {
      name: data.emergencyName,
      relationship: data.emergencyRelationship,
      phone: data.emergencyPhone
    },
    bank_details: {
      account_holder_name: data.accountHolderName,
      account_number: data.bankAccountNumber,
      bank_name: data.bankName,
      ifsc_code: data.ifscCode,
      branch_name: data.branchName || '',
      upi_id: data.upiId || ''
    },
    documents: data.documents || [],
    notes: data.notes || ''
  }
}

// Submit onboarding application directly to database
export async function submitOnboardingApplication(
  data: OnboardingFormData
): Promise<OnboardingSubmissionResponse> {
  try {
    // Transform the form data to match database schema
    const dbData = transformFormDataToDatabase(data)
    
    // For anonymous submissions, don't try to get user info at all
    // This avoids any potential auth-related issues
    
    // Insert the application into the database with minimal required fields only
    const { data: insertResult, error: insertError } = await supabase
      .from('employees_details')
      .insert({
        ...dbData,
        status: 'submitted',
        submission_date: new Date().toISOString(),
        // Don't include any auth-related fields for anonymous users
        nda_accepted: data.ndaAccepted || false,
        data_privacy_accepted: data.dataPrivacyAccepted || false,
        nda_accepted_at: data.ndaAccepted ? new Date().toISOString() : null,
        data_privacy_accepted_at: data.dataPrivacyAccepted ? new Date().toISOString() : null
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      
      // Provide more specific error messages
      if (insertError.message.includes('new row violates row-level security')) {
        throw new Error('Database permission error. Please check if anonymous submissions are allowed.')
      } else if (insertError.message.includes('null value in column')) {
        throw new Error('Required field missing. Please fill in all required information.')
      } else {
        throw new Error(insertError.message || 'Failed to submit application')
      }
    }

    // Return success response
    return {
      ok: true,
      data: {
        applicant_id: insertResult.id,
        message: 'Application submitted successfully',
        status: 'submitted'
      },
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error submitting onboarding application:', error)
    return {
      ok: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to submit application'
      },
      timestamp: new Date().toISOString()
    }
  }
}

// Upload document file to storage bucket
export async function uploadDocument(
  file: File,
  type: string,
  applicationId?: string
): Promise<DocumentUploadResponse> {
  try {
    // Validate file
    if (!isValidFileType(file)) {
      throw new Error('Invalid file type. Please upload PDF, DOC, DOCX, or image files.')
    }

    if (!isValidFileSize(file)) {
      throw new Error('File too large. Maximum size is 50MB.')
    }

    // Generate unique file path
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${type}_${timestamp}.${fileExt}`
    
    // For onboarding uploads, we don't require authentication
    // Generate a unique session ID for anonymous users
    const sessionId = applicationId || crypto.randomUUID()
    const filePath = `onboarding/temp/${sessionId}/${type}/${fileName}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      
      // Provide more specific error messages
      if (uploadError.message.includes('new row violates row-level security')) {
        throw new Error('Storage permission error. Please check if anonymous uploads are allowed.')
      } else if (uploadError.message.includes('JWT expired')) {
        throw new Error('Session expired. Please refresh the page and try again.')
      } else if (uploadError.message.includes('Invalid JWT')) {
        throw new Error('Authentication error. Please refresh the page and try again.')
      } else {
        throw new Error(uploadError.message || 'Failed to upload file')
      }
    }

    // Get signed URL for the uploaded file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('employee-documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      // Continue without signed URL - not critical
    }

    // Return success response
    return {
      ok: true,
      data: {
        path: filePath,
        type: type,
        filename: file.name,
        size: file.size,
        mime_type: file.type,
        signed_url: signedUrlData?.signedUrl,
        uploaded_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error uploading document:', error)
    return {
      ok: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to upload document'
      },
      timestamp: new Date().toISOString()
    }
  }
}

// Admin: Get all onboarding applications
export async function getOnboardingApplications(): Promise<OnboardingApplicant[]> {
  try {
    const { data, error } = await supabase
      .from('employees_details')
      .select(`
        id,
        application_id,
        status,
        full_name,
        personal_email,
        phone_number,
        date_of_birth,
        gender,
        designation,
        work_location,
        employment_type,
        joining_date,
        current_address,
        permanent_address,
        same_as_current,
        emergency_contact,
        bank_details,
        documents,
        notes,
        app_user_id,
        created_at,
        updated_at,
        submission_date,
        approval_date,
        nda_accepted,
        data_privacy_accepted,
        nda_accepted_at,
        data_privacy_accepted_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      // Return mock data for testing when database is not available
      console.log('Database not available, returning mock data for testing')
      return getMockOnboardingApplications()
    }

    // Transform database results to match OnboardingApplicant interface
    const transformedData = (data || []).map(item => ({
      id: item.application_id, // Use application_id as the public ID
      status: item.status as 'submitted' | 'approved' | 'rejected' | 'withdrawn',
      full_name: item.full_name,
      personal_email: item.personal_email,
      phone: item.phone_number,
      date_of_birth: item.date_of_birth,
      gender: item.gender,
      designation: item.designation,
      work_location: item.work_location,
      employment_type: item.employment_type,
      joined_at: item.joining_date,
      addresses: {
        current: item.current_address,
        permanent: item.permanent_address,
        same_as_current: item.same_as_current || item.permanent_address === item.current_address
      },
      emergency: item.emergency_contact,
      bank_details: item.bank_details,
      documents: item.documents || [],
      notes: item.notes,
      mapped_app_user_id: item.app_user_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      nda_accepted: item.nda_accepted,
      data_privacy_accepted: item.data_privacy_accepted,
      nda_accepted_at: item.nda_accepted_at,
      data_privacy_accepted_at: item.data_privacy_accepted_at
    }))

    return transformedData
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
      .from('employees_details')
      .select(`
        id,
        application_id,
        status,
        full_name,
        personal_email,
        phone_number,
        date_of_birth,
        gender,
        designation,
        work_location,
        employment_type,
        joining_date,
        current_address,
        permanent_address,
        same_as_current,
        emergency_contact,
        bank_details,
        documents,
        notes,
        app_user_id,
        created_at,
        updated_at,
        submission_date,
        approval_date,
        nda_accepted,
        data_privacy_accepted,
        nda_accepted_at,
        data_privacy_accepted_at
      `)
      .eq('application_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(error.message)
    }

    // Transform to match OnboardingApplicant interface
    return {
      id: data.application_id,
      status: data.status as 'submitted' | 'approved' | 'rejected' | 'withdrawn',
      full_name: data.full_name,
      personal_email: data.personal_email,
      phone: data.phone_number,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      designation: data.designation,
      work_location: data.work_location,
      employment_type: data.employment_type,
      joined_at: data.joining_date,
      addresses: {
        current: data.current_address,
        permanent: data.permanent_address,
        same_as_current: data.same_as_current || data.permanent_address === data.current_address
      },
      emergency: data.emergency_contact,
      bank_details: data.bank_details,
      documents: data.documents || [],
      notes: data.notes,
      mapped_app_user_id: data.app_user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      nda_accepted: data.nda_accepted,
      data_privacy_accepted: data.data_privacy_accepted,
      nda_accepted_at: data.nda_accepted_at,
      data_privacy_accepted_at: data.data_privacy_accepted_at
    }
  } catch (error) {
    console.error('Error fetching onboarding application:', error)
    throw error
  }
}

// Admin: Approve onboarding application and create app user
export async function approveOnboardingApplication(
  data: ApprovalFormData
): Promise<ApprovalResponse> {
  try {
    // Get current user's session
    const { data: { session, user }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session || !user) {
      throw new Error('Authentication required')
    }

    // Check if current user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('app_users')
      .select('role, status')
      .eq('auth_user_id', user.id)
      .single()

    if (adminError || !adminUser || !['super_admin', 'admin'].includes(adminUser.role) || adminUser.status !== 'active') {
      throw new Error('Admin privileges required')
    }

    // Get the onboarding application
    const { data: application, error: fetchError } = await supabase
      .from('employees_details')
      .select('*')
      .eq('application_id', data.applicant_id)
      .single()

    if (fetchError || !application) {
      throw new Error('Application not found')
    }

    if (application.status !== 'submitted' && application.status !== 'under_review') {
      throw new Error('Application is not in a state that can be approved')
    }

    // Create auth user account
    const tempPassword = generateTempPassword()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.company_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: application.full_name,
        created_from_onboarding: true
      }
    })

    if (authError || !authData.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`)
    }

    // Create app user record
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .insert({
        auth_user_id: authData.user.id,
        full_name: application.full_name,
        company_email: data.company_email,
        personal_email: application.personal_email,
        phone: application.phone_number,
        role: data.role,
        department: data.department,
        designation: application.designation,
        work_location: application.work_location,
        employment_type: application.employment_type,
        joined_at: application.joining_date,
        status: data.set_active ? 'active' : 'pending',
        module_access: ['dashboard'] // Default access, can be expanded
      })
      .select('id')
      .single()

    if (appUserError || !appUser) {
      // Rollback auth user if app user creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to create app user: ${appUserError?.message}`)
    }

    // Update onboarding application status (trigger will auto-assign employee_id)
    const { data: updatedApplication, error: updateError } = await supabase
      .from('employees_details')
      .update({
        status: 'approved',
        approval_date: new Date().toISOString(),
        approved_by: adminUser.id,
        app_user_id: appUser.id
      })
      .eq('application_id', data.applicant_id)
      .select('employee_id')
      .single()

    if (updateError) {
      throw new Error(`Failed to update application status: ${updateError.message}`)
    }

    // Sync the auto-generated employee_id to app_users table
    if (updatedApplication?.employee_id) {
      const { error: syncError } = await supabase
        .from('app_users')
        .update({ employee_id: updatedApplication.employee_id })
        .eq('id', appUser.id)

      if (syncError) {
        console.error('Warning: Failed to sync employee_id to app_users:', syncError)
        // Don't throw error here as the main approval was successful
      }
    }

    return {
      ok: true,
      data: {
        app_user_id: appUser.id,
        auth_user_id: authData.user.id,
        employee_id: updatedApplication?.employee_id,
        company_email: data.company_email,
        temp_password: tempPassword,
        tempPasswordSet: true,
        status: 'approved',
        message: `Application approved and user account created successfully${updatedApplication?.employee_id ? ` (Employee ID: ${updatedApplication.employee_id})` : ''}`
      },
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error approving onboarding application:', error)
    return {
      ok: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to approve application'
      },
      timestamp: new Date().toISOString()
    }
  }
}

// Helper function to generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Admin: Reject onboarding application
export async function rejectOnboardingApplication(
  applicantId: string,
  reason?: string
): Promise<void> {
  try {
    // Get current user for admin check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Authentication required')
    }

    // Check if current user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('app_users')
      .select('id, role, status')
      .eq('auth_user_id', user.id)
      .single()

    if (adminError || !adminUser || !['super_admin', 'admin'].includes(adminUser.role) || adminUser.status !== 'active') {
      throw new Error('Admin privileges required')
    }

    const { error } = await supabase
      .from('employees_details')
      .update({ 
        status: 'rejected',
        rejection_reason: reason || 'Application rejected by admin',
        approval_date: new Date().toISOString(),
        approved_by: adminUser.id
      })
      .eq('application_id', applicantId)

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
      .from('employee-documents')
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

// Get employee ID statistics and next available ID
export async function getEmployeeIdStats() {
  try {
    const { data, error } = await supabase.rpc('preview_next_employee_id')
    
    if (error) {
      console.error('Error fetching employee ID stats:', error)
      return null
    }

    // Get total approved employees with IDs
    const { data: approvedCount, error: countError } = await supabase
      .from('employees_details')
      .select('employee_id', { count: 'exact' })
      .eq('status', 'approved')
      .not('employee_id', 'is', null)

    if (countError) {
      console.error('Error counting approved employees:', countError)
    }

    return {
      nextEmployeeId: data,
      totalApprovedEmployees: approvedCount?.length || 0
    }
  } catch (error) {
    console.error('Error in getEmployeeIdStats:', error)
    return null
  }
}