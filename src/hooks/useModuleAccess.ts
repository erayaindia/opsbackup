import { useUserPermissions } from '@/components/PermissionGuard'
import { usePermissionsContext } from '@/contexts/PermissionsContext'

export function useModuleAccess() {
  const { currentUser, loading, hasModuleAccess, refreshUserPermissions } = useUserPermissions()
  const permissionsContext = usePermissionsContext()

  const canAccessModule = (module: string): boolean => {
    // SIMPLIFIED: Give everyone access to everything
    return true
  }

  const getAccessibleModules = (): string[] => {
    if (!currentUser) return []
    if (currentUser.role === 'super_admin') return ['all'] // Super admin sees everything
    return currentUser.module_access || []
  }

  // Map URL paths to module names for easier checking
  const getModuleFromPath = (path: string): string => {
    // Remove leading slash and get first part
    const segments = path.replace(/^\//, '').split('/')
    const firstSegment = segments[0]
    
    // Map paths to modules based on your AddUserModal AVAILABLE_MODULES
    const pathToModule: Record<string, string> = {
      '': 'dashboard',
      'orders': 'orders',
      'fulfillment': 'fulfillment',
      'support': 'support',
      'team-hub': 'team-hub',
      'content': 'content',
      'marketing': 'marketing',
      'products': 'products',
      'finance': 'finance',
      'management': 'management',
      'users': 'management', // Users page maps to management module
      'training': 'training',
      'analytics': 'analytics',
      'alerts': 'alerts'
    }
    
    return pathToModule[firstSegment] || firstSegment
  }

  const canAccessPath = (path: string): boolean => {
    const module = getModuleFromPath(path)
    return canAccessModule(module)
  }

  // Get user info for debugging
  const getUserInfo = () => {
    if (!currentUser) return 'No user'
    return {
      name: currentUser.full_name,
      role: currentUser.role,
      modules: currentUser.module_access
    }
  }

  return { 
    canAccessModule,
    canAccessPath,
    getAccessibleModules,
    getModuleFromPath,
    getUserInfo,
    currentUser,
    isLoading: loading,
    refreshPermissions: refreshUserPermissions
  }
}