// Shared utilities for Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// TYPES
// =============================================================================

export interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  statusCode?: number
}

export interface AuthResult {
  isAuthorized: boolean
  userId?: string
  error?: string
}

// =============================================================================
// SUPABASE CLIENTS
// =============================================================================

// Create normal client with user JWT for authorization checks
export const createNormalClient = (jwt: string) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${jwt}` }
    }
  })
}

// Create service client with service role key for admin operations
export const createServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  return createClient(supabaseUrl, supabaseServiceKey)
}

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

// Extract JWT from Authorization header
export const extractJWT = (request: Request): string | null => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // Remove 'Bearer ' prefix
}

// Verify user is super admin
export const verifySupeAdmrin = async (jwt: string): Promise<AuthResult> => {
  try {
    const normalClient = createNormalClient(jwt)
    
    // Call helper function to check if user is super admin
    const { data, error } = await normalClient.rpc('app.is_super_admin')
    
    if (error) {
      return { 
        isAuthorized: false, 
        error: `Authorization check failed: ${error.message}` 
      }
    }

    // Get current user ID for logging
    const { data: { user } } = await normalClient.auth.getUser(jwt)
    
    return {
      isAuthorized: data === true,
      userId: user?.id,
      error: data !== true ? 'User is not a super admin' : undefined
    }

  } catch (error) {
    return { 
      isAuthorized: false, 
      error: `Authorization verification failed: ${error.message}` 
    }
  }
}

// =============================================================================
// PASSWORD GENERATION
// =============================================================================

// Generate secure random password
export const generateStrongPassword = (length: number = 16): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

// =============================================================================
// HTTP HELPERS
// =============================================================================

// Handle CORS preflight requests
export const handleCORS = (request: Request): Response | null => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      },
    })
  }
  return null
}

// Create standardized JSON response
export const createResponse = (
  response: ApiResponse,
  statusCode: number = 200
): Response => {
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  })
}

// Create error response
export const createErrorResponse = (
  error: string,
  statusCode: number = 400
): Response => {
  return createResponse({
    success: false,
    error,
  }, statusCode)
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate required fields
export const validateRequired = (
  data: Record<string, any>, 
  requiredFields: string[]
): { isValid: boolean; missing: string[] } => {
  const missing = requiredFields.filter(field => !data[field] || data[field].trim() === '')
  return {
    isValid: missing.length === 0,
    missing
  }
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

// Insert audit log entry
export const insertAuditLog = async (
  serviceClient: any,
  actorUserId: string,
  targetUserId: string,
  action: string,
  details: Record<string, any> = {},
  module: string = 'admin/users'
) => {
  try {
    const { error } = await serviceClient
      .from('app.user_activity_logs')
      .insert({
        actor_auth_user_id: actorUserId,
        target_user_id: targetUserId,
        action,
        module,
        details,
      })

    if (error) {
      console.error('Audit log insertion failed:', error)
    }
  } catch (error) {
    console.error('Audit log error:', error)
  }
}

// =============================================================================
// DEPARTMENT & ROLE VALIDATION
// =============================================================================

export const VALID_DEPARTMENTS = [
  'Content', 'Fulfillment', 'Support', 'Marketing', 
  'Finance', 'Admin', 'Ops', 'HR', 'IT'
]

export const VALID_ROLES = [
  'super_admin', 'admin', 'manager', 'employee', 'intern', 'external'
]

export const VALID_EMPLOYMENT_TYPES = [
  'Full-time', 'Part-time', 'Intern', 'Contractor'
]

export const isValidDepartment = (dept: string): boolean => 
  VALID_DEPARTMENTS.includes(dept)

export const isValidRole = (role: string): boolean => 
  VALID_ROLES.includes(role)

export const isValidEmploymentType = (type: string): boolean => 
  VALID_EMPLOYMENT_TYPES.includes(type)