import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface OnboardingSubmission {
  full_name: string
  personal_email: string
  phone?: string
  designation?: string
  work_location?: string
  employment_type?: string
  joined_at?: string
  addresses?: Record<string, any>
  emergency?: Record<string, any>
  documents?: Array<any>
  notes?: string
}

interface ValidationError {
  field: string
  message: string
}

function validateSubmission(data: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = []

  // Required fields
  if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim().length < 2) {
    errors.push({ field: 'full_name', message: 'Full name is required and must be at least 2 characters' })
  }

  if (!data.personal_email || typeof data.personal_email !== 'string') {
    errors.push({ field: 'personal_email', message: 'Personal email is required' })
  } else {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(data.personal_email)) {
      errors.push({ field: 'personal_email', message: 'Please enter a valid email address' })
    }
  }

  // Optional field validations
  if (data.phone && typeof data.phone === 'string') {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/
    if (!phoneRegex.test(data.phone)) {
      errors.push({ field: 'phone', message: 'Please enter a valid phone number' })
    }
  }

  if (data.employment_type && !['Full-time', 'Part-time', 'Intern', 'Contractor'].includes(data.employment_type)) {
    errors.push({ field: 'employment_type', message: 'Invalid employment type' })
  }

  if (data.joined_at && typeof data.joined_at === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(data.joined_at)) {
      errors.push({ field: 'joined_at', message: 'Joining date must be in YYYY-MM-DD format' })
    }
  }

  return { isValid: errors.length === 0, errors }
}

function createErrorResponse(message: string, errors?: ValidationError[], status: number = 400) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { message, errors },
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({
      ok: true,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', undefined, 405)
  }

  try {
    // Parse request body
    let requestData: OnboardingSubmission
    try {
      requestData = await req.json()
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body')
    }

    // Validate submission data
    const { isValid, errors } = validateSubmission(requestData)
    if (!isValid) {
      return createErrorResponse('Validation failed', errors)
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check for duplicate email
    const { data: existing, error: duplicateError } = await supabase
      .from('onboarding_applicants')
      .select('id, status')
      .eq('personal_email', requestData.personal_email.toLowerCase())
      .maybeSingle()

    if (duplicateError) {
      console.error('Error checking duplicate email:', duplicateError)
      return createErrorResponse('Database error occurred')
    }

    if (existing) {
      if (existing.status === 'submitted') {
        return createErrorResponse('An application with this email is already pending review')
      } else if (existing.status === 'approved') {
        return createErrorResponse('An application with this email has already been approved')
      }
    }

    // Prepare data for insertion
    const applicationData = {
      full_name: requestData.full_name.trim(),
      personal_email: requestData.personal_email.toLowerCase().trim(),
      phone: requestData.phone?.trim() || null,
      designation: requestData.designation?.trim() || null,
      work_location: requestData.work_location || 'Patna',
      employment_type: requestData.employment_type || 'Full-time',
      joined_at: requestData.joined_at || null,
      addresses: requestData.addresses || {},
      emergency: requestData.emergency || {},
      documents: requestData.documents || [],
      notes: requestData.notes?.trim() || null,
      status: 'submitted'
    }

    // Insert application
    const { data: application, error: insertError } = await supabase
      .from('onboarding_applicants')
      .insert(applicationData)
      .select('id')
      .single()

    if (insertError) {
      console.error('Error inserting application:', insertError)
      return createErrorResponse('Failed to submit application. Please try again.')
    }

    // Success response
    return createSuccessResponse({
      applicant_id: application.id,
      message: 'Application submitted successfully',
      status: 'submitted'
    })

  } catch (error) {
    console.error('Unexpected error in onboarding-submit:', error)
    return createErrorResponse('An unexpected error occurred. Please try again.')
  }
})

/* 
DEPLOYMENT COMMAND:
supabase functions deploy onboarding-submit --no-verify-jwt

TEST COMMAND:
curl -X POST 'http://localhost:54321/functions/v1/onboarding-submit' \
  -H 'Content-Type: application/json' \
  -d '{
    "full_name": "John Doe",
    "personal_email": "john.doe@gmail.com",
    "phone": "+91 9876543210",
    "designation": "Frontend Developer",
    "work_location": "Patna",
    "employment_type": "Full-time",
    "joined_at": "2024-02-15",
    "addresses": {
      "current": {
        "street": "123 Main St",
        "city": "Patna",
        "state": "Bihar",
        "pin": "800001"
      }
    },
    "emergency": {
      "name": "Jane Doe",
      "relationship": "Sister",
      "phone": "+91 9876543211"
    }
  }'
*/