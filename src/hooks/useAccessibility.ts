import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '@/hooks/use-toast'

/**
 * Hook for managing screen reader announcements
 */
export const useScreenReader = () => {
  const ariaLiveRef = useRef<HTMLDivElement | null>(null)

  // Create the aria-live region if it doesn't exist
  useEffect(() => {
    if (!ariaLiveRef.current) {
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.setAttribute('class', 'sr-only')
      liveRegion.setAttribute('id', 'screen-reader-announcements')
      liveRegion.style.position = 'absolute'
      liveRegion.style.left = '-10000px'
      liveRegion.style.width = '1px'
      liveRegion.style.height = '1px'
      liveRegion.style.overflow = 'hidden'

      document.body.appendChild(liveRegion)
      ariaLiveRef.current = liveRegion
    }

    return () => {
      if (ariaLiveRef.current && document.body.contains(ariaLiveRef.current)) {
        document.body.removeChild(ariaLiveRef.current)
      }
    }
  }, [])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (ariaLiveRef.current) {
      ariaLiveRef.current.setAttribute('aria-live', priority)
      ariaLiveRef.current.textContent = message

      // Clear the message after it's been announced
      setTimeout(() => {
        if (ariaLiveRef.current) {
          ariaLiveRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  const announceLoading = useCallback((action: string) => {
    announce(`Loading ${action}`, 'polite')
  }, [announce])

  const announceSuccess = useCallback((action: string) => {
    announce(`${action} completed successfully`, 'polite')
  }, [announce])

  const announceError = useCallback((action: string, error?: string) => {
    announce(`${action} failed${error ? `: ${error}` : ''}`, 'assertive')
  }, [announce])

  const announceFilter = useCallback((filterType: string, value: string, count: number) => {
    announce(`Filtered by ${filterType}: ${value}. Showing ${count} results`, 'polite')
  }, [announce])

  const announceSort = useCallback((sortBy: string, direction: string, count: number) => {
    announce(`Sorted by ${sortBy} ${direction}. Showing ${count} results`, 'polite')
  }, [announce])

  return {
    announce,
    announceLoading,
    announceSuccess,
    announceError,
    announceFilter,
    announceSort
  }
}

/**
 * Hook for managing focus trap in modals and overlays
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="option"]'
  ].join(', ')

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return []
    return Array.from(containerRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[]
  }, [focusableSelectors])

  const setInitialFocus = useCallback(() => {
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      // Look for autofocus element first
      const autofocusElement = focusableElements.find(el => el.hasAttribute('autofocus'))
      if (autofocusElement) {
        autofocusElement.focus()
      } else {
        focusableElements[0].focus()
      }
    }
  }, [getFocusableElements])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive || event.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement as HTMLElement

    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }, [isActive, getFocusableElements])

  useEffect(() => {
    if (isActive) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement

      // Set initial focus
      setTimeout(setInitialFocus, 0)

      // Add event listener
      document.addEventListener('keydown', handleKeyDown)
    } else {
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, setInitialFocus, handleKeyDown])

  return containerRef
}

/**
 * Hook for keyboard navigation in lists and grids
 */
export const useKeyboardNavigation = (
  itemCount: number,
  columns: number = 1,
  onActivate?: (index: number) => void
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLElement | null>(null)

  const moveFocus = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < itemCount) {
      setFocusedIndex(newIndex)

      // Focus the element
      if (containerRef.current) {
        const items = containerRef.current.querySelectorAll('[data-keyboard-nav-item]')
        const item = items[newIndex] as HTMLElement
        if (item) {
          item.focus()
        }
      }
    }
  }, [itemCount])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveFocus(Math.min(focusedIndex + columns, itemCount - 1))
        break

      case 'ArrowUp':
        event.preventDefault()
        moveFocus(Math.max(focusedIndex - columns, 0))
        break

      case 'ArrowRight':
        event.preventDefault()
        if (columns > 1) {
          moveFocus(Math.min(focusedIndex + 1, itemCount - 1))
        }
        break

      case 'ArrowLeft':
        event.preventDefault()
        if (columns > 1) {
          moveFocus(Math.max(focusedIndex - 1, 0))
        }
        break

      case 'Home':
        event.preventDefault()
        moveFocus(0)
        break

      case 'End':
        event.preventDefault()
        moveFocus(itemCount - 1)
        break

      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && onActivate) {
          event.preventDefault()
          onActivate(focusedIndex)
        }
        break
    }
  }, [focusedIndex, itemCount, columns, moveFocus, onActivate])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown])

  const getItemProps = useCallback((index: number) => ({
    'data-keyboard-nav-item': true,
    'tabIndex': focusedIndex === index ? 0 : -1,
    'aria-posinset': index + 1,
    'aria-setsize': itemCount,
    onFocus: () => setFocusedIndex(index)
  }), [focusedIndex, itemCount])

  return {
    containerRef,
    focusedIndex,
    setFocusedIndex,
    getItemProps
  }
}

/**
 * Hook for managing ARIA expanded state
 */
export const useAriaExpanded = (initialState: boolean = false) => {
  const [isExpanded, setIsExpanded] = useState(initialState)

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const expand = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const collapse = useCallback(() => {
    setIsExpanded(false)
  }, [])

  const getToggleProps = useCallback(() => ({
    'aria-expanded': isExpanded,
    onClick: toggle
  }), [isExpanded, toggle])

  const getContentProps = useCallback(() => ({
    'aria-hidden': !isExpanded,
    hidden: !isExpanded
  }), [isExpanded])

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    getToggleProps,
    getContentProps
  }
}

/**
 * Hook for managing skip links
 */
export const useSkipLinks = () => {
  const skipLinkRef = useRef<HTMLAnchorElement | null>(null)

  const createSkipLink = useCallback((targetId: string, label: string) => {
    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2'
    skipLink.textContent = label

    // Insert at the beginning of the body
    document.body.insertBefore(skipLink, document.body.firstChild)

    return skipLink
  }, [])

  const removeSkipLink = useCallback((skipLink: HTMLAnchorElement) => {
    if (document.body.contains(skipLink)) {
      document.body.removeChild(skipLink)
    }
  }, [])

  return {
    createSkipLink,
    removeSkipLink
  }
}

/**
 * Hook for managing live regions and updates
 */
export const useLiveRegion = (id: string) => {
  const regionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!regionRef.current) {
      const existing = document.getElementById(id)
      if (existing) {
        regionRef.current = existing as HTMLDivElement
      } else {
        const region = document.createElement('div')
        region.id = id
        region.setAttribute('aria-live', 'polite')
        region.setAttribute('aria-atomic', 'true')
        region.className = 'sr-only'
        document.body.appendChild(region)
        regionRef.current = region
      }
    }

    return () => {
      if (regionRef.current && document.body.contains(regionRef.current)) {
        document.body.removeChild(regionRef.current)
      }
    }
  }, [id])

  const updateRegion = useCallback((message: string, assertive: boolean = false) => {
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', assertive ? 'assertive' : 'polite')
      regionRef.current.textContent = message
    }
  }, [])

  return { updateRegion }
}

/**
 * Hook for managing reduced motion preferences
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

/**
 * Utility function to generate unique IDs for accessibility
 */
export const useUniqueId = (prefix: string = 'id') => {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`)
  return id
}

/**
 * Hook for managing focus restoration
 */
export const useFocusRestore = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus()
    }
  }, [])

  return { saveFocus, restoreFocus }
}

/**
 * Accessibility helper utilities
 */
export const a11yUtils = {
  // Generate ARIA label for sorting
  getSortAriaLabel: (field: string, direction: 'asc' | 'desc') => {
    return `Sort by ${field} in ${direction === 'asc' ? 'ascending' : 'descending'} order`
  },

  // Generate ARIA label for filters
  getFilterAriaLabel: (filterType: string, isActive: boolean, count?: number) => {
    const status = isActive ? 'active' : 'inactive'
    const countText = count !== undefined ? `, ${count} applied` : ''
    return `${filterType} filter, ${status}${countText}`
  },

  // Generate ARIA label for pagination
  getPaginationAriaLabel: (page: number, totalPages: number, totalItems: number) => {
    return `Page ${page} of ${totalPages}, showing ${totalItems} total items`
  },

  // Generate ARIA label for product actions
  getProductActionAriaLabel: (action: string, productName: string) => {
    return `${action} ${productName}`
  },

  // Generate ARIA description for search results
  getSearchResultsDescription: (query: string, count: number) => {
    return `Search for "${query}" returned ${count} ${count === 1 ? 'result' : 'results'}`
  }
}