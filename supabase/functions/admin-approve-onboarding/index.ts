import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface ApprovalRequest {
  applicant_id: string
  company_email: string
  role: string
  department: string
  set_active?: boolean
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 14; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { message },
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
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return createErrorResponse('Authorization required', 401)
    }

    // Parse request body
    let requestData: ApprovalRequest
    try {
      requestData = await req.json()
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body')
    }

    // Validate required fields
    if (!requestData.applicant_id || !requestData.company_email || !requestData.role || !requestData.department) {
      return createErrorResponse('Missing required fields: applicant_id, company_email, role, department')
    }

    // Validate company email domain
    if (!requestData.company_email.endsWith('@erayastyle.com')) {
      return createErrorResponse('Company email must end with @erayastyle.com')
    }

    // Validate role and department
    const validRoles = ['super_admin', 'admin', 'manager', 'employee', 'intern', 'external']
    const validDepartments = ['Content', 'Fulfillment', 'Support', 'Marketing', 'Finance', 'Admin', 'Ops', 'HR', 'IT']

    if (!validRoles.includes(requestData.role)) {
      return createErrorResponse('Invalid role specified')
    }

    if (!validDepartments.includes(requestData.department)) {
      return createErrorResponse('Invalid department specified')
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Client for checking admin permissions
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Service client for admin operations
    const serviceClient = createClient(supabaseUrl, supabaseKey)

    // Verify user is super admin
    const { data: isAdmin, error: adminError } = await userClient
      .rpc('is_super_admin')

    if (adminError || !isAdmin) {
      return createErrorResponse('Insufficient permissions. Super admin access required.', 403)
    }

    // Load applicant data
    const { data: applicant, error: applicantError } = await serviceClient
      .from('onboarding_applicants')
      .select('*')
      .eq('id', requestData.applicant_id)
      .eq('status', 'submitted')
      .single()

    if (applicantError || !applicant) {
      return createErrorResponse('Applicant not found or already processed')
    }

    // Check if company email already exists
    const { data: existingUser, error: existingError } = await serviceClient
      .from('app_users')
      .select('id')
      .eq('company_email', requestData.company_email.toLowerCase())
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing user:', existingError)
      return createErrorResponse('Database error occurred')
    }

    if (existingUser) {
      return createErrorResponse('A user with this company email already exists')
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()

    // Step 1: Create Supabase Auth user
    const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
      email: requestData.company_email.toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: applicant.full_name,
        source: 'onboarding'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return createErrorResponse('Failed to create user account')
    }

    let appUserId: string

    try {
      // Step 2: Create app_users record
      const appUserData = {
        full_name: applicant.full_name,
        company_email: requestData.company_email.toLowerCase(),
        role: requestData.role,
        department: requestData.department,
        status: requestData.set_active ? 'active' : 'pending',
        joined_at: applicant.joined_at || new Date().toISOString().split('T')[0],
        work_location: applicant.work_location || 'Patna',
        employment_type: applicant.employment_type || 'Full-time',
        module_access: ['dashboard'], // Default module access
        auth_user_id: null, // Will be linked on first login
        phone: applicant.phone,
        notes: applicant.notes
      }

      const { data: appUser, error: appUserError } = await serviceClient
        .from('app_users')
        .insert(appUserData)
        .select('id')
        .single()

      if (appUserError) {
        // Rollback: delete the auth user if app_users creation fails
        await serviceClient.auth.admin.deleteUser(authUser.user.id)
        console.error('Error creating app user:', appUserError)
        return createErrorResponse('Failed to create user profile')
      }

      appUserId = appUser.id

      // Step 3: Update applicant record
      const { error: updateError } = await serviceClient
        .from('onboarding_applicants')
        .update({
          status: 'approved',
          mapped_app_user_id: appUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestData.applicant_id)

      if (updateError) {
        console.error('Error updating applicant status:', updateError)
        // Don't rollback here - user is created, just log the error
      }

      // Success response
      return createSuccessResponse({
        app_user_id: appUserId,
        auth_user_id: authUser.user.id,
        company_email: requestData.company_email,
        temp_password: tempPassword,
        tempPasswordSet: true,
        status: requestData.set_active ? 'active' : 'pending',
        message: `User ${applicant.full_name} created successfully`
      })

    } catch (error) {
      // Rollback: delete auth user if anything fails
      await serviceClient.auth.admin.deleteUser(authUser.user.id)
      console.error('Error in user creation process:', error)
      return createErrorResponse('User creation failed')
    }

  } catch (error) {
    console.error('Unexpected error in admin-approve-onboarding:', error)
    return createErrorResponse('An unexpected error occurred')
  }
})

/* 
DEPLOYMENT COMMAND:
supabase functions deploy admin-approve-onboarding --no-verify-jwt

TEST COMMAND:
curl -X POST 'http://localhost:54321/functions/v1/admin-approve-onboarding' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SUPER_ADMIN_JWT_TOKEN' \
  -d '{
    "applicant_id": "uuid-from-onboarding-submit",
    "company_email": "john.doe@erayastyle.com",
    "role": "employee",
    "department": "Content",
    "set_active": true
  }'

REQUIRED PERMISSIONS:
- User making request must have role='super_admin' in app_users table
- Must provide valid JWT token in Authorization header
*/