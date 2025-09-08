// Phase 3: Edge Function - Create User
// Creates new users with Auth account + app.users record

import { 
  handleCORS, 
  extractJWT, 
  verifySupeAdmrin,
  createServiceClient,
  createResponse,
  createErrorResponse,
  generateStrongPassword,
  validateRequired,
  isValidEmail,
  isValidDepartment,
  isValidRole,
  insertAuditLog,
  VALID_DEPARTMENTS,
  VALID_ROLES
} from '../_shared/utils.ts'

// =============================================================================
// TYPES
// =============================================================================

interface CreateUserRequest {
  full_name: string
  company_email: string
  role: string
  department: string
  joined_at: string
  personal_email?: string
  phone?: string
  designation?: string
  work_location?: string
  employment_type?: string
  module_access?: string[]
  notes?: string
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight
    const corsResponse = handleCORS(req)
    if (corsResponse) return corsResponse

    // Only allow POST requests
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405)
    }

    // Extract and validate JWT
    const jwt = extractJWT(req)
    if (!jwt) {
      return createErrorResponse('Missing Authorization header', 401)
    }

    // Verify user is super admin
    const authResult = await verifySupeAdmrin(jwt)
    if (!authResult.isAuthorized) {
      return createErrorResponse(
        authResult.error || 'Unauthorized - super admin required', 
        403
      )
    }

    // Parse request body
    let requestData: CreateUserRequest
    try {
      requestData = await req.json()
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Validate required fields
    const requiredFields = ['full_name', 'company_email', 'role', 'department']
    const validation = validateRequired(requestData, requiredFields)
    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missing.join(', ')}`, 
        400
      )
    }

    // Validate email format
    if (!isValidEmail(requestData.company_email)) {
      return createErrorResponse('Invalid company email format', 400)
    }

    // Validate department
    if (!isValidDepartment(requestData.department)) {
      return createErrorResponse(
        `Invalid department. Must be one of: ${VALID_DEPARTMENTS.join(', ')}`, 
        400
      )
    }

    // Validate role
    if (!isValidRole(requestData.role)) {
      return createErrorResponse(
        `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, 
        400
      )
    }

    // Validate joined_at date
    let joinedDate: Date
    try {
      joinedDate = new Date(requestData.joined_at)
      if (isNaN(joinedDate.getTime())) {
        throw new Error('Invalid date')
      }
      if (joinedDate > new Date()) {
        return createErrorResponse('Joined date cannot be in the future', 400)
      }
    } catch (error) {
      return createErrorResponse('Invalid joined_at date format', 400)
    }

    // Create service client for admin operations
    const serviceClient = createServiceClient()

    // Generate strong password
    const tempPassword = generateStrongPassword(16)

    // Step 1: Create Supabase Auth user
    const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
      email: requestData.company_email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: requestData.full_name,
        created_by: 'admin-create-user-function'
      }
    })

    if (authError) {
      return createErrorResponse(
        `Failed to create auth user: ${authError.message}`, 
        400
      )
    }

    if (!authUser.user) {
      return createErrorResponse('Auth user creation failed - no user returned', 500)
    }

    let appUserId: string

    try {
      // Step 2: Create app.users record
      const appUserData = {
        auth_user_id: authUser.user.id,
        full_name: requestData.full_name.trim(),
        company_email: requestData.company_email.toLowerCase().trim(),
        role: requestData.role,
        department: requestData.department,
        status: 'active',
        joined_at: joinedDate.toISOString().split('T')[0], // YYYY-MM-DD format
        personal_email: requestData.personal_email?.trim() || null,
        phone: requestData.phone?.trim() || null,
        designation: requestData.designation?.trim() || null,
        work_location: requestData.work_location || 'Patna',
        employment_type: requestData.employment_type || 'Full-time',
        module_access: requestData.module_access || [],
        notes: requestData.notes?.trim() || null
      }

      const { data: appUser, error: appUserError } = await serviceClient
        .from('app.users')
        .insert(appUserData)
        .select()
        .single()

      if (appUserError) {
        // Rollback: delete the auth user if app.users creation fails
        await serviceClient.auth.admin.deleteUser(authUser.user.id)
        return createErrorResponse(
          `Failed to create app user: ${appUserError.message}`, 
          400
        )
      }

      appUserId = appUser.id

      // Step 3: Insert audit log
      await insertAuditLog(
        serviceClient,
        authResult.userId!, // actor (super admin who created the user)
        appUserId, // target (newly created user)
        'create_user',
        {
          company_email: requestData.company_email,
          role: requestData.role,
          department: requestData.department,
          full_name: requestData.full_name,
          auth_user_id: authUser.user.id,
          temp_password_set: true
        }
      )

      // Step 4: Return success response
      return createResponse({
        success: true,
        data: {
          user: appUser,
          tempPasswordSet: true,
          tempPassword: tempPassword, // Include temp password in response for admin
          message: `User ${requestData.full_name} created successfully`
        }
      }, 201)

    } catch (error) {
      // Rollback: delete auth user if any step fails
      try {
        await serviceClient.auth.admin.deleteUser(authUser.user.id)
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError)
      }

      return createErrorResponse(
        `User creation failed: ${error.message}`, 
        500
      )
    }

  } catch (error) {
    console.error('Unexpected error in admin-create-user:', error)
    return createErrorResponse(
      'Internal server error', 
      500
    )
  }
})

// =============================================================================
// DEPLOYMENT NOTES
// =============================================================================

/*
To deploy this function:

1. Deploy the function:
   supabase functions deploy admin-create-user --no-verify-jwt

2. Set environment variables (if not already set):
   supabase secrets set SUPABASE_URL=your_url
   supabase secrets set SUPABASE_ANON_KEY=your_anon_key  
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key

3. Test the function:
   curl -X POST 'https://your-project.supabase.co/functions/v1/admin-create-user' \
     -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{
       "full_name": "John Doe",
       "company_email": "john.doe@erayastyle.com", 
       "role": "employee",
       "department": "Content",
       "joined_at": "2025-01-01"
     }'
*/