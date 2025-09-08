import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { activateUserOnLogin } from '@/services/usersService'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true
    let authSubscription: { data?: { subscription?: { unsubscribe?: () => void } } } | null = null

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
        }

        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
          setInitialized(true)
          
          // Try to activate user on initial session load only
          if (session?.user?.email) {
            console.log('Initial session found, attempting user activation...')
            activateUserOnLogin(session.user.id, session.user.email)
              .then(success => {
                if (success) {
                  console.log('User activation completed successfully')
                }
              })
              .catch(error => {
                console.error('Failed to activate user on initial session:', error)
              })
          }
        }

        // Set up auth state listener only after initial session check
        if (isMounted) {
          authSubscription = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return
            
            console.log('Auth state change:', event, session?.user?.id)
            
            // Only handle specific events to prevent infinite loops
            if (event === 'SIGNED_OUT') {
              setSession(null)
              setUser(null)
              if (location.pathname !== '/auth') {
                navigate('/auth')
              }
            } else if (event === 'SIGNED_IN') {
              setSession(session)
              setUser(session?.user ?? null)
              // Skip activation on SIGNED_IN to prevent loops - already done on initial session
            } else if (event === 'TOKEN_REFRESHED') {
              setSession(session)
              setUser(session?.user ?? null)
            }
            // Ignore INITIAL_SESSION to prevent loops
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (isMounted) {
          setSession(null)
          setUser(null)
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe()
      }
    }
  }, []) // Remove dependencies to prevent re-initialization

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user && !loading) {
    if (location.pathname !== '/auth') {
      navigate('/auth')
    }
    return null
  }

  if (user) {
    return children
  }

  return null
}