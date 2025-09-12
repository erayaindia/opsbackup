export type FeedbackType = 'feedback' | 'complaint' | 'suggestion' | 'inquiry'
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'escalated'
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'urgent'
export type FeedbackSource = 'website' | 'email' | 'phone' | 'social_media' | 'in_store' | 'other'
export type FeedbackCategory = 'product_quality' | 'delivery' | 'customer_service' | 'pricing' | 'website' | 'packaging' | 'other'
export type FeedbackSentiment = 'positive' | 'neutral' | 'negative' | 'mixed'
export type ResponseType = 'internal_note' | 'customer_reply' | 'system_action'

export interface FeedbackAttachment {
  id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

export interface FeedbackComplaint {
  id: string
  type: FeedbackType
  status: FeedbackStatus
  priority: FeedbackPriority
  source: FeedbackSource
  category: FeedbackCategory
  subject: string
  description: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  order_id?: string
  product_sku?: string
  rating?: number // 1-5
  sentiment?: FeedbackSentiment
  assigned_to?: string
  resolved_by?: string
  resolution_notes?: string
  resolution_time_hours?: number
  tags?: string[]
  attachments?: FeedbackAttachment[]
  created_at: string
  updated_at: string
  resolved_at?: string
  escalated_at?: string
  follow_up_date?: string
  is_public: boolean
  satisfaction_score?: number // 1-10, post-resolution
}

export interface FeedbackResponse {
  id: string
  feedback_id: string
  responder_id: string
  responder_name: string
  response_type: ResponseType
  message: string
  attachments?: FeedbackAttachment[]
  created_at: string
}

export interface FeedbackTemplate {
  id: string
  name: string
  category: string
  template_text: string
  placeholders: Record<string, string>
  is_active: boolean
}

export interface FeedbackKPIs {
  total_feedback: number
  total_complaints: number
  resolution_rate: number
  average_resolution_time: number
  customer_satisfaction: number
  pending_count: number
  escalated_count: number
  trends: {
    feedback_trend: number
    resolution_trend: number
    satisfaction_trend: number
  }
}

export interface FeedbackFilters {
  search?: string
  type?: FeedbackType | 'all'
  status?: FeedbackStatus | 'all'
  priority?: FeedbackPriority | 'all'
  category?: FeedbackCategory | 'all'
  source?: FeedbackSource | 'all'
  assigned_to?: string | 'all'
  date_from?: string
  date_to?: string
  rating?: number | 'all'
  has_order?: boolean
}

export interface CreateFeedbackData {
  type: FeedbackType
  priority: FeedbackPriority
  source: FeedbackSource
  category: FeedbackCategory
  subject: string
  description: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  order_id?: string
  product_sku?: string
  rating?: number
  tags?: string[]
  is_public?: boolean
}

export interface UpdateFeedbackData {
  status?: FeedbackStatus
  priority?: FeedbackPriority
  assigned_to?: string
  resolution_notes?: string
  tags?: string[]
  follow_up_date?: string
  satisfaction_score?: number
}

export interface FeedbackAnalytics {
  feedback_by_type: { type: FeedbackType; count: number }[]
  feedback_by_category: { category: FeedbackCategory; count: number }[]
  feedback_by_status: { status: FeedbackStatus; count: number }[]
  feedback_by_source: { source: FeedbackSource; count: number }[]
  resolution_time_trend: { date: string; avg_hours: number }[]
  satisfaction_trend: { date: string; avg_score: number }[]
  sentiment_distribution: { sentiment: FeedbackSentiment; count: number }[]
  monthly_volume: { month: string; feedback_count: number; complaint_count: number }[]
}