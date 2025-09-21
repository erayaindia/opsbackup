import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import type { UndoRedoAction, UndoRedoState } from '@/types/products'

/**
 * Hook for managing undo/redo functionality
 * Maintains a history of actions that can be undone and redone
 */
export const useUndoRedo = (maxHistorySize: number = 50) => {
  const [state, setState] = useState<UndoRedoState>({
    history: [],
    currentIndex: -1,
    maxHistorySize
  })

  const isPerformingAction = useRef(false)

  // Derived state
  const canUndo = state.currentIndex >= 0
  const canRedo = state.currentIndex < state.history.length - 1

  // Add a new action to the history
  const addAction = useCallback((
    action: Omit<UndoRedoAction, 'id' | 'timestamp'>
  ) => {
    // Don't add actions while performing undo/redo
    if (isPerformingAction.current) return

    const newAction: UndoRedoAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    setState(prevState => {
      // Remove any actions after current index (redo history is lost when new action is added)
      const newHistory = prevState.history.slice(0, prevState.currentIndex + 1)
      newHistory.push(newAction)

      // Trim history if it exceeds max size
      const trimmedHistory = newHistory.slice(-maxHistorySize)
      const newIndex = trimmedHistory.length - 1

      return {
        ...prevState,
        history: trimmedHistory,
        currentIndex: newIndex
      }
    })
  }, [maxHistorySize])

  // Undo the last action
  const undo = useCallback(async () => {
    if (!canUndo) return

    const action = state.history[state.currentIndex]
    if (!action) return

    isPerformingAction.current = true

    try {
      await action.undo()

      setState(prevState => ({
        ...prevState,
        currentIndex: prevState.currentIndex - 1
      }))

      toast({
        title: 'Undone',
        description: `${action.description} has been undone`,
        duration: 3000
      })
    } catch (error) {
      console.error('Failed to undo action:', error)
      toast({
        title: 'Undo Failed',
        description: `Could not undo "${action.description}". Please try again.`,
        variant: 'destructive'
      })
    } finally {
      isPerformingAction.current = false
    }
  }, [canUndo, state.history, state.currentIndex])

  // Redo the next action
  const redo = useCallback(async () => {
    if (!canRedo) return

    const action = state.history[state.currentIndex + 1]
    if (!action) return

    isPerformingAction.current = true

    try {
      await action.execute()

      setState(prevState => ({
        ...prevState,
        currentIndex: prevState.currentIndex + 1
      }))

      toast({
        title: 'Redone',
        description: `${action.description} has been redone`,
        duration: 3000
      })
    } catch (error) {
      console.error('Failed to redo action:', error)
      toast({
        title: 'Redo Failed',
        description: `Could not redo "${action.description}". Please try again.`,
        variant: 'destructive'
      })
    } finally {
      isPerformingAction.current = false
    }
  }, [canRedo, state.history, state.currentIndex])

  // Clear the entire history
  const clearHistory = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      history: [],
      currentIndex: -1
    }))
  }, [])

  // Get recent actions (for displaying in UI)
  const getRecentActions = useCallback((count: number = 10) => {
    return state.history.slice(-count)
  }, [state.history])

  // Get action at specific index
  const getActionAtIndex = useCallback((index: number) => {
    return state.history[index]
  }, [state.history])

  // Check if currently performing an action
  const isPerforming = useCallback(() => {
    return isPerformingAction.current
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPerformingAction.current) return

      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
        event.preventDefault()
        redo()
        return
      }

      // Ctrl+Y or Cmd+Y for redo (alternative)
      if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault()
        redo()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    state,
    canUndo,
    canRedo,
    addAction,
    undo,
    redo,
    clearHistory,
    getRecentActions,
    getActionAtIndex,
    isPerforming
  }
}

// Specialized hook for product actions
export const useProductUndoRedo = () => {
  const undoRedo = useUndoRedo()

  // Helper to create product action
  const createProductAction = useCallback((
    type: 'create' | 'update' | 'delete' | 'duplicate' | 'archive' | 'favorite',
    productName: string,
    execute: () => Promise<void> | void,
    undo: () => Promise<void> | void
  ) => {
    const actionMap = {
      create: `Create product "${productName}"`,
      update: `Update product "${productName}"`,
      delete: `Delete product "${productName}"`,
      duplicate: `Duplicate product "${productName}"`,
      archive: `Archive product "${productName}"`,
      favorite: `Favorite product "${productName}"`
    }

    return undoRedo.addAction({
      type,
      description: actionMap[type],
      execute,
      undo
    })
  }, [undoRedo])

  // Add product creation action
  const addCreateAction = useCallback((
    productName: string,
    onCreate: () => Promise<void> | void,
    onDelete: () => Promise<void> | void
  ) => {
    createProductAction('create', productName, onCreate, onDelete)
  }, [createProductAction])

  // Add product update action
  const addUpdateAction = useCallback((
    productName: string,
    onUpdate: () => Promise<void> | void,
    onRevert: () => Promise<void> | void
  ) => {
    createProductAction('update', productName, onUpdate, onRevert)
  }, [createProductAction])

  // Add product delete action
  const addDeleteAction = useCallback((
    productName: string,
    onDelete: () => Promise<void> | void,
    onRestore: () => Promise<void> | void
  ) => {
    createProductAction('delete', productName, onDelete, onRestore)
  }, [createProductAction])

  // Add product duplicate action
  const addDuplicateAction = useCallback((
    productName: string,
    onDuplicate: () => Promise<void> | void,
    onRemoveDuplicate: () => Promise<void> | void
  ) => {
    createProductAction('duplicate', productName, onDuplicate, onRemoveDuplicate)
  }, [createProductAction])

  // Add product archive action
  const addArchiveAction = useCallback((
    productName: string,
    onArchive: () => Promise<void> | void,
    onUnarchive: () => Promise<void> | void
  ) => {
    createProductAction('archive', productName, onArchive, onUnarchive)
  }, [createProductAction])

  // Add product favorite action
  const addFavoriteAction = useCallback((
    productName: string,
    onFavorite: () => Promise<void> | void,
    onUnfavorite: () => Promise<void> | void
  ) => {
    createProductAction('favorite', productName, onFavorite, onUnfavorite)
  }, [createProductAction])

  return {
    ...undoRedo,
    addCreateAction,
    addUpdateAction,
    addDeleteAction,
    addDuplicateAction,
    addArchiveAction,
    addFavoriteAction
  }
}

// Component for displaying undo/redo controls
export interface UndoRedoControlsProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  recentActions?: UndoRedoAction[]
  className?: string
}

// Helper for creating reversible actions
export const createReversibleAction = <T>(
  description: string,
  forward: () => Promise<T> | T,
  backward: () => Promise<void> | void
): Omit<UndoRedoAction, 'id' | 'timestamp'> => {
  return {
    type: 'reversible',
    description,
    execute: forward,
    undo: backward
  }
}

// Helper for batching multiple actions into one undoable action
export const batchActions = (
  description: string,
  actions: Array<() => Promise<void> | void>,
  undoActions: Array<() => Promise<void> | void>
): Omit<UndoRedoAction, 'id' | 'timestamp'> => {
  return {
    type: 'batch',
    description,
    execute: async () => {
      for (const action of actions) {
        await action()
      }
    },
    undo: async () => {
      // Undo in reverse order
      for (let i = undoActions.length - 1; i >= 0; i--) {
        await undoActions[i]()
      }
    }
  }
}

export type { UndoRedoAction, UndoRedoState }