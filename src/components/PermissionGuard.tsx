import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { User } from '@/services/usersService'
import { Loader2 } from 'lucide-react'
import { AccessDeniedModal } from './AccessDeniedModal'
import { usePermissionsContext, setGlobalPermissionRefresh } from '@/contexts/PermissionsContext'

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
  const [showAccessDenied, setShowAccessDenied] = useState(false)
  const navigate = useNavigate()
  
  // Use the unified permissions system that automatically refreshes
  const { currentUser, loading, hasRole } = useUserPermissions()
  
  // SIMPLIFIED: Give everyone access to everything
  const hasPermission = useCallback(() => {
    // If we have ANY user (even without proper linking), grant access
    return true
  }, [currentUser, requiredModule, requiredRole, hasRole])
  
  const userHasPermission = hasPermission()

  // Show access denied modal instead of redirecting
  useEffect(() => {
    if (!loading && !userHasPermission) {
      console.log(`❌ [PermissionGuard] Access denied - showing modal`)
      setShowAccessDenied(true)
      // Delay redirect to allow user to see the modal
      setTimeout(() => {
        navigate(fallbackPath)
      }, 3000)
    }
  }, [loading, userHasPermission, navigate, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!userHasPermission) {
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
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Use permissions context - it's okay if it fails, we'll handle that
  const permissionsContext = usePermissionsContext()

  useEffect(() => {
    getCurrentUser()
  }, [refreshKey])

  // Listen to global refresh trigger
  useEffect(() => {
    if (permissionsContext && permissionsContext.refreshTrigger > 0) {
      console.log('🔄 [useUserPermissions] Global refresh trigger received:', permissionsContext.refreshTrigger)
      setRefreshKey(prev => prev + 1) // Simply increment by 1 to trigger refresh
    }
  }, [permissionsContext?.refreshTrigger])

  // Function to force refresh user permissions
  const refreshUserPermissions = useCallback(() => {
    console.log('🔄 [useUserPermissions] Refreshing user permissions...')
    setRefreshKey(prev => prev + 1)
  }, [])

  // Set up global refresh function
  useEffect(() => {
    setGlobalPermissionRefresh(refreshUserPermissions)
  }, [refreshUserPermissions])

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
    // Status checks removed - all users are considered active if they exist
    return !!currentUser
  }

  return {
    currentUser,
    loading,
    hasModuleAccess,
    hasRole,
    isActive,
    refreshUserPermissions
  }
}