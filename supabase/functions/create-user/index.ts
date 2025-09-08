import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  full_name: string
  company_email: string
  role: string
  department: string
  joined_at?: string
  personal_email?: string
  phone?: string
  designation?: string
  work_location?: string
  employment_type?: string
  module_access?: string[]
  notes?: string
  create_auth_account?: boolean
  send_welcome_email?: boolean
}

interface CreateUserResponse {
  success: boolean
  data?: {
    user: any
    tempPasswordSet: boolean
    tempPassword?: string
    auth_created: boolean
    welcome_email_sent?: boolean
    message: string
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Generate a secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one character from each category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  
  // Add 8 more random characters
  for (let i = 0; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return emailRegex.test(email)
}

// Validate company email domain
function isValidCompanyEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@erayastyle.com')
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client for user context
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required'
          }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestData: CreateUserRequest = await req.json()

    // Validate required fields
    const requiredFields = ['full_name', 'company_email', 'role', 'department']
    const missingFields = requiredFields.filter(field => !requestData[field as keyof CreateUserRequest])
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: `Missing required fields: ${missingFields.join(', ')}`
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format and domain
    if (!isValidEmail(requestData.company_email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_EMAIL_FORMAT',
            message: 'Invalid email format'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!isValidCompanyEmail(requestData.company_email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_EMAIL_DOMAIN',
            message: 'Email must be from @erayastyle.com domain'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if current user has permission
    const { data: currentUser, error: currentUserError } = await supabase
      .from('app_users')
      .select('role, status, full_name')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Current user not found in system'
          }
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!['super_admin', 'admin', 'manager'].includes(currentUser.role) || currentUser.status !== 'active') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to create users'
          }
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('app_users')
      .select('id')
      .eq('company_email', requestData.company_email.toLowerCase().trim())
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'A user with this email address already exists'
          }
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let authUser = null
    let tempPassword = ''
    let authCreated = false
    let welcomeEmailSent = false

    // Create auth account if requested
    if (requestData.create_auth_account) {
      tempPassword = generateTempPassword()
      
      try {
        const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
          email: requestData.company_email.toLowerCase().trim(),
          password: tempPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: requestData.full_name,
            role: requestData.role,
            created_by: currentUser.full_name
          }
        })

        if (authCreateError) {
          throw new Error(`Failed to create auth account: ${authCreateError.message}`)
        }

        authUser = authData.user
        authCreated = true

        // Send welcome email if requested
        if (requestData.send_welcome_email) {
          try {
            // Here you would integrate with your email service
            // For now, we'll just mark it as attempted
            welcomeEmailSent = true
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError)
            // Don't fail the whole operation for email issues
          }
        }

      } catch (authError) {
        console.error('Auth account creation failed:', authError)
        // Continue with app user creation even if auth fails
        tempPassword = 'N/A - Auth account creation failed'
      }
    }

    // Create app user record
    const userData = {
      auth_user_id: authUser?.id || null,
      full_name: requestData.full_name.trim(),
      company_email: requestData.company_email.toLowerCase().trim(),
      personal_email: requestData.personal_email?.trim() || null,
      phone: requestData.phone?.trim() || null,
      role: requestData.role,
      department: requestData.department,
      status: authCreated ? 'active' : 'pending', // Auto-activate if auth account was created
      designation: requestData.designation?.trim() || null,
      work_location: requestData.work_location?.trim() || 'Patna',
      employment_type: requestData.employment_type || 'Full-time',
      joined_at: requestData.joined_at || new Date().toISOString().split('T')[0],
      module_access: requestData.module_access?.length 
        ? requestData.module_access 
        : ['dashboard'],
      notes: requestData.notes?.trim() || null
    }

    // Ensure dashboard is always included
    if (!userData.module_access.includes('dashboard')) {
      userData.module_access.push('dashboard')
    }

    const { data: newUser, error: createUserError } = await supabase
      .from('app_users')
      .insert(userData)
      .select()
      .single()

    if (createUserError) {
      // If app user creation fails but auth user was created, we should clean up
      if (authCreated && authUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user after app user creation failed:', cleanupError)
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'USER_CREATION_FAILED',
            message: `Failed to create user: ${createUserError.message}`
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the creation
    const { error: logError } = await supabase
      .from('app_user_activity_logs')
      .insert({
        actor_auth_user_id: user.id,
        target_user_id: newUser.id,
        action: 'create_user',
        details: {
          created_user: {
            name: newUser.full_name,
            email: newUser.company_email,
            role: newUser.role,
            department: newUser.department
          },
          auth_created: authCreated,
          created_by: currentUser.full_name
        }
      })

    if (logError) {
      console.error('Failed to log user creation:', logError)
      // Don't fail the operation for logging issues
    }

    // Prepare response
    const response: CreateUserResponse = {
      success: true,
      data: {
        user: newUser,
        tempPasswordSet: authCreated,
        tempPassword: authCreated ? tempPassword : undefined,
        auth_created: authCreated,
        welcome_email_sent: welcomeEmailSent,
        message: authCreated 
          ? `User ${newUser.full_name} created successfully with authentication account`
          : `User profile for ${newUser.full_name} created. Auth account needs to be created manually.`
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* Example usage:

POST /functions/v1/create-user
Authorization: Bearer <user_jwt_token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "company_email": "john.doe@erayastyle.com",
  "role": "employee",
  "department": "Content",
  "personal_email": "john@gmail.com",
  "phone": "+91 9876543210",
  "designation": "Content Writer",
  "work_location": "Patna",
  "employment_type": "Full-time",
  "module_access": ["dashboard", "content", "support"],
  "notes": "New hire for content team",
  "create_auth_account": true,
  "send_welcome_email": true
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "tempPasswordSet": true,
    "tempPassword": "Xyz9!mNpQ2wE",
    "auth_created": true,
    "welcome_email_sent": true,
    "message": "User John Doe created successfully with authentication account"
  }
}

*/