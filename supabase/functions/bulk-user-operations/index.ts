import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkOperationRequest {
  operation: 'update_status' | 'update_role' | 'add_module_access' | 'remove_module_access' | 'delete'
  user_ids: string[]
  data?: any
  reason?: string
}

interface OperationResult {
  user_id: string
  success: boolean
  error?: string
  user_name?: string
  user_email?: string
}

interface BulkOperationResponse {
  success: boolean
  data?: {
    total_requested: number
    successful: number
    failed: number
    results: OperationResult[]
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Rate limiting: maximum operations per request
const MAX_OPERATIONS_PER_REQUEST = 50

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
    const { operation, user_ids, data, reason }: BulkOperationRequest = await req.json()

    // Validate request
    if (!operation || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Operation and user_ids array are required'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Rate limiting
    if (user_ids.length > MAX_OPERATIONS_PER_REQUEST) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'TOO_MANY_OPERATIONS',
            message: `Maximum ${MAX_OPERATIONS_PER_REQUEST} operations allowed per request`
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if current user has permission (only super admins for bulk operations)
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
            message: 'Only super administrators can perform bulk operations'
          }
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate operation-specific data
    let validationError = null
    switch (operation) {
      case 'update_status':
        if (!data || !['active', 'pending', 'suspended', 'on_leave', 'inactive', 'resigned', 'terminated'].includes(data)) {
          validationError = 'Invalid status value for update_status operation'
        }
        break
      case 'update_role':
        if (!data || !['super_admin', 'admin', 'manager', 'employee', 'intern', 'external'].includes(data)) {
          validationError = 'Invalid role value for update_role operation'
        }
        break
      case 'add_module_access':
      case 'remove_module_access':
        if (!data || !Array.isArray(data) || data.length === 0) {
          validationError = `Module access array required for ${operation} operation`
        }
        break
      case 'delete':
        // No additional data needed for delete
        break
      default:
        validationError = 'Invalid operation type'
    }

    if (validationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_OPERATION_DATA',
            message: validationError
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all target users first
    const { data: targetUsers, error: getUsersError } = await supabase
      .from('app_users')
      .select('id, auth_user_id, full_name, company_email, role, status, module_access')
      .in('id', user_ids)

    if (getUsersError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FAILED_TO_GET_USERS',
            message: `Failed to retrieve target users: ${getUsersError.message}`
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results: OperationResult[] = []
    let successfulOperations = 0
    let failedOperations = 0

    // Process each user
    for (const userId of user_ids) {
      const targetUser = targetUsers?.find(u => u.id === userId)
      
      if (!targetUser) {
        results.push({
          user_id: userId,
          success: false,
          error: 'User not found'
        })
        failedOperations++
        continue
      }

      // Prevent operations on super admins (except by other super admins)
      if (targetUser.role === 'super_admin' && currentUser.role !== 'super_admin') {
        results.push({
          user_id: userId,
          success: false,
          error: 'Cannot modify super administrator accounts',
          user_name: targetUser.full_name,
          user_email: targetUser.company_email
        })
        failedOperations++
        continue
      }

      // Prevent self-modification for certain operations
      if (targetUser.auth_user_id === user.id && ['delete', 'update_role'].includes(operation)) {
        results.push({
          user_id: userId,
          success: false,
          error: `Cannot perform ${operation} operation on your own account`,
          user_name: targetUser.full_name,
          user_email: targetUser.company_email
        })
        failedOperations++
        continue
      }

      try {
        let updateData: any = {}
        let operationSuccess = false

        switch (operation) {
          case 'update_status':
            updateData = { 
              status: data,
              exited_at: ['resigned', 'terminated'].includes(data) ? new Date().toISOString().split('T')[0] : null
            }
            break

          case 'update_role':
            updateData = { role: data }
            break

          case 'add_module_access': {
            const currentModules = targetUser.module_access || []
            const newModules = [...new Set([...currentModules, ...data])]
            updateData = { module_access: newModules }
            break
          }

          case 'remove_module_access': {
            const existingModules = targetUser.module_access || []
            const filteredModules = existingModules.filter(module => !data.includes(module))
            // Ensure dashboard is never removed
            if (!filteredModules.includes('dashboard')) {
              filteredModules.push('dashboard')
            }
            updateData = { module_access: filteredModules }
            break
          }

          case 'delete': {
            // For delete, we need to use the admin client
            const { error: deleteAuthError } = targetUser.auth_user_id
              ? await supabaseAdmin.auth.admin.deleteUser(targetUser.auth_user_id)
              : { error: null }

            const { error: deleteAppError } = await supabase
              .from('app_users')
              .delete()
              .eq('id', userId)

            if (deleteAppError) {
              throw new Error(`Failed to delete app user: ${deleteAppError.message}`)
            }

            operationSuccess = true
            break
          }
        }

        // Perform update operations (not delete)
        if (operation !== 'delete') {
          const { error: updateError } = await supabase
            .from('app_users')
            .update(updateData)
            .eq('id', userId)

          if (updateError) {
            throw new Error(`Failed to update user: ${updateError.message}`)
          }

          operationSuccess = true
        }

        // Log the operation
        await supabase
          .from('app_user_activity_logs')
          .insert({
            actor_auth_user_id: user.id,
            target_user_id: userId,
            action: operation === 'delete' ? 'delete_user' : 'update_user',
            details: {
              operation,
              data,
              reason: reason || 'Bulk operation',
              target_user: {
                name: targetUser.full_name,
                email: targetUser.company_email
              },
              performed_by: currentUser.full_name
            }
          })

        results.push({
          user_id: userId,
          success: true,
          user_name: targetUser.full_name,
          user_email: targetUser.company_email
        })
        successfulOperations++

      } catch (error) {
        results.push({
          user_id: userId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          user_name: targetUser.full_name,
          user_email: targetUser.company_email
        })
        failedOperations++
      }
    }

    // Log the bulk operation summary
    await supabase
      .from('app_user_activity_logs')
      .insert({
        actor_auth_user_id: user.id,
        target_user_id: user_ids[0], // Use first user ID as representative
        action: 'update_user',
        details: {
          operation: 'bulk_operation',
          operation_type: operation,
          total_requested: user_ids.length,
          successful: successfulOperations,
          failed: failedOperations,
          reason: reason || 'Bulk operation',
          performed_by: currentUser.full_name
        }
      })

    const response: BulkOperationResponse = {
      success: true,
      data: {
        total_requested: user_ids.length,
        successful: successfulOperations,
        failed: failedOperations,
        results
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Bulk operation edge function error:', error)
    
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

POST /functions/v1/bulk-user-operations
Authorization: Bearer <user_jwt_token>
Content-Type: application/json

// Bulk status update
{
  "operation": "update_status",
  "user_ids": ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d1-9c8b-123456789abc"],
  "data": "suspended",
  "reason": "Policy violation - temporary suspension"
}

// Bulk add module access
{
  "operation": "add_module_access",
  "user_ids": ["123e4567-e89b-12d3-a456-426614174000"],
  "data": ["content", "marketing"],
  "reason": "Promoted to marketing team lead"
}

// Bulk delete users
{
  "operation": "delete",
  "user_ids": ["123e4567-e89b-12d3-a456-426614174000"],
  "reason": "Account cleanup - user requested deletion"
}

Response:
{
  "success": true,
  "data": {
    "total_requested": 2,
    "successful": 1,
    "failed": 1,
    "results": [
      {
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "success": true,
        "user_name": "John Doe",
        "user_email": "john.doe@erayastyle.com"
      },
      {
        "user_id": "987fcdeb-51a2-43d1-9c8b-123456789abc",
        "success": false,
        "error": "User not found",
        "user_name": "Jane Smith",
        "user_email": "jane.smith@erayastyle.com"
      }
    ]
  }
}

*/