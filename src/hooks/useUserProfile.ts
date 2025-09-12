import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface UserProfile {
  appUser: any
  employeeDetails: any
  profilePicture: any
  documentsWithUrls: any[]
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('Not authenticated')
      }

      // Get app user data
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (appUserError) {
        console.log('App user error:', appUserError)
      }

      // Get employee details
      const { data: employeeDetails, error: employeeError } = await supabase
        .from('employees_details')
        .select('*')
        .eq('personal_email', user.email)
        .single()

      if (employeeError) {
        console.log('Employee details error:', employeeError)
      }

      // Set profile data
      setProfile({
        appUser: appUser || null,
        employeeDetails: employeeDetails || null,
        profilePicture: null,
        documentsWithUrls: employeeDetails?.documents || []
      })

    } catch (err) {
      console.error('Profile fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile
  }
}