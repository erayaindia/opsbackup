import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch users from app_users table
      const { data, error: fetchError } = await supabase
        .from('app_users')
        .select('id, full_name, company_email, status')
        .eq('status', 'active')
        .order('full_name', { ascending: true })

      if (fetchError) {
        throw new Error(`Failed to fetch users: ${fetchError.message}`)
      }

      // Transform to the expected User format
      const transformedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        name: user.full_name,
        email: user.company_email,
        avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${user.full_name.replace(/\s+/g, '')}`
      }))

      setUsers(transformedUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')

      // Fallback to empty array on error
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  }
}