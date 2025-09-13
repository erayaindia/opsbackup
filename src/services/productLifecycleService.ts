import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import { v4 as uuidv4 } from 'uuid'

// Database types
type Tables = Database['public']['Tables']
type ProductsTable = Tables['products']['Row']
type ProductsInsert = Tables['products']['Insert']
type ProductsUpdate = Tables['products']['Update']
type ProductIdeasTable = Tables['product_ideas']['Row']
type ProductIdeasInsert = Tables['product_ideas']['Insert']
type ProductCategoriesTable = Tables['product_categories']['Row']
type ProductTagsTable = Tables['product_tags']['Row']
type ProductReferenceLinksTable = Tables['product_reference_links']['Row']
type ProductMediaTable = Tables['product_media']['Row']
type ProductActivitiesTable = Tables['product_activities']['Row']

// Service types (compatible with existing UI)
export interface LifecycleProduct {
  id: string
  internalCode: string
  workingTitle: string
  name?: string
  thumbnail?: string | null
  thumbnailUrl?: string | null
  tags: string[]
  category: string[]
  owner?: { id: string; name: string; email: string }
  teamLead: { id: string; name: string; email: string }
  priority: 'low' | 'medium' | 'high'
  stage: 'idea' | 'production' | 'content' | 'scaling' | 'inventory'
  createdAt: Date
  updatedAt: Date
  idleDays: number
  potentialScore: number

  // Stage-specific data
  ideaData?: {
    notes?: string
    thumbnail?: string
    problemStatement?: string
    opportunityStatement?: string
    estimatedSourcePriceMin?: number
    estimatedSourcePriceMax?: number
    estimatedSellingPrice?: number
    selectedSupplierId?: string
    competitorLinks?: string[]
    adLinks?: string[]
  }

  activities: Array<{
    id: string
    action: string
    timestamp: Date
    actorName?: string
  }>
}

export interface CreateProductPayload {
  title: string
  tags?: string[]
  category?: string[]
  competitorLinks?: string[]
  adLinks?: string[]
  notes?: string
  thumbnail?: string
  problemStatement?: string
  opportunityStatement?: string
  estimatedSourcePriceMin?: string
  estimatedSourcePriceMax?: string
  estimatedSellingPrice?: string
  selectedSupplierId?: string
  priority: 'low' | 'medium' | 'high'
  stage: 'idea' | 'production' | 'content' | 'scaling' | 'inventory'
  assignedTo: string
}

export interface FilterOptions {
  stages?: string[]
  tags?: string[]
  categories?: string[]
  owners?: string[]
  teamLeads?: string[]
  priority?: string[]
  search?: string
}

class ProductLifecycleService {
  /**
   * Generate internal product code
   */
  private generateInternalCode(): string {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `PRD-${year}-${randomNum}`
  }

  /**
   * Calculate idle days since last update
   */
  private calculateIdleDays(updatedAt: string | Date): number {
    const updateDate = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - updateDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get user details by ID (handles missing users gracefully)
   */
  private async getUserById(userId: string): Promise<{ id: string; name: string; email: string }> {
    try {
      // First try app_users table
      const { data, error } = await supabase
        .from('app_users')
        .select('id, full_name, company_email')
        .eq('id', userId)
        .single()

      if (!error && data) {
        return {
          id: data.id,
          name: data.full_name || 'Unknown User',
          email: data.company_email || ''
        }
      }

      // If not found in app_users, try to get current user info if it's the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser && currentUser.id === userId) {
        return {
          id: userId,
          name: currentUser.user_metadata?.full_name || currentUser.email || 'Current User',
          email: currentUser.email || ''
        }
      }

      // Fallback for any user ID
      return {
        id: userId,
        name: 'User',
        email: ''
      }
    } catch (error) {
      console.warn('Error fetching user details:', error)
      return {
        id: userId,
        name: 'User',
        email: ''
      }
    }
  }

  /**
   * Fetch all products with related data
   */
  async listProducts(options?: {
    filters?: FilterOptions
    search?: string
    sort?: { field: string; direction: 'asc' | 'desc' }
  }): Promise<LifecycleProduct[]> {
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Authentication error in listProducts:', authError)
        throw new Error('Authentication failed')
      }

      if (!user) {
        console.warn('No authenticated user found in listProducts')
        return []
      }

      // Base query for products
      let query = supabase
        .from('products')
        .select(`
          *,
          product_ideas(*),
          product_categories(category),
          product_tags(tag),
          product_reference_links(*),
          product_activities(*)
        `)

      // Apply stage filter
      if (options?.filters?.stages?.length) {
        query = query.in('stage', options.filters.stages)
      }

      // Apply priority filter
      if (options?.filters?.priority?.length) {
        query = query.in('priority', options.filters.priority)
      }

      // Apply assigned to filter
      if (options?.filters?.teamLeads?.length) {
        query = query.in('assigned_to', options.filters.teamLeads)
      }

      // Apply search
      if (options?.search) {
        query = query.or(`working_title.ilike.%${options.search}%,name.ilike.%${options.search}%,internal_code.ilike.%${options.search}%`)
      }

      // Apply sorting
      if (options?.sort) {
        query = query.order(options.sort.field, { ascending: options.sort.direction === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data: products, error } = await query

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }

      if (!products) return []

      // Transform data to match UI expectations
      const transformedProducts: LifecycleProduct[] = []

      for (const product of products) {
        // Get user details
        const teamLead = product.assigned_to ? await this.getUserById(product.assigned_to) : null
        const owner = product.created_by ? await this.getUserById(product.created_by) : null

        // Extract categories and tags
        const categories = Array.isArray(product.product_categories)
          ? product.product_categories.map((cat: any) => cat.category)
          : []

        const tags = Array.isArray(product.product_tags)
          ? product.product_tags.map((tag: any) => tag.tag)
          : []

        // Get idea data
        const ideaData = Array.isArray(product.product_ideas) && product.product_ideas[0]
          ? {
              notes: product.product_ideas[0].notes,
              thumbnail: product.thumbnail_url,
              problemStatement: product.product_ideas[0].problem_statement,
              opportunityStatement: product.product_ideas[0].opportunity_statement,
              estimatedSourcePriceMin: product.product_ideas[0].estimated_source_price_min,
              estimatedSourcePriceMax: product.product_ideas[0].estimated_source_price_max,
              estimatedSellingPrice: product.product_ideas[0].estimated_selling_price,
              selectedSupplierId: product.product_ideas[0].selected_supplier_id,
            }
          : undefined

        // Get activities
        const activities = Array.isArray(product.product_activities)
          ? product.product_activities.map((activity: any) => ({
              id: activity.id,
              action: activity.action,
              timestamp: new Date(activity.timestamp),
              actorName: 'User' // TODO: Get actual actor name
            }))
          : []

        const lifecycleProduct: LifecycleProduct = {
          id: product.id,
          internalCode: product.internal_code || this.generateInternalCode(),
          workingTitle: product.working_title || product.name || 'Untitled Product',
          name: product.name,
          thumbnail: product.thumbnail_url,
          thumbnailUrl: product.thumbnail_url,
          tags,
          category: categories.length > 0 ? categories : ['General'],
          owner,
          teamLead: teamLead || { id: '', name: 'Unassigned', email: '' },
          priority: (product.priority as 'low' | 'medium' | 'high') || 'medium',
          stage: (product.stage as 'idea' | 'production' | 'content' | 'scaling' | 'inventory') || 'idea',
          createdAt: new Date(product.created_at),
          updatedAt: new Date(product.updated_at),
          idleDays: this.calculateIdleDays(product.updated_at),
          potentialScore: product.potential_score || 0,
          ideaData,
          activities
        }

        transformedProducts.push(lifecycleProduct)
      }

      return transformedProducts
    } catch (error) {
      console.error('Error in listProducts:', error)
      throw error
    }
  }

  /**
   * Simple validation that user ID exists (no database dependency)
   */
  private validateUserId(userId: string): boolean {
    return userId && typeof userId === 'string' && userId.length > 0
  }

  /**
   * Generate SKU for inventory
   */
  private generateSKU(productCode: string): string {
    const timestamp = Date.now().toString().slice(-4)
    return `SKU-${productCode.split('-')[2]}-${timestamp}`
  }

  /**
   * Create inventory records for a new product
   */
  private async createInventoryRecords(productId: string, productCode: string): Promise<void> {
    try {
      // Generate SKU
      const sku = this.generateSKU(productCode)

      // Get default warehouse (assume first warehouse, or create default if none exist)
      let { data: warehouses, error: warehouseError } = await supabase
        .from('warehouses')
        .select('id')
        .limit(1)

      if (warehouseError) {
        console.warn('Warehouses table may not exist:', warehouseError.message)
        return // Skip inventory creation if warehouses don't exist
      }

      if (!warehouses || warehouses.length === 0) {
        // Create a default warehouse
        const { data: newWarehouse, error: createWarehouseError } = await supabase
          .from('warehouses')
          .insert({
            name: 'Default Warehouse',
            location: 'Main Location',
            is_active: true
          })
          .select('id')
          .single()

        if (createWarehouseError) {
          console.warn('Could not create default warehouse:', createWarehouseError.message)
          return
        }
        warehouses = [newWarehouse]
      }

      const warehouseId = warehouses[0].id

      // Create inventory_details record (now includes all stock data)
      const inventoryDetails = {
        product_id: productId,
        sku: sku,
        barcode: null, // Can be set later
        attributes: {},
        cost: 0, // Default cost, can be updated later
        price: 0, // Default price, can be updated later
        weight: null,
        min_stock_level: 10, // Default reorder level
        reorder_point: 5,
        reorder_quantity: 50,
        status_id: 1, // Active status
        warehouse_id: warehouseId,
        on_hand_qty: 0,
        allocated_qty: 0,
        available_qty: 0,
        last_counted_date: new Date().toISOString(),
        last_movement_date: new Date().toISOString()
      }

      const { data: inventoryDetail, error: inventoryError } = await supabase
        .from('inventory_details')
        .insert(inventoryDetails)
        .select('id')
        .single()

      if (inventoryError) {
        console.warn('Could not create inventory details:', inventoryError.message)
        return
      }

      console.log(`✅ Created inventory records for product ${productId}:`, {
        sku,
        inventory_detail_id: inventoryDetail.id,
        warehouse_id: warehouseId
      })

    } catch (error) {
      console.warn('Error creating inventory records:', error)
      // Don't throw - inventory creation is optional and shouldn't block product creation
    }
  }

  /**
   * Create a new product
   */
  async createProduct(payload: CreateProductPayload): Promise<LifecycleProduct> {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Authentication error:', authError)
        throw new Error('Authentication failed')
      }

      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('Creating product for user:', user.id)

      // Validate user IDs
      if (!this.validateUserId(user.id)) {
        throw new Error('Invalid creator user ID')
      }

      const assignedTo = payload.assignedTo && this.validateUserId(payload.assignedTo)
        ? payload.assignedTo
        : user.id

      // Create the main product record
      const productInsert: ProductsInsert = {
        internal_code: this.generateInternalCode(),
        working_title: payload.title,
        name: payload.title,
        thumbnail_url: payload.thumbnail,
        priority: payload.priority,
        stage: payload.stage,
        created_by: user.id,
        assigned_to: assignedTo,
        potential_score: 50 // Default score
      }

      console.log('Creating product with data:', productInsert)

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productInsert)
        .select()
        .single()

      if (productError) {
        console.error('Error creating product:', productError)
        console.error('Insert data was:', productInsert)
        throw productError
      }

      console.log('Created product successfully:', product.id)

      // Create idea data if stage is 'idea'
      if (payload.stage === 'idea' && product) {
        const ideaInsert: ProductIdeasInsert = {
          product_id: product.id,
          notes: payload.notes,
          problem_statement: payload.problemStatement,
          opportunity_statement: payload.opportunityStatement,
          estimated_source_price_min: payload.estimatedSourcePriceMin ? parseFloat(payload.estimatedSourcePriceMin) : null,
          estimated_source_price_max: payload.estimatedSourcePriceMax ? parseFloat(payload.estimatedSourcePriceMax) : null,
          estimated_selling_price: payload.estimatedSellingPrice ? parseFloat(payload.estimatedSellingPrice) : null,
          selected_supplier_id: payload.selectedSupplierId
        }

        const { error: ideaError } = await supabase
          .from('product_ideas')
          .insert(ideaInsert)

        if (ideaError) {
          console.error('Error creating product idea:', ideaError)
        }
      }

      // Add categories
      if (payload.category && payload.category.length > 0) {
        const categoryInserts = payload.category.map(cat => ({
          product_id: product.id,
          category: cat
        }))

        const { error: catError } = await supabase
          .from('product_categories')
          .insert(categoryInserts)

        if (catError) {
          console.error('Error creating categories:', catError)
        }
      }

      // Add tags
      if (payload.tags && payload.tags.length > 0) {
        const tagInserts = payload.tags.map(tag => ({
          product_id: product.id,
          tag
        }))

        const { error: tagError } = await supabase
          .from('product_tags')
          .insert(tagInserts)

        if (tagError) {
          console.error('Error creating tags:', tagError)
        }
      }

      // Add reference links
      const referenceLinks = [
        ...(payload.competitorLinks?.map(url => ({ url, type: 'competitor' as const })) || []),
        ...(payload.adLinks?.map(url => ({ url, type: 'ad' as const })) || [])
      ]

      if (referenceLinks.length > 0) {
        const linkInserts = referenceLinks.map(link => ({
          product_id: product.id,
          url: link.url,
          link_type: link.type
        }))

        const { error: linkError } = await supabase
          .from('product_reference_links')
          .insert(linkInserts)

        if (linkError) {
          console.error('Error creating reference links:', linkError)
        }
      }

      // Add activity
      await supabase
        .from('product_activities')
        .insert({
          product_id: product.id,
          actor_user_id: user.id,
          action: 'Created product'
        })

      // Create inventory records for the new product
      await this.createInventoryRecords(product.id, product.internal_code)

      // Return the created product by fetching it with all relations
      const products = await this.listProducts()
      const createdProduct = products.find(p => p.id === product.id)

      if (!createdProduct) {
        throw new Error('Created product not found')
      }

      return createdProduct
    } catch (error) {
      console.error('Error in createProduct:', error)
      throw error
    }
  }

  /**
   * Update a product
   */
  async updateProduct(id: string, updates: Partial<CreateProductPayload>): Promise<LifecycleProduct> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Update main product record
      const productUpdate: ProductsUpdate = {}

      if (updates.title) {
        productUpdate.working_title = updates.title
        productUpdate.name = updates.title
      }

      if (updates.thumbnail) productUpdate.thumbnail_url = updates.thumbnail
      if (updates.priority) productUpdate.priority = updates.priority
      if (updates.stage) productUpdate.stage = updates.stage
      if (updates.assignedTo) productUpdate.assigned_to = updates.assignedTo

      if (Object.keys(productUpdate).length > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productUpdate)
          .eq('id', id)

        if (updateError) {
          console.error('Error updating product:', updateError)
          throw updateError
        }
      }

      // Update idea data if provided
      if (updates.notes || updates.problemStatement || updates.opportunityStatement ||
          updates.estimatedSourcePriceMin || updates.estimatedSourcePriceMax ||
          updates.estimatedSellingPrice || updates.selectedSupplierId) {

        const ideaUpdate: Partial<ProductIdeasInsert> = {}
        if (updates.notes) ideaUpdate.notes = updates.notes
        if (updates.problemStatement) ideaUpdate.problem_statement = updates.problemStatement
        if (updates.opportunityStatement) ideaUpdate.opportunity_statement = updates.opportunityStatement
        if (updates.estimatedSourcePriceMin) ideaUpdate.estimated_source_price_min = parseFloat(updates.estimatedSourcePriceMin)
        if (updates.estimatedSourcePriceMax) ideaUpdate.estimated_source_price_max = parseFloat(updates.estimatedSourcePriceMax)
        if (updates.estimatedSellingPrice) ideaUpdate.estimated_selling_price = parseFloat(updates.estimatedSellingPrice)
        if (updates.selectedSupplierId) ideaUpdate.selected_supplier_id = updates.selectedSupplierId

        // Try to update existing idea record, or create new one
        const { error: ideaUpdateError } = await supabase
          .from('product_ideas')
          .upsert({ product_id: id, ...ideaUpdate })

        if (ideaUpdateError) {
          console.error('Error updating product idea:', ideaUpdateError)
        }
      }

      // Add update activity
      await supabase
        .from('product_activities')
        .insert({
          product_id: id,
          actor_user_id: user.id,
          action: 'Updated product'
        })

      // Return updated product
      const products = await this.listProducts()
      const updatedProduct = products.find(p => p.id === id)

      if (!updatedProduct) {
        throw new Error('Updated product not found')
      }

      return updatedProduct
    } catch (error) {
      console.error('Error in updateProduct:', error)
      throw error
    }
  }

  /**
   * Delete a product and all related data
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('Starting product deletion for ID:', id)

      // Note: With CASCADE DELETE constraints properly set up,
      // stock_movements will be automatically deleted when inventory_details are deleted,
      // inventory_details will be automatically deleted when the main product is deleted.
      // We only need to delete the lifecycle-specific data manually.

      // Now delete from other tables that we know exist
      const deleteTasks = [
        // Delete product ideas
        supabase.from('product_ideas').delete().eq('product_id', id),

        // Delete product categories
        supabase.from('product_categories').delete().eq('product_id', id),

        // Delete product tags
        supabase.from('product_tags').delete().eq('product_id', id),

        // Delete product reference links
        supabase.from('product_reference_links').delete().eq('product_id', id),

        // Delete product activities
        supabase.from('product_activities').delete().eq('product_id', id),

        // Delete inventory details (will cascade to stock_movements)
        supabase.from('inventory_details').delete().eq('product_id', id)
      ]

      // Execute all delete operations for related data
      console.log('Deleting related product data...')
      const results = await Promise.allSettled(deleteTasks)

      // Log any errors from related data deletion (but don't fail)
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const error = result.reason
          // Only log if it's not a "table not found" error (404/PGRST116)
          if (error?.code !== 'PGRST116' && !error?.message?.includes('404')) {
            console.warn(`Failed to delete related data at index ${index}:`, result.reason)
          }
        }
      })

      // Now delete from the main products table
      console.log('Deleting main product record...')
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (productError) {
        console.error('Error deleting main product record:', productError)
        throw productError
      }

      // Clean up product images from storage (if any)
      try {
        console.log('Cleaning up product images from storage...')
        const { data: files } = await supabase.storage
          .from('product-images')
          .list('products', { search: id })

        if (files && files.length > 0) {
          const filePaths = files.map(file => `products/${file.name}`)
          await supabase.storage
            .from('product-images')
            .remove(filePaths)
          console.log(`Deleted ${files.length} images from storage`)
        }
      } catch (storageError) {
        console.warn('Error cleaning up storage files:', storageError)
        // Don't throw - storage cleanup is not critical
      }

      console.log('Product deletion completed successfully')
    } catch (error) {
      console.error('Error in deleteProduct:', error)
      throw error
    }
  }

  /**
   * Upload product image to storage
   */
  async uploadProductImage(file: File, productId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error in uploadProductImage:', error)
      throw error
    }
  }
}

export const productLifecycleService = new ProductLifecycleService()