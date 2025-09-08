// Phase 3: Edge Function - Delete User  
// Hard deletes users from both app.users and auth.users

import {
  handleCORS,
  extractJWT, 
  verifySupeAdmrin,
  createServiceClient,
  createResponse,
  createErrorResponse,
  validateRequired,
  insertAuditLog
} from '../_shared/utils.ts'

// =============================================================================
// TYPES
// =============================================================================

interface DeleteUserRequest {
  app_user_id: string
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
    let requestData: DeleteUserRequest
    try {
      requestData = await req.json()
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Validate required fields
    const validation = validateRequired(requestData, ['app_user_id'])
    if (!validation.isValid) {
      return createErrorResponse(
        `Missing required fields: ${validation.missing.join(', ')}`,
        400
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(requestData.app_user_id)) {
      return createErrorResponse('Invalid user ID format', 400)
    }

    // Create service client for admin operations
    const serviceClient = createServiceClient()

    // Step 1: Get user data before deletion (for audit and response)
    const { data: userToDelete, error: getUserError } = await serviceClient
      .from('app.users')
      .select('id, auth_user_id, company_email, full_name, role, status')
      .eq('id', requestData.app_user_id)
      .single()

    if (getUserError) {
      if (getUserError.code === 'PGRST116') { // Not found
        return createErrorResponse('User not found', 404)
      }
      return createErrorResponse(
        `Failed to fetch user: ${getUserError.message}`,
        500
      )
    }

    if (!userToDelete.auth_user_id) {
      return createErrorResponse(
        'User has no associated auth account - cannot delete',
        400
      )
    }

    // Prevent self-deletion
    if (userToDelete.auth_user_id === authResult.userId) {
      return createErrorResponse(
        'Cannot delete your own account',
        400
      )
    }

    // Prevent deletion of other super admins (optional safety check)
    if (userToDelete.role === 'super_admin') {
      return createErrorResponse(
        'Cannot delete super admin accounts for security reasons',
        403
      )
    }

    try {
      // Step 2: Insert audit log BEFORE deletion (so we have the record)
      await insertAuditLog(
        serviceClient,
        authResult.userId!, // actor (super admin performing deletion)
        requestData.app_user_id, // target (user being deleted)
        'delete_user',
        {
          deleted_user_email: userToDelete.company_email,
          deleted_user_name: userToDelete.full_name,
          deleted_user_role: userToDelete.role,
          deleted_auth_user_id: userToDelete.auth_user_id,
          deletion_reason: 'Admin initiated deletion'
        }
      )

      // Step 3: Delete from app.users table first
      const { error: deleteAppUserError } = await serviceClient
        .from('app.users')
        .delete()
        .eq('id', requestData.app_user_id)

      if (deleteAppUserError) {
        throw new Error(`Failed to delete from app.users: ${deleteAppUserError.message}`)
      }

      // Step 4: Delete from auth.users (Supabase Auth)
      const { error: deleteAuthUserError } = await serviceClient.auth.admin.deleteUser(
        userToDelete.auth_user_id
      )

      if (deleteAuthUserError) {
        // This is a problem - app user is deleted but auth user remains
        // Log the error but don't fail the request since app user is gone
        console.error('Failed to delete auth user:', deleteAuthUserError)
        
        return createResponse({
          success: true,
          data: {
            deleted: true,
            company_email: userToDelete.company_email,
            full_name: userToDelete.full_name,
            warning: 'User deleted from app but auth account deletion failed. Manual cleanup may be required.'
          }
        }, 200)
      }

      // Step 5: Return success response
      return createResponse({
        success: true,
        data: {
          deleted: true,
          company_email: userToDelete.company_email,
          full_name: userToDelete.full_name,
          message: `User ${userToDelete.full_name} (${userToDelete.company_email}) has been permanently deleted`
        }
      }, 200)

    } catch (error) {
      console.error('User deletion failed:', error)
      return createErrorResponse(
        `User deletion failed: ${error.message}`,
        500
      )
    }

  } catch (error) {
    console.error('Unexpected error in admin-delete-user:', error)
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
   supabase functions deploy admin-delete-user --no-verify-jwt

2. Test the function:
   curl -X POST 'https://your-project.supabase.co/functions/v1/admin-delete-user' \
     -H 'Authorization: Bearer YOUR_SUPER_ADMIN_JWT' \
     -H 'Content-Type: application/json' \
     -d '{
       "app_user_id": "uuid-of-user-to-delete"
     }'

3. Expected response on success:
   {
     "success": true,
     "data": {
       "deleted": true,
       "company_email": "user@example.com",
       "full_name": "User Name",
       "message": "User has been permanently deleted"
     }
   }

4. Security notes:
   - Only super admins can call this function
   - Users cannot delete themselves
   - Super admins cannot delete other super admins
   - Audit log is created before deletion
   - Both app.users and auth.users records are removed
*/