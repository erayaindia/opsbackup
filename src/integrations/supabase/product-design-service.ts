import { supabase } from './client'

export interface ProductDesign {
  id: string
  product_id: string
  // Design Brief fields
  product_vision?: string
  target_audience?: string
  design_style?: string
  // Visual Identity fields
  primary_colors?: string
  secondary_colors?: string
  material_preferences?: string
  // Design Assets fields
  mood_board_url?: string
  design_files_url?: string
  technical_drawings?: string
  cad_files?: string
  // Design Progress fields
  design_status?: string
  current_phase?: string
  completion_percentage?: number
  next_milestone?: string
  // Design Feedback fields
  design_feedback?: string
  // Packing Design fields
  packaging_concept?: string
  packaging_approval_status?: string
  packaging_approval_date?: string
  // Design Ideas Repository
  design_ideas?: any[]
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateProductDesignData {
  product_id: string
  product_vision?: string
  target_audience?: string
  design_style?: string
  primary_colors?: string
  secondary_colors?: string
  material_preferences?: string
  mood_board_url?: string
  design_files_url?: string
  technical_drawings?: string
  cad_files?: string
  design_status?: string
  current_phase?: string
  completion_percentage?: number
  next_milestone?: string
  design_feedback?: string
  packaging_concept?: string
  packaging_approval_status?: string
  packaging_approval_date?: string
  design_ideas?: any[]
}

export interface UpdateProductDesignData extends Partial<CreateProductDesignData> {
  id: string
}

class ProductDesignService {
  // Get or create product design data
  async getOrCreateProductDesign(productId: string): Promise<ProductDesign | null> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_product_design', {
        p_product_id: productId
      })

      if (error) {
        console.error('Error getting/creating product design:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getOrCreateProductDesign:', error)
      return null
    }
  }

  // Get product design by product ID
  async getProductDesign(productId: string): Promise<ProductDesign | null> {
    try {
      const { data, error } = await supabase
        .from('product_design')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching product design:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProductDesign:', error)
      return null
    }
  }

  // Create new product design
  async createProductDesign(designData: CreateProductDesignData): Promise<ProductDesign | null> {
    try {
      // Sanitize the data to handle empty string dates
      const sanitizedData = { ...designData }

      // Convert empty string dates to null for timestamp fields
      if ('packaging_approval_date' in sanitizedData && sanitizedData.packaging_approval_date === '') {
        sanitizedData.packaging_approval_date = null as any
      }

      const { data, error } = await supabase
        .from('product_design')
        .insert([sanitizedData])
        .select()
        .single()

      if (error) {
        console.error('Error creating product design:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createProductDesign:', error)
      return null
    }
  }

  // Update product design
  async updateProductDesign(designData: UpdateProductDesignData): Promise<ProductDesign | null> {
    try {
      const { id, ...updateData } = designData

      // Sanitize the update data to handle empty string dates
      const sanitizedData = { ...updateData }

      // Convert empty string dates to null for timestamp fields
      if ('packaging_approval_date' in sanitizedData && sanitizedData.packaging_approval_date === '') {
        sanitizedData.packaging_approval_date = null as any
      }

      const { data, error } = await supabase
        .from('product_design')
        .update(sanitizedData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating product design:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateProductDesign:', error)
      return null
    }
  }

  // Update product design by product ID
  async updateProductDesignByProductId(productId: string, updateData: Partial<CreateProductDesignData>): Promise<ProductDesign | null> {
    try {
      // Sanitize the update data to handle empty string dates
      const sanitizedData = { ...updateData }

      // Convert empty string dates to null for timestamp fields
      if ('packaging_approval_date' in sanitizedData && sanitizedData.packaging_approval_date === '') {
        sanitizedData.packaging_approval_date = null as any
      }

      const { data, error } = await supabase
        .from('product_design')
        .update(sanitizedData)
        .eq('product_id', productId)
        .select()
        .single()

      if (error) {
        console.error('Error updating product design by product ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateProductDesignByProductId:', error)
      return null
    }
  }

  // Delete product design
  async deleteProductDesign(designId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_design')
        .delete()
        .eq('id', designId)

      if (error) {
        console.error('Error deleting product design:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteProductDesign:', error)
      return false
    }
  }

  // Upload design file to storage
  async uploadDesignFile(file: File, path: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${path}/${fileName}`

      const { data, error } = await supabase.storage
        .from('product-design')
        .upload(filePath, file)

      if (error) {
        console.error('Error uploading design file:', error)
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-design')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Error in uploadDesignFile:', error)
      return null
    }
  }

  // Delete design file from storage
  async deleteDesignFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('product-design')
        .remove([filePath])

      if (error) {
        console.error('Error deleting design file:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteDesignFile:', error)
      return false
    }
  }

  // Add design idea
  async addDesignIdea(productId: string, idea: any): Promise<ProductDesign | null> {
    try {
      // Get current design data
      const currentDesign = await this.getOrCreateProductDesign(productId)
      if (!currentDesign) return null

      const currentIdeas = currentDesign.design_ideas || []
      const newIdeas = [...currentIdeas, { ...idea, id: Math.random().toString(36).substr(2, 9) }]

      return this.updateProductDesignByProductId(productId, { design_ideas: newIdeas })
    } catch (error) {
      console.error('Error in addDesignIdea:', error)
      return null
    }
  }

  // Remove design idea
  async removeDesignIdea(productId: string, ideaId: string): Promise<ProductDesign | null> {
    try {
      const currentDesign = await this.getProductDesign(productId)
      if (!currentDesign) return null

      const currentIdeas = currentDesign.design_ideas || []
      const filteredIdeas = currentIdeas.filter((idea: any) => idea.id !== ideaId)

      return this.updateProductDesignByProductId(productId, { design_ideas: filteredIdeas })
    } catch (error) {
      console.error('Error in removeDesignIdea:', error)
      return null
    }
  }

  // Update design idea
  async updateDesignIdea(productId: string, ideaId: string, updateData: any): Promise<ProductDesign | null> {
    try {
      const currentDesign = await this.getProductDesign(productId)
      if (!currentDesign) return null

      const currentIdeas = currentDesign.design_ideas || []
      const updatedIdeas = currentIdeas.map((idea: any) =>
        idea.id === ideaId ? { ...idea, ...updateData } : idea
      )

      return this.updateProductDesignByProductId(productId, { design_ideas: updatedIdeas })
    } catch (error) {
      console.error('Error in updateDesignIdea:', error)
      return null
    }
  }
}

export const productDesignService = new ProductDesignService()