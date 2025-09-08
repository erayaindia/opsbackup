import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { User } from '@/services/usersService'
import { Loader2 } from 'lucide-react'
import { AccessDeniedModal } from './AccessDeniedModal'

interface PermissionGuardProps {
  children: React.ReactNode
  requiredModule?: string
  requiredRole?: string[]
  fallbackPath?: string
}

export function PermissionGuard({ 
  children, 
  requiredModule, 
  requiredRole = [], 
  fallbackPath = '/dashboard' 
}: PermissionGuardProps) {
  const [loading, setLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showAccessDenied, setShowAccessDenied] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    checkPermissions()
  }, [requiredModule, requiredRole])

  const checkPermissions = async () => {
    try {
      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        setHasPermission(false)
        setLoading(false)
        return
      }

      // Get app user data
      const { data: appUser, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single()

      if (error || !appUser) {
        console.error('Error fetching app user:', error)
        setHasPermission(false)
        setLoading(false)
        return
      }

      setCurrentUser(appUser as User)

      // Super admin has access to EVERYTHING - bypass all checks
      if (appUser.role === 'super_admin') {
        console.log(`✅ Super admin ${appUser.full_name} - full access granted`)
        setHasPermission(true)
        setLoading(false)
        return
      }

      // Check if user is active
      if (appUser.status !== 'active') {
        console.log(`User ${appUser.full_name} is not active (status: ${appUser.status})`)
        setHasPermission(false)
        setLoading(false)
        return
      }

      // Check role permissions
      if (requiredRole.length > 0 && !requiredRole.includes(appUser.role)) {
        console.log(`User ${appUser.full_name} doesn't have required role. Has: ${appUser.role}, Required: ${requiredRole.join(', ')}`)
        setHasPermission(false)
        setLoading(false)
        return
      }

      // Check module access
      if (requiredModule && (!appUser.module_access || !appUser.module_access.includes(requiredModule))) {
        console.log(`User ${appUser.full_name} doesn't have access to module: ${requiredModule}. Has access to: ${appUser.module_access?.join(', ') || 'none'}`)
        setHasPermission(false)
        setLoading(false)
        return
      }

      // All checks passed
      console.log(`✅ Permission granted for ${appUser.full_name}`)
      setHasPermission(true)
      setLoading(false)

    } catch (error) {
      console.error('Error checking permissions:', error)
      setHasPermission(false)
      setLoading(false)
    }
  }

  // Show access denied modal instead of redirecting
  useEffect(() => {
    if (!loading && !hasPermission) {
      console.log(`Access denied - showing modal`)
      setShowAccessDenied(true)
      // Delay redirect to allow user to see the modal
      setTimeout(() => {
        navigate(fallbackPath)
      }, 3000)
    }
  }, [loading, hasPermission, navigate, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <>
        <AccessDeniedModal
          open={showAccessDenied}
          onOpenChange={setShowAccessDenied}
          featureName={requiredModule || "this page"}
          requiredRole={requiredRole}
          requiredModule={requiredModule}
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      </>
    )
  }

  return <>{children}</>
}

// Hook to get current user permissions
export function useUserPermissions() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      console.log('🔍 [useUserPermissions] Getting current user...')
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        console.log('❌ [useUserPermissions] No auth user found')
        setLoading(false)
        return
      }

      console.log('✅ [useUserPermissions] Auth user found:', authUser.email, 'ID:', authUser.id)

      const { data: appUser, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle() // Use maybeSingle to avoid error on no results

      if (error) {
        console.error('❌ [useUserPermissions] Error fetching app user:', error)
        setLoading(false)
        return
      }

      if (!appUser) {
        console.log('❌ [useUserPermissions] No app user found for auth_user_id:', authUser.id)
        setLoading(false)
        return
      }

      console.log('✅ [useUserPermissions] App user found:', {
        name: appUser.full_name,
        email: appUser.company_email,
        role: appUser.role,
        status: appUser.status,
        module_access: appUser.module_access
      })

      setCurrentUser(appUser as User)
      setLoading(false)
    } catch (error) {
      console.error('❌ [useUserPermissions] Error getting current user:', error)
      setLoading(false)
    }
  }

  const hasModuleAccess = (module: string) => {
    console.log(`🔍 [hasModuleAccess] Checking module '${module}' for user:`, {
      userExists: !!currentUser,
      userName: currentUser?.full_name,
      role: currentUser?.role,
      status: currentUser?.status,
      moduleAccess: currentUser?.module_access,
      hasModule: currentUser?.module_access?.includes(module)
    })
    
    // Super admin has access to all modules
    if (currentUser?.role === 'super_admin') {
      console.log(`✅ [hasModuleAccess] Super admin access granted for '${module}'`)
      return true
    }
    
    const hasAccess = currentUser?.module_access?.includes(module) || false
    console.log(`${hasAccess ? '✅' : '❌'} [hasModuleAccess] Module '${module}' access: ${hasAccess}`)
    return hasAccess
  }

  const hasRole = (roles: string[]) => {
    if (!currentUser) return false
    // Super admin has all roles
    if (currentUser.role === 'super_admin') return true
    return roles.includes(currentUser.role)
  }

  const isActive = () => {
    // Super admin is always considered active
    if (currentUser?.role === 'super_admin') return true
    return currentUser?.status === 'active'
  }

  return {
    currentUser,
    loading,
    hasModuleAccess,
    hasRole,
    isActive
  }
}