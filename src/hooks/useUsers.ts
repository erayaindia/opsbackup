import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface User {
  id: string
  full_name: string
  company_email: string
  role: string
  department: string
  status: string
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
        .select('id, full_name, company_email, role, department, status')
        .eq('status', 'active')
        .order('full_name', { ascending: true })

      if (fetchError) {
        // Handle specific 406 Not Acceptable error
        if (fetchError.code === '406' || fetchError.message?.includes('406') || fetchError.message?.includes('Not Acceptable')) {
          console.warn('Users query returned 406 Not Acceptable - likely due to RLS policies or missing permissions')
          setUsers([])
          setError('Access restricted - unable to load users')
          return
        }
        throw new Error(`Failed to fetch users: ${fetchError.message}`)
      }

      // Return users in the expected format
      const transformedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        full_name: user.full_name || 'Unknown User',
        company_email: user.company_email || 'No email',
        role: user.role || 'employee',
        department: user.department || 'Unassigned',
        status: user.status
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