import React, { createContext, useContext, useState, useCallback } from 'react'

interface PermissionsContextType {
  refreshTrigger: number
  triggerRefresh: () => void
}

const PermissionsContext = createContext<PermissionsContextType | null>(null)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = useCallback(() => {
    console.log('🔄 [PermissionsContext] Triggering global permissions refresh...')
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <PermissionsContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext)
  if (!context) {
    // Return default values when not in provider context
    return { refreshTrigger: 0, triggerRefresh: () => {} }
  }
  return context
}

// Global function to trigger refresh from anywhere
let globalTriggerRefresh: (() => void) | null = null

export function setGlobalPermissionRefresh(triggerFn: () => void) {
  globalTriggerRefresh = triggerFn
}

export function triggerGlobalPermissionRefresh() {
  if (globalTriggerRefresh) {
    console.log('🌍 [PermissionsContext] Triggering global refresh from external call')
    globalTriggerRefresh()
  } else {
    console.warn('⚠️ [PermissionsContext] Global refresh trigger not set')
  }
}