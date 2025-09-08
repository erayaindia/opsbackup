import { ReactNode, createContext, useContext } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'

// Context to provide read-only state to child components
const ReadOnlyContext = createContext<boolean>(false)

export const useReadOnly = () => useContext(ReadOnlyContext)

interface ReadOnlyGuardProps {
  children: ReactNode
  adminRoles?: string[]
}

export function ReadOnlyGuard({ 
  children, 
  adminRoles = ['super_admin', 'admin'] 
}: ReadOnlyGuardProps) {
  const [isReadOnly, setIsReadOnly] = useState(true) // Default to read-only
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        setIsReadOnly(true)
        setLoading(false)
        return
      }

      const { data: appUser, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle()

      console.log('🔍 ReadOnlyGuard: User role check:', {
        authUserId: authUser.id,
        authEmail: authUser.email,
        appUser,
        userError,
        adminRoles
      })

      if (userError) {
        console.error('❌ ReadOnlyGuard: Error fetching user:', userError)
        setIsReadOnly(true)
      } else if (appUser && adminRoles.includes(appUser.role)) {
        console.log(`✅ ReadOnlyGuard: User ${appUser.role} (${appUser.full_name}) has admin access`)
        setIsReadOnly(false)
      } else {
        console.log(`❌ ReadOnlyGuard: User ${appUser?.role || 'unknown'} has read-only access`)
        setIsReadOnly(true)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error checking user role:', error)
      setIsReadOnly(true)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      {children}
      {isReadOnly && (
        <div className="fixed bottom-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg">
          🔒 Read-only access - Contact admin for full permissions
        </div>
      )}
    </ReadOnlyContext.Provider>
  )
}