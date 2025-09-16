import { supabase } from './client'

export interface ProductScaling {
  id: string
  product_id: string
  // Launch Details fields
  launch_date?: string
  marketing_channels?: string[]
  launch_status?: string
  launch_notes?: string
  // Budget Allocation fields
  total_budget?: number
  facebook_budget?: number
  instagram_budget?: number
  google_budget?: number
  youtube_budget?: number
  other_budget?: number
  budget_period?: string
  budget_start_date?: string
  budget_end_date?: string
  // Performance Targets fields
  target_revenue?: number
  actual_revenue?: number
  target_roas?: number
  actual_roas?: number
  target_conversions?: number
  actual_conversions?: number
  target_cpc?: number
  actual_cpc?: number
  target_ctr?: number
  actual_ctr?: number
  // Additional Performance Metrics
  target_cpa?: number
  actual_cpa?: number
  target_aov?: number
  actual_aov?: number
  target_ltv?: number
  actual_ltv?: number
  // Campaign Data
  campaign_duration_days?: number
  campaign_status?: string
  ad_spend_total?: number
  impressions_total?: number
  clicks_total?: number
  orders_total?: number
  // Learnings & Insights fields
  learnings_insights?: string
  campaign_notes?: string
  optimization_notes?: string
  recommendations?: string
  // Scaling Strategy
  scaling_stage?: string
  next_scaling_action?: string
  scaling_constraints?: string
  // Market Analysis
  market_size_estimate?: number
  market_penetration_percent?: number
  competitive_advantage?: string
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateProductScalingData {
  product_id: string
  launch_date?: string
  marketing_channels?: string[]
  launch_status?: string
  launch_notes?: string
  total_budget?: number
  facebook_budget?: number
  instagram_budget?: number
  google_budget?: number
  youtube_budget?: number
  other_budget?: number
  budget_period?: string
  budget_start_date?: string
  budget_end_date?: string
  target_revenue?: number
  actual_revenue?: number
  target_roas?: number
  actual_roas?: number
  target_conversions?: number
  actual_conversions?: number
  target_cpc?: number
  actual_cpc?: number
  target_ctr?: number
  actual_ctr?: number
  target_cpa?: number
  actual_cpa?: number
  target_aov?: number
  actual_aov?: number
  target_ltv?: number
  actual_ltv?: number
  campaign_duration_days?: number
  campaign_status?: string
  ad_spend_total?: number
  impressions_total?: number
  clicks_total?: number
  orders_total?: number
  learnings_insights?: string
  campaign_notes?: string
  optimization_notes?: string
  recommendations?: string
  scaling_stage?: string
  next_scaling_action?: string
  scaling_constraints?: string
  market_size_estimate?: number
  market_penetration_percent?: number
  competitive_advantage?: string
}

export interface UpdateProductScalingData extends Partial<CreateProductScalingData> {
  id: string
}

export interface PerformanceMetrics {
  roas_performance: number | null
  budget_utilization_percent: number | null
  conversion_rate: number | null
  cpc_performance: number | null
}

class ProductScalingService {
  // Get or create product scaling data
  async getOrCreateProductScaling(productId: string): Promise<ProductScaling | null> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_product_scaling', {
        p_product_id: productId
      })

      if (error) {
        console.error('Error getting/creating product scaling:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getOrCreateProductScaling:', error)
      return null
    }
  }

  // Get product scaling by product ID
  async getProductScaling(productId: string): Promise<ProductScaling | null> {
    try {
      const { data, error } = await supabase
        .from('product_scaling')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching product scaling:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProductScaling:', error)
      return null
    }
  }

  // Create new product scaling
  async createProductScaling(scalingData: CreateProductScalingData): Promise<ProductScaling | null> {
    try {
      const { data, error } = await supabase
        .from('product_scaling')
        .insert([scalingData])
        .select()
        .single()

      if (error) {
        console.error('Error creating product scaling:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createProductScaling:', error)
      return null
    }
  }

  // Update product scaling
  async updateProductScaling(scalingData: UpdateProductScalingData): Promise<ProductScaling | null> {
    try {
      const { id, ...updateData } = scalingData

      const { data, error } = await supabase
        .from('product_scaling')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating product scaling:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateProductScaling:', error)
      return null
    }
  }

  // Update product scaling by product ID
  async updateProductScalingByProductId(productId: string, updateData: Partial<CreateProductScalingData>): Promise<ProductScaling | null> {
    try {
      const { data, error } = await supabase
        .from('product_scaling')
        .update(updateData)
        .eq('product_id', productId)
        .select()
        .single()

      if (error) {
        console.error('Error updating product scaling by product ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateProductScalingByProductId:', error)
      return null
    }
  }

  // Delete product scaling
  async deleteProductScaling(scalingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_scaling')
        .delete()
        .eq('id', scalingId)

      if (error) {
        console.error('Error deleting product scaling:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteProductScaling:', error)
      return false
    }
  }

  // Add marketing channel using RPC function
  async addMarketingChannel(productId: string, channel: string): Promise<ProductScaling | null> {
    try {
      const { data, error } = await supabase.rpc('add_marketing_channel', {
        p_product_id: productId,
        p_channel: channel
      })

      if (error) {
        console.error('Error adding marketing channel:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in addMarketingChannel:', error)
      return null
    }
  }

  // Remove marketing channel using RPC function
  async removeMarketingChannel(productId: string, channel: string): Promise<ProductScaling | null> {
    try {
      const { data, error } = await supabase.rpc('remove_marketing_channel', {
        p_product_id: productId,
        p_channel: channel
      })

      if (error) {
        console.error('Error removing marketing channel:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in removeMarketingChannel:', error)
      return null
    }
  }

  // Calculate performance metrics using RPC function
  async calculatePerformanceMetrics(productId: string): Promise<PerformanceMetrics | null> {
    try {
      const { data, error } = await supabase.rpc('calculate_performance_metrics', {
        p_product_id: productId
      })

      if (error) {
        console.error('Error calculating performance metrics:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error in calculatePerformanceMetrics:', error)
      return null
    }
  }

  // Upload scaling file to storage
  async uploadScalingFile(file: File, path: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${path}/${fileName}`

      const { data, error } = await supabase.storage
        .from('product-scaling')
        .upload(filePath, file)

      if (error) {
        console.error('Error uploading scaling file:', error)
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-scaling')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Error in uploadScalingFile:', error)
      return null
    }
  }

  // Delete scaling file from storage
  async deleteScalingFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('product-scaling')
        .remove([filePath])

      if (error) {
        console.error('Error deleting scaling file:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteScalingFile:', error)
      return false
    }
  }

  // Update launch status
  async updateLaunchStatus(productId: string, status: string): Promise<ProductScaling | null> {
    try {
      return this.updateProductScalingByProductId(productId, { launch_status: status })
    } catch (error) {
      console.error('Error in updateLaunchStatus:', error)
      return null
    }
  }

  // Update campaign status
  async updateCampaignStatus(productId: string, status: string): Promise<ProductScaling | null> {
    try {
      return this.updateProductScalingByProductId(productId, { campaign_status: status })
    } catch (error) {
      console.error('Error in updateCampaignStatus:', error)
      return null
    }
  }

  // Update scaling stage
  async updateScalingStage(productId: string, stage: string): Promise<ProductScaling | null> {
    try {
      return this.updateProductScalingByProductId(productId, { scaling_stage: stage })
    } catch (error) {
      console.error('Error in updateScalingStage:', error)
      return null
    }
  }

  // Bulk update performance data
  async updatePerformanceData(productId: string, performanceData: {
    actual_revenue?: number
    actual_roas?: number
    actual_conversions?: number
    actual_cpc?: number
    actual_ctr?: number
    actual_cpa?: number
    actual_aov?: number
    actual_ltv?: number
    ad_spend_total?: number
    impressions_total?: number
    clicks_total?: number
    orders_total?: number
  }): Promise<ProductScaling | null> {
    try {
      return this.updateProductScalingByProductId(productId, performanceData)
    } catch (error) {
      console.error('Error in updatePerformanceData:', error)
      return null
    }
  }
}

export const productScalingService = new ProductScalingService()