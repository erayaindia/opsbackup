import { useState, useCallback, useRef } from 'react'
import { toast } from '@/hooks/use-toast'
import type { OptimisticUpdate } from '@/types/products'

/**
 * Hook for managing optimistic updates with rollback capability
 * Shows changes immediately and rolls back if the server operation fails
 */
export const useOptimisticUpdates = <T = unknown>() => {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map())
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Add a new optimistic update
  const addOptimisticUpdate = useCallback((
    update: Omit<OptimisticUpdate<T>, 'id' | 'timestamp' | 'status'>
  ): string => {
    const id = `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()

    const optimisticUpdate: OptimisticUpdate<T> = {
      ...update,
      id,
      timestamp,
      status: 'pending'
    }

    setOptimisticUpdates(prev => new Map(prev).set(id, optimisticUpdate))

    // Auto-cleanup after 30 seconds if not resolved
    const timeout = setTimeout(() => {
      console.warn(`Optimistic update ${id} timed out`)
      resolveOptimisticUpdate(id, false)
    }, 30000)

    timeoutRefs.current.set(id, timeout)

    return id
  }, [])

  // Resolve an optimistic update (success or failure)
  const resolveOptimisticUpdate = useCallback((id: string, success: boolean) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev)
      const update = newMap.get(id)

      if (update) {
        if (success) {
          // Remove successful updates
          newMap.delete(id)
        } else {
          // Mark as error for potential rollback
          newMap.set(id, { ...update, status: 'error' })

          // Show error notification
          toast({
            title: 'Operation Failed',
            description: 'The change could not be saved. Please try again.',
            variant: 'destructive'
          })

          // Auto-remove error updates after 5 seconds
          setTimeout(() => {
            setOptimisticUpdates(current => {
              const updated = new Map(current)
              updated.delete(id)
              return updated
            })
          }, 5000)
        }
      }

      return newMap
    })

    // Clear timeout
    const timeout = timeoutRefs.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutRefs.current.delete(id)
    }
  }, [])

  // Clear all optimistic updates
  const clearOptimisticUpdates = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    timeoutRefs.current.clear()

    setOptimisticUpdates(new Map())
  }, [])

  // Get pending updates
  const getPendingUpdates = useCallback(() => {
    return Array.from(optimisticUpdates.values()).filter(update => update.status === 'pending')
  }, [optimisticUpdates])

  // Get failed updates
  const getFailedUpdates = useCallback(() => {
    return Array.from(optimisticUpdates.values()).filter(update => update.status === 'error')
  }, [optimisticUpdates])

  // Check if there are any pending updates
  const hasPendingUpdates = useCallback(() => {
    return Array.from(optimisticUpdates.values()).some(update => update.status === 'pending')
  }, [optimisticUpdates])

  // Apply optimistic updates to data
  const applyOptimisticUpdates = useCallback(<TData>(
    originalData: TData[],
    getId: (item: TData) => string,
    applyUpdate: (data: TData[], update: OptimisticUpdate<T>) => TData[]
  ): TData[] => {
    let updatedData = [...originalData]

    // Apply updates in chronological order
    const sortedUpdates = Array.from(optimisticUpdates.values())
      .filter(update => update.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp)

    for (const update of sortedUpdates) {
      try {
        updatedData = applyUpdate(updatedData, update)
      } catch (error) {
        console.error('Failed to apply optimistic update:', error)
      }
    }

    return updatedData
  }, [optimisticUpdates])

  return {
    optimisticUpdates,
    addOptimisticUpdate,
    resolveOptimisticUpdate,
    clearOptimisticUpdates,
    getPendingUpdates,
    getFailedUpdates,
    hasPendingUpdates,
    applyOptimisticUpdates
  }
}

// Specialized hook for product optimistic updates
export const useProductOptimisticUpdates = () => {
  const {
    optimisticUpdates,
    addOptimisticUpdate,
    resolveOptimisticUpdate,
    clearOptimisticUpdates,
    getPendingUpdates,
    getFailedUpdates,
    hasPendingUpdates,
    applyOptimisticUpdates
  } = useOptimisticUpdates()

  // Add optimistic product creation
  const addOptimisticCreate = useCallback((tempProduct: unknown) => {
    return addOptimisticUpdate({
      type: 'create',
      newData: tempProduct
    })
  }, [addOptimisticUpdate])

  // Add optimistic product update
  const addOptimisticUpdate_ = useCallback((productId: string, originalData: unknown, newData: unknown) => {
    return addOptimisticUpdate({
      type: 'update',
      originalData,
      newData: { ...originalData, ...newData, id: productId }
    })
  }, [addOptimisticUpdate])

  // Add optimistic product deletion
  const addOptimisticDelete = useCallback((productId: string, originalData: unknown) => {
    return addOptimisticUpdate({
      type: 'delete',
      originalData,
      newData: { id: productId }
    })
  }, [addOptimisticUpdate])

  // Apply optimistic updates to product list
  const applyToProductList = useCallback(<TProduct extends { id: string }>(
    products: TProduct[]
  ): TProduct[] => {
    return applyOptimisticUpdates(
      products,
      (product) => product.id,
      (data, update) => {
        switch (update.type) {
          case 'create':
            if (update.newData && typeof update.newData === 'object' && 'id' in update.newData) {
              return [update.newData as TProduct, ...data]
            }
            return data

          case 'update':
            if (update.newData && typeof update.newData === 'object' && 'id' in update.newData) {
              const productId = (update.newData as { id: string }).id
              return data.map(item =>
                item.id === productId ? { ...item, ...(update.newData as Partial<TProduct>) } : item
              )
            }
            return data

          case 'delete':
            if (update.newData && typeof update.newData === 'object' && 'id' in update.newData) {
              const productId = (update.newData as { id: string }).id
              return data.filter(item => item.id !== productId)
            }
            return data

          default:
            return data
        }
      }
    )
  }, [applyOptimisticUpdates])

  return {
    optimisticUpdates,
    addOptimisticCreate,
    addOptimisticUpdate: addOptimisticUpdate_,
    addOptimisticDelete,
    resolveOptimisticUpdate,
    clearOptimisticUpdates,
    getPendingUpdates,
    getFailedUpdates,
    hasPendingUpdates,
    applyToProductList
  }
}

// Helper for creating temporary IDs for optimistic updates
export const createTempId = (prefix: string = 'temp'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper for checking if an ID is temporary
export const isTempId = (id: string): boolean => {
  return id.startsWith('temp_') || id.startsWith('optimistic_')
}

export type { OptimisticUpdate }