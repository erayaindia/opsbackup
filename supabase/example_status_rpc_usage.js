// Phase 2: Example Usage of admin_set_user_status RPC
// How to call the status update function from your React app

// =============================================================================
// SUPABASE CLIENT SETUP (in your app)
// =============================================================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// =============================================================================
// EXAMPLE USAGE IN REACT COMPONENT
// =============================================================================

// Example 1: Suspend a user
const suspendUser = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('admin_set_user_status', {
      p_user_id: userId,
      p_status: 'suspended'
    })

    if (error) {
      throw error
    }

    if (data.success) {
      console.log(`User ${data.user_name} status changed from ${data.old_status} to ${data.new_status}`)
      // Show success toast
      toast.success(`User suspended successfully`)
    } else {
      throw new Error(data.error)
    }

    return data
  } catch (error) {
    console.error('Error suspending user:', error)
    toast.error(`Failed to suspend user: ${error.message}`)
    throw error
  }
}

// Example 2: Activate a user
const activateUser = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('admin_set_user_status', {
      p_user_id: userId,
      p_status: 'active'
    })

    if (error) {
      throw error
    }

    if (data.success) {
      console.log('User activated:', data)
      toast.success(`User activated successfully`)
    } else {
      throw new Error(data.error)
    }

    return data
  } catch (error) {
    console.error('Error activating user:', error)
    toast.error(`Failed to activate user: ${error.message}`)
    throw error
  }
}

// Example 3: Generic status change with optimistic UI
const changeUserStatus = async (userId, newStatus, currentStatus) => {
  try {
    // Optimistic UI update (update local state first)
    updateUserStatusLocally(userId, newStatus)

    const { data, error } = await supabase.rpc('admin_set_user_status', {
      p_user_id: userId,
      p_status: newStatus
    })

    if (error) {
      throw error
    }

    if (!data.success) {
      throw new Error(data.error)
    }

    // Success - the optimistic update was correct
    console.log('Status change successful:', data)
    toast.success(`User status changed to ${newStatus}`)

    return data

  } catch (error) {
    // Revert optimistic update on error
    updateUserStatusLocally(userId, currentStatus)
    
    console.error('Status change failed:', error)
    toast.error(`Failed to change status: ${error.message}`)
    throw error
  }
}

// =============================================================================
// REACT HOOK FOR STATUS MANAGEMENT
// =============================================================================

import { useState, useCallback } from 'react'
import { toast } from 'sonner' // or your toast library

export const useUserStatusActions = () => {
  const [isUpdating, setIsUpdating] = useState(false)

  const updateStatus = useCallback(async (userId, newStatus) => {
    setIsUpdating(true)
    
    try {
      const { data, error } = await supabase.rpc('admin_set_user_status', {
        p_user_id: userId,
        p_status: newStatus
      })

      if (error) throw error

      if (data.success) {
        toast.success(`User status updated to ${newStatus}`)
        return data
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast.error(`Failed to update status: ${error.message}`)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const suspendUser = useCallback((userId) => updateStatus(userId, 'suspended'), [updateStatus])
  const activateUser = useCallback((userId) => updateStatus(userId, 'active'), [updateStatus])

  return {
    updateStatus,
    suspendUser,
    activateUser,
    isUpdating
  }
}

// =============================================================================
// USAGE IN COMPONENT
// =============================================================================

// In your Users table component:
const UsersTable = () => {
  const { suspendUser, activateUser, isUpdating } = useUserStatusActions()

  const handleSuspend = async (user) => {
    try {
      await suspendUser(user.id)
      // Refetch users list or update local state
      refetchUsers()
    } catch (error) {
      // Error already handled in hook
    }
  }

  return (
    // Your table JSX with action buttons
    <Button 
      onClick={() => handleSuspend(user)}
      disabled={isUpdating}
    >
      {isUpdating ? 'Updating...' : 'Suspend'}
    </Button>
  )
}

// =============================================================================
// DIRECT SUPABASE RPC CALLS (for reference)
// =============================================================================

// Suspend user
// supabase.rpc('admin_set_user_status', { p_user_id: 'uuid-here', p_status: 'suspended' })

// Activate user  
// supabase.rpc('admin_set_user_status', { p_user_id: 'uuid-here', p_status: 'active' })

// Put user on leave
// supabase.rpc('admin_set_user_status', { p_user_id: 'uuid-here', p_status: 'on_leave' })

// =============================================================================