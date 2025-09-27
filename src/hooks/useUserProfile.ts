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

      console.log('🔍 Starting profile fetch...')

      // Get current user - try both session and getUser
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      let user = session?.user

      if (!user) {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        user = userData.user

        if (userError || !user) {
          throw new Error('Not authenticated')
        }
      }

      console.log('👤 Auth user:', { id: user.id, email: user.email })

      // Get app user details by auth_user_id only (email column doesn't exist)
      let { data: employeeDetails, error: employeeError } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      console.log('👨‍💼 App user result:', { employeeDetails, employeeError })

      if (employeeError) {
        console.log('❌ App user error:', employeeError)
        throw new Error(`Failed to fetch user profile: ${employeeError.message}`)
      }

      if (!employeeDetails) {
        console.log('❌ No app user found for auth user:', user.id)
        throw new Error('User profile not found. Please contact support.')
      }

      // Use employeeDetails as our appUser (they contain the same info)
      const finalAppUser = employeeDetails
      console.log('👤 Final app user (from employee details):', { finalAppUser })

      // Generate signed URLs for documents and extract profile picture
      let documentsWithUrls: any[] = []
      let profilePicture = null

      // Document handling for app_users table (simplified)
      // Note: app_users table may have different structure than employees_details

      // Set profile data
      const profileData = {
        appUser: finalAppUser || null,
        employeeDetails: employeeDetails || null,
        profilePicture,
        documentsWithUrls
      }

      console.log('✅ Setting profile data:', profileData)
      setProfile(profileData)

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