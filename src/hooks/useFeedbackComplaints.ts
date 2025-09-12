import { useState, useEffect, useCallback } from 'react'
import type {
  FeedbackComplaint,
  FeedbackKPIs,
  FeedbackFilters,
  CreateFeedbackData,
  UpdateFeedbackData
} from '@/types/feedback.types'
import {
  getFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackKPIs,
  getMockFeedbackData
} from '@/services/feedbackService'
import { toast } from 'sonner'

interface UseFeedbackComplaintsOptions {
  filters?: FeedbackFilters
  page?: number
  pageSize?: number
  useMockData?: boolean
}

export function useFeedbackComplaints(options: UseFeedbackComplaintsOptions = {}) {
  const {
    filters = {},
    page = 1,
    pageSize = 50,
    useMockData = true // Use mock data for development
  } = options

  const [feedback, setFeedback] = useState<FeedbackComplaint[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [kpis, setKpis] = useState<FeedbackKPIs>({
    total_feedback: 0,
    total_complaints: 0,
    resolution_rate: 0,
    average_resolution_time: 0,
    customer_satisfaction: 0,
    pending_count: 0,
    escalated_count: 0,
    trends: {
      feedback_trend: 0,
      resolution_trend: 0,
      satisfaction_trend: 0
    }
  })

  // Load feedback data
  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true)
      
      if (useMockData) {
        // Use mock data for development
        const mockData = getMockFeedbackData()
        let filteredData = mockData

        // Apply client-side filtering for mock data
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase()
          filteredData = filteredData.filter(item =>
            item.subject.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.customer_name.toLowerCase().includes(searchTerm) ||
            item.customer_email.toLowerCase().includes(searchTerm)
          )
        }

        if (filters.type && filters.type !== 'all') {
          filteredData = filteredData.filter(item => item.type === filters.type)
        }

        if (filters.status && filters.status !== 'all') {
          filteredData = filteredData.filter(item => item.status === filters.status)
        }

        if (filters.priority && filters.priority !== 'all') {
          filteredData = filteredData.filter(item => item.priority === filters.priority)
        }

        if (filters.category && filters.category !== 'all') {
          filteredData = filteredData.filter(item => item.category === filters.category)
        }

        setFeedback(filteredData)
        setTotalCount(filteredData.length)
        
        // Calculate KPIs from mock data
        const totalFeedback = mockData.filter(item => item.type === 'feedback').length
        const totalComplaints = mockData.filter(item => item.type === 'complaint').length
        const resolved = mockData.filter(item => item.status === 'resolved').length
        const pending = mockData.filter(item => ['new', 'in_progress'].includes(item.status)).length
        const escalated = mockData.filter(item => item.status === 'escalated').length
        
        const avgSatisfaction = mockData
          .filter(item => item.satisfaction_score)
          .reduce((sum, item) => sum + (item.satisfaction_score || 0), 0) / 
          mockData.filter(item => item.satisfaction_score).length || 0

        setKpis({
          total_feedback: totalFeedback,
          total_complaints: totalComplaints,
          resolution_rate: mockData.length > 0 ? (resolved / mockData.length) * 100 : 0,
          average_resolution_time: 18.5, // Mock average
          customer_satisfaction: avgSatisfaction,
          pending_count: pending,
          escalated_count: escalated,
          trends: {
            feedback_trend: 12.5,
            resolution_trend: -2.1,
            satisfaction_trend: 5.3
          }
        })
      } else {
        // Use real API calls
        const [feedbackResult, kpisResult] = await Promise.all([
          getFeedback(filters, page, pageSize),
          getFeedbackKPIs()
        ])

        setFeedback(feedbackResult.data)
        setTotalCount(feedbackResult.count)
        setKpis(kpisResult)
      }
    } catch (error) {
      console.error('Error loading feedback:', error)
      toast.error('Failed to load feedback data')
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize, useMockData])

  // Create new feedback
  const createFeedbackItem = useCallback(async (data: CreateFeedbackData) => {
    try {
      if (useMockData) {
        // For demo, just add to local state
        const newFeedback: FeedbackComplaint = {
          id: `mock-${Date.now()}`,
          ...data,
          status: 'new',
          sentiment: data.rating ? (data.rating >= 4 ? 'positive' : data.rating <= 2 ? 'negative' : 'neutral') : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: data.is_public || false
        }
        
        setFeedback(prev => [newFeedback, ...prev])
        setTotalCount(prev => prev + 1)
        toast.success('Feedback created successfully!')
        return newFeedback
      } else {
        const newFeedback = await createFeedback(data)
        if (newFeedback) {
          await loadFeedback() // Refresh data
          toast.success('Feedback created successfully!')
          return newFeedback
        } else {
          toast.error('Failed to create feedback')
          return null
        }
      }
    } catch (error) {
      console.error('Error creating feedback:', error)
      toast.error('Failed to create feedback')
      return null
    }
  }, [useMockData, loadFeedback])

  // Update feedback
  const updateFeedbackItem = useCallback(async (id: string, updates: UpdateFeedbackData) => {
    try {
      if (useMockData) {
        // For demo, just update local state
        setFeedback(prev => prev.map(item => 
          item.id === id 
            ? { ...item, ...updates, updated_at: new Date().toISOString() }
            : item
        ))
        toast.success('Feedback updated successfully!')
        return true
      } else {
        const updatedFeedback = await updateFeedback(id, updates)
        if (updatedFeedback) {
          await loadFeedback() // Refresh data
          toast.success('Feedback updated successfully!')
          return true
        } else {
          toast.error('Failed to update feedback')
          return false
        }
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      toast.error('Failed to update feedback')
      return false
    }
  }, [useMockData, loadFeedback])

  // Delete feedback
  const deleteFeedbackItem = useCallback(async (id: string) => {
    try {
      if (useMockData) {
        // For demo, just remove from local state
        setFeedback(prev => prev.filter(item => item.id !== id))
        setTotalCount(prev => prev - 1)
        toast.success('Feedback deleted successfully!')
        return true
      } else {
        const success = await deleteFeedback(id)
        if (success) {
          await loadFeedback() // Refresh data
          toast.success('Feedback deleted successfully!')
          return true
        } else {
          toast.error('Failed to delete feedback')
          return false
        }
      }
    } catch (error) {
      console.error('Error deleting feedback:', error)
      toast.error('Failed to delete feedback')
      return false
    }
  }, [useMockData, loadFeedback])

  // Get single feedback by ID
  const getFeedbackItem = useCallback(async (id: string): Promise<FeedbackComplaint | null> => {
    try {
      if (useMockData) {
        return feedback.find(item => item.id === id) || null
      } else {
        return await getFeedbackById(id)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
      return null
    }
  }, [useMockData, feedback])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadFeedback()
  }, [loadFeedback])

  // Pagination helpers
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  return {
    feedback,
    loading,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
    hasNextPage,
    hasPreviousPage,
    kpis,
    // Actions
    createFeedback: createFeedbackItem,
    updateFeedback: updateFeedbackItem,
    deleteFeedback: deleteFeedbackItem,
    getFeedback: getFeedbackItem,
    refreshFeedback: loadFeedback
  }
}