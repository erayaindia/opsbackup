import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  user_id: string
  reason?: string
}

interface DeleteUserResponse {
  success: boolean
  data?: {
    deleted: boolean
    user_email: string
    user_name: string
    auth_deleted: boolean
    message: string
    warnings?: string[]
  }
  error?: {
    code: string
    message: string
    details?: any
  }
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
    const { user_id, reason }: DeleteUserRequest = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_USER_ID',
            message: 'User ID is required'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if current user has permission (must be super admin)
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

    if (currentUser.role !== 'super_admin' || currentUser.status !== 'active') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only active super administrators can delete users'
          }
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user to be deleted
    const { data: userToDelete, error: getUserError } = await supabase
      .from('app_users')
      .select('id, auth_user_id, company_email, full_name, role, status')
      .eq('id', user_id)
      .single()

    if (getUserError || !userToDelete) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'TARGET_USER_NOT_FOUND',
            message: 'User to delete not found'
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prevent deletion of super admins
    if (userToDelete.role === 'super_admin') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'CANNOT_DELETE_SUPER_ADMIN',
            message: 'Super administrator users cannot be deleted'
          }
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prevent self-deletion
    if (userToDelete.auth_user_id === user.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'CANNOT_DELETE_SELF',
            message: 'You cannot delete your own account'
          }
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const warnings: string[] = []
    let authDeleted = false

    // Start transaction-like operation
    try {
      // First, log the deletion attempt
      const { error: logError } = await supabase
        .from('app_user_activity_logs')
        .insert({
          actor_auth_user_id: user.id,
          target_user_id: user_id,
          action: 'delete_user',
          details: {
            reason: reason || 'No reason provided',
            deleted_user: {
              name: userToDelete.full_name,
              email: userToDelete.company_email,
              role: userToDelete.role
            },
            deleted_by: currentUser.full_name
          }
        })

      if (logError) {
        console.error('Failed to log deletion:', logError)
        warnings.push('Failed to log action in audit trail')
      }

      // Delete from app_users table first
      const { error: deleteAppUserError } = await supabase
        .from('app_users')
        .delete()
        .eq('id', user_id)

      if (deleteAppUserError) {
        throw new Error(`Failed to delete user from app_users: ${deleteAppUserError.message}`)
      }

      // Try to delete auth user if exists (using admin client)
      if (userToDelete.auth_user_id) {
        try {
          const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
            userToDelete.auth_user_id
          )

          if (deleteAuthError) {
            console.error('Failed to delete auth user:', deleteAuthError)
            warnings.push('Failed to delete authentication account - manual cleanup may be required')
          } else {
            authDeleted = true
          }
        } catch (authDeleteError) {
          console.error('Auth user deletion failed:', authDeleteError)
          warnings.push('Failed to delete authentication account - manual cleanup may be required')
        }
      }

      // Prepare success response
      const response: DeleteUserResponse = {
        success: true,
        data: {
          deleted: true,
          user_email: userToDelete.company_email,
          user_name: userToDelete.full_name,
          auth_deleted: authDeleted,
          message: `User ${userToDelete.full_name} has been permanently deleted`,
          ...(warnings.length > 0 && { warnings })
        }
      }

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (operationError) {
      // If anything fails, we need to handle rollback
      console.error('User deletion failed:', operationError)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DELETION_FAILED',
            message: operationError instanceof Error ? operationError.message : 'Failed to delete user',
            details: operationError
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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

POST /functions/v1/delete-user
Authorization: Bearer <user_jwt_token>
Content-Type: application/json

{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "reason": "User requested account deletion"
}

Response:
{
  "success": true,
  "data": {
    "deleted": true,
    "user_email": "john.doe@erayastyle.com",
    "user_name": "John Doe",
    "auth_deleted": true,
    "message": "User John Doe has been permanently deleted"
  }
}

*/