import { supabase } from '@/integrations/supabase/client'
import type {
  FeedbackComplaint,
  FeedbackResponse,
  FeedbackKPIs,
  FeedbackFilters,
  CreateFeedbackData,
  UpdateFeedbackData,
  FeedbackAnalytics,
  FeedbackTemplate
} from '@/types/feedback.types'

// Create new feedback/complaint
export async function createFeedback(data: CreateFeedbackData): Promise<FeedbackComplaint | null> {
  try {
    const { data: feedback, error } = await supabase
      .from('feedback_complaints')
      .insert({
        ...data,
        status: 'new',
        sentiment: data.rating ? (data.rating >= 4 ? 'positive' : data.rating <= 2 ? 'negative' : 'neutral') : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: data.is_public || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating feedback:', error)
      return null
    }

    return feedback
  } catch (error) {
    console.error('Error creating feedback:', error)
    return null
  }
}

// Get feedback with filters and pagination
export async function getFeedback(
  filters: FeedbackFilters = {},
  page = 1,
  pageSize = 50
): Promise<{ data: FeedbackComplaint[]; count: number }> {
  try {
    let query = supabase
      .from('feedback_complaints')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`)
    }

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority)
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    if (filters.source && filters.source !== 'all') {
      query = query.eq('source', filters.source)
    }

    if (filters.assigned_to && filters.assigned_to !== 'all') {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    if (filters.rating && filters.rating !== 'all') {
      query = query.eq('rating', filters.rating)
    }

    if (filters.has_order !== undefined) {
      if (filters.has_order) {
        query = query.not('order_id', 'is', null)
      } else {
        query = query.is('order_id', null)
      }
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching feedback:', error)
      return { data: [], count: 0 }
    }

    return { data: data || [], count: count || 0 }
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return { data: [], count: 0 }
  }
}

// Get single feedback by ID
export async function getFeedbackById(id: string): Promise<FeedbackComplaint | null> {
  try {
    const { data, error } = await supabase
      .from('feedback_complaints')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching feedback:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return null
  }
}

// Update feedback
export async function updateFeedback(id: string, updates: UpdateFeedbackData): Promise<FeedbackComplaint | null> {
  try {
    const updateData: Partial<FeedbackComplaint> & { updated_at: string, resolved_at?: string } = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    if (updates.status === 'resolved' && !updates.satisfaction_score) {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('feedback_complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating feedback:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error updating feedback:', error)
    return null
  }
}

// Delete feedback
export async function deleteFeedback(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('feedback_complaints')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting feedback:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting feedback:', error)
    return false
  }
}

// Get feedback responses
export async function getFeedbackResponses(feedbackId: string): Promise<FeedbackResponse[]> {
  try {
    const { data, error } = await supabase
      .from('feedback_responses')
      .select(`
        *,
        app_users!responder_id (
          full_name
        )
      `)
      .eq('feedback_id', feedbackId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching feedback responses:', error)
      return []
    }

    return data?.map(response => ({
      ...response,
      responder_name: response.app_users?.full_name || 'Unknown User'
    })) || []
  } catch (error) {
    console.error('Error fetching feedback responses:', error)
    return []
  }
}

// Add feedback response
export async function addFeedbackResponse(
  feedbackId: string,
  responderId: string,
  message: string,
  responseType: 'internal_note' | 'customer_reply' | 'system_action' = 'internal_note'
): Promise<FeedbackResponse | null> {
  try {
    const { data, error } = await supabase
      .from('feedback_responses')
      .insert({
        feedback_id: feedbackId,
        responder_id: responderId,
        response_type: responseType,
        message,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding feedback response:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error adding feedback response:', error)
    return null
  }
}

// Get feedback KPIs
export async function getFeedbackKPIs(dateRange?: { from: string; to: string }): Promise<FeedbackKPIs> {
  try {
    let query = supabase.from('feedback_complaints').select('*')
    
    if (dateRange) {
      query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching feedback KPIs:', error)
      return {
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
      }
    }

    const feedbackItems = data || []
    const totalFeedback = feedbackItems.filter(item => item.type === 'feedback').length
    const totalComplaints = feedbackItems.filter(item => item.type === 'complaint').length
    const resolvedItems = feedbackItems.filter(item => item.status === 'resolved')
    const pendingItems = feedbackItems.filter(item => ['new', 'in_progress'].includes(item.status))
    const escalatedItems = feedbackItems.filter(item => item.status === 'escalated')

    const resolutionRate = feedbackItems.length > 0 ? (resolvedItems.length / feedbackItems.length) * 100 : 0
    
    const resolutionTimes = resolvedItems
      .filter(item => item.resolution_time_hours)
      .map(item => item.resolution_time_hours!)
    const averageResolutionTime = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
      : 0

    const satisfactionScores = feedbackItems
      .filter(item => item.satisfaction_score)
      .map(item => item.satisfaction_score!)
    const customerSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0

    return {
      total_feedback: totalFeedback,
      total_complaints: totalComplaints,
      resolution_rate: Math.round(resolutionRate * 10) / 10,
      average_resolution_time: Math.round(averageResolutionTime * 10) / 10,
      customer_satisfaction: Math.round(customerSatisfaction * 10) / 10,
      pending_count: pendingItems.length,
      escalated_count: escalatedItems.length,
      trends: {
        feedback_trend: 0, // TODO: Calculate trends
        resolution_trend: 0,
        satisfaction_trend: 0
      }
    }
  } catch (error) {
    console.error('Error calculating feedback KPIs:', error)
    return {
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
    }
  }
}

// Get mock data for development/testing
export function getMockFeedbackData(): FeedbackComplaint[] {
  return [
    {
      id: '1',
      type: 'complaint',
      status: 'new',
      priority: 'high',
      source: 'email',
      category: 'product_quality',
      subject: 'Defective product received',
      description: 'The phone case I ordered arrived with a crack in the corner. Very disappointed with the quality.',
      customer_name: 'John Smith',
      customer_email: 'john.smith@email.com',
      customer_phone: '+1234567890',
      order_id: 'ORD-2023-001',
      product_sku: 'CASE-001',
      rating: 2,
      sentiment: 'negative',
      tags: ['product-defect', 'quality-issue'],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_public: false
    },
    {
      id: '2',
      type: 'feedback',
      status: 'resolved',
      priority: 'low',
      source: 'website',
      category: 'customer_service',
      subject: 'Excellent customer service',
      description: 'Your support team was very helpful in resolving my shipping issue. Great experience!',
      customer_name: 'Sarah Johnson',
      customer_email: 'sarah.j@email.com',
      rating: 5,
      sentiment: 'positive',
      resolved_by: 'support-agent-1',
      resolution_notes: 'Customer was satisfied with our resolution',
      satisfaction_score: 9,
      tags: ['positive-feedback', 'customer-service'],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_public: true
    },
    {
      id: '3',
      type: 'suggestion',
      status: 'in_progress',
      priority: 'medium',
      source: 'phone',
      category: 'website',
      subject: 'Suggestion for mobile app',
      description: 'It would be great if you could add a dark mode option to your mobile app.',
      customer_name: 'Mike Davis',
      customer_email: 'mike.davis@email.com',
      assigned_to: 'dev-team-lead',
      tags: ['feature-request', 'mobile-app'],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      is_public: false
    },
    {
      id: '4',
      type: 'complaint',
      status: 'escalated',
      priority: 'urgent',
      source: 'social_media',
      category: 'delivery',
      subject: 'Package never arrived',
      description: 'I ordered a product 2 weeks ago and it still hasn\'t arrived. Tracking shows it was delivered but I never received it.',
      customer_name: 'Lisa Brown',
      customer_email: 'lisa.brown@email.com',
      customer_phone: '+1987654321',
      order_id: 'ORD-2023-002',
      rating: 1,
      sentiment: 'negative',
      escalated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['delivery-issue', 'missing-package', 'urgent'],
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      is_public: false
    },
    {
      id: '5',
      type: 'inquiry',
      status: 'resolved',
      priority: 'low',
      source: 'website',
      category: 'other',
      subject: 'Question about return policy',
      description: 'Can you please clarify your return policy for international orders?',
      customer_name: 'Tom Wilson',
      customer_email: 'tom.wilson@email.com',
      resolved_by: 'support-agent-2',
      resolution_notes: 'Provided detailed information about international return policy',
      satisfaction_score: 8,
      tags: ['policy-question', 'international'],
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_public: false
    }
  ]
}