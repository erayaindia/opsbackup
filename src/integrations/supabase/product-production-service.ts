import { supabase } from './client'

export interface Supplier {
  id: string
  name: string
  pricing?: string
  quality?: string
  contact?: string
  url?: string
}

export interface ProductLink {
  id: string
  url: string
  title: string
  type: 'reference' | 'competitor' | 'inspiration' | 'documentation' | 'other'
}

export interface ProductProduction {
  id: string
  product_id: string
  // Supplier & Pricing fields
  selected_suppliers?: Supplier[]
  supplier_comparison_notes?: string
  preferred_supplier_id?: string
  // Product Links fields
  product_links?: ProductLink[]
  // Sample Management fields
  sample_request_date?: string
  sample_received_date?: string
  sample_status?: string
  sample_notes?: string
  sample_quality_rating?: number
  // Production Timeline fields
  production_start_date?: string
  production_completion_date?: string
  production_milestones?: string
  production_status?: string
  // Materials & Specifications fields
  dimensions?: string
  weight?: string
  materials_specification?: string
  // Manufacturing details
  manufacturing_method?: string
  quality_standards?: string
  compliance_requirements?: string
  // Cost tracking
  estimated_unit_cost?: number
  actual_unit_cost?: number
  tooling_cost?: number
  setup_cost?: number
  // Quality control
  qc_requirements?: string
  qc_status?: string
  qc_notes?: string
  // Lead times
  lead_time_days?: number
  minimum_order_quantity?: number
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateProductProductionData {
  product_id: string
  selected_suppliers?: Supplier[]
  supplier_comparison_notes?: string
  preferred_supplier_id?: string
  product_links?: ProductLink[]
  sample_request_date?: string
  sample_received_date?: string
  sample_status?: string
  sample_notes?: string
  sample_quality_rating?: number
  production_start_date?: string
  production_completion_date?: string
  production_milestones?: string
  production_status?: string
  dimensions?: string
  weight?: string
  materials_specification?: string
  manufacturing_method?: string
  quality_standards?: string
  compliance_requirements?: string
  estimated_unit_cost?: number
  actual_unit_cost?: number
  tooling_cost?: number
  setup_cost?: number
  qc_requirements?: string
  qc_status?: string
  qc_notes?: string
  lead_time_days?: number
  minimum_order_quantity?: number
}

export interface UpdateProductProductionData extends Partial<CreateProductProductionData> {
  id: string
}

class ProductProductionService {
  // Get or create product production data
  async getOrCreateProductProduction(productId: string): Promise<ProductProduction | null> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_product_production', {
        p_product_id: productId
      })

      if (error) {
        console.error('Error getting/creating product production:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getOrCreateProductProduction:', error)
      return null
    }
  }

  // Get product production by product ID
  async getProductProduction(productId: string): Promise<ProductProduction | null> {
    try {
      const { data, error } = await supabase
        .from('product_production')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching product production:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProductProduction:', error)
      return null
    }
  }

  // Create new product production
  async createProductProduction(productionData: CreateProductProductionData): Promise<ProductProduction | null> {
    try {
      const { data, error } = await supabase
        .from('product_production')
        .insert([productionData])
        .select()
        .single()

      if (error) {
        console.error('Error creating product production:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createProductProduction:', error)
      return null
    }
  }

  // Update product production
  async updateProductProduction(productionData: UpdateProductProductionData): Promise<ProductProduction | null> {
    try {
      const { id, ...updateData } = productionData

      const { data, error } = await supabase
        .from('product_production')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating product production:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateProductProduction:', error)
      return null
    }
  }

  // Update product production by product ID
  async updateProductProductionByProductId(productId: string, updateData: Partial<CreateProductProductionData>): Promise<ProductProduction | null> {
    try {
      const { data, error } = await supabase
        .from('product_production')
        .update(updateData)
        .eq('product_id', productId)
        .select()
        .single()

      if (error) {
        console.error('Error updating product production by product ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateProductProductionByProductId:', error)
      return null
    }
  }

  // Delete product production
  async deleteProductProduction(productionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_production')
        .delete()
        .eq('id', productionId)

      if (error) {
        console.error('Error deleting product production:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteProductProduction:', error)
      return false
    }
  }

  // Add supplier using RPC function
  async addSupplier(productId: string, supplierData: Supplier): Promise<ProductProduction | null> {
    try {
      const { data, error } = await supabase.rpc('add_supplier_to_product', {
        p_product_id: productId,
        p_supplier_data: supplierData
      })

      if (error) {
        console.error('Error adding supplier:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in addSupplier:', error)
      return null
    }
  }

  // Remove supplier
  async removeSupplier(productId: string, supplierId: string): Promise<ProductProduction | null> {
    try {
      const currentProduction = await this.getProductProduction(productId)
      if (!currentProduction) return null

      const currentSuppliers = currentProduction.selected_suppliers || []
      const filteredSuppliers = currentSuppliers.filter((supplier: Supplier) => supplier.id !== supplierId)

      return this.updateProductProductionByProductId(productId, { selected_suppliers: filteredSuppliers })
    } catch (error) {
      console.error('Error in removeSupplier:', error)
      return null
    }
  }

  // Update supplier
  async updateSupplier(productId: string, supplierId: string, updateData: Partial<Supplier>): Promise<ProductProduction | null> {
    try {
      const currentProduction = await this.getProductProduction(productId)
      if (!currentProduction) return null

      const currentSuppliers = currentProduction.selected_suppliers || []
      const updatedSuppliers = currentSuppliers.map((supplier: Supplier) =>
        supplier.id === supplierId ? { ...supplier, ...updateData } : supplier
      )

      return this.updateProductProductionByProductId(productId, { selected_suppliers: updatedSuppliers })
    } catch (error) {
      console.error('Error in updateSupplier:', error)
      return null
    }
  }

  // Add product link using RPC function
  async addProductLink(productId: string, linkData: ProductLink): Promise<ProductProduction | null> {
    try {
      const { data, error } = await supabase.rpc('add_product_link', {
        p_product_id: productId,
        p_link_data: linkData
      })

      if (error) {
        console.error('Error adding product link:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in addProductLink:', error)
      return null
    }
  }

  // Remove product link
  async removeProductLink(productId: string, linkId: string): Promise<ProductProduction | null> {
    try {
      const currentProduction = await this.getProductProduction(productId)
      if (!currentProduction) return null

      const currentLinks = currentProduction.product_links || []
      const filteredLinks = currentLinks.filter((link: ProductLink) => link.id !== linkId)

      return this.updateProductProductionByProductId(productId, { product_links: filteredLinks })
    } catch (error) {
      console.error('Error in removeProductLink:', error)
      return null
    }
  }

  // Update product link
  async updateProductLink(productId: string, linkId: string, updateData: Partial<ProductLink>): Promise<ProductProduction | null> {
    try {
      const currentProduction = await this.getProductProduction(productId)
      if (!currentProduction) return null

      const currentLinks = currentProduction.product_links || []
      const updatedLinks = currentLinks.map((link: ProductLink) =>
        link.id === linkId ? { ...link, ...updateData } : link
      )

      return this.updateProductProductionByProductId(productId, { product_links: updatedLinks })
    } catch (error) {
      console.error('Error in updateProductLink:', error)
      return null
    }
  }

  // Upload production file to storage
  async uploadProductionFile(file: File, path: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${path}/${fileName}`

      const { data, error } = await supabase.storage
        .from('product-production')
        .upload(filePath, file)

      if (error) {
        console.error('Error uploading production file:', error)
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-production')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Error in uploadProductionFile:', error)
      return null
    }
  }

  // Delete production file from storage
  async deleteProductionFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('product-production')
        .remove([filePath])

      if (error) {
        console.error('Error deleting production file:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteProductionFile:', error)
      return false
    }
  }

  // Update sample status
  async updateSampleStatus(productId: string, status: string, notes?: string): Promise<ProductProduction | null> {
    try {
      const updateData: any = { sample_status: status }
      if (notes) updateData.sample_notes = notes

      return this.updateProductProductionByProductId(productId, updateData)
    } catch (error) {
      console.error('Error in updateSampleStatus:', error)
      return null
    }
  }

  // Update production status
  async updateProductionStatus(productId: string, status: string): Promise<ProductProduction | null> {
    try {
      return this.updateProductProductionByProductId(productId, { production_status: status })
    } catch (error) {
      console.error('Error in updateProductionStatus:', error)
      return null
    }
  }
}

export const productProductionService = new ProductProductionService()