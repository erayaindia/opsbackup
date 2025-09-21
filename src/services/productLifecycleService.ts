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
// type ProductActivitiesTable = Tables['product_activities']['Row'] // Table dropped during consolidation

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
  thumbnail?: string | File | null
  problemStatement?: string
  opportunityStatement?: string
  estimatedSourcePriceMin?: string
  estimatedSourcePriceMax?: string
  estimatedSellingPrice?: string
  selectedSupplierId?: string
  priority: 'low' | 'medium' | 'high'
  stage: 'idea' | 'production' | 'content' | 'scaling' | 'inventory'
  assignedTo: string
  // File uploads
  uploadedImages?: File[]
  uploadedVideos?: File[]
}

export interface FilterOptions {
  stages?: string[]
  tags?: string[]
  categories?: string[]
  owners?: string[]
  teamLeads?: string[]
  priority?: string[]
  search?: string
  potentialScoreMin?: number
  potentialScoreMax?: number
  idleDaysMin?: number
  internalCodePattern?: string
  createdDateRange?: { start: Date; end: Date }
  updatedDateRange?: { start: Date; end: Date }
  marginRange?: { min: number; max: number }
  vendorLocations?: string[]
}

export interface PaginationOptions {
  limit?: number
  offset?: number
  page?: number
}

export interface ProductListResponse {
  items: LifecycleProduct[]
  total: number
  hasMore: boolean
  page?: number
  totalPages?: number
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
   * Fetch products with pagination, filtering, and related data - optimized for performance
   */
  async listProducts(options?: {
    filters?: FilterOptions
    search?: string
    stage?: string
    sort?: { field: string; direction: 'asc' | 'desc' }
    limit?: number
    offset?: number
    pagination?: PaginationOptions
  }): Promise<LifecycleProduct[] | ProductListResponse> {
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

      // Determine if we need pagination
      const usePagination = options?.limit !== undefined || options?.offset !== undefined || options?.pagination
      const limit = options?.limit || options?.pagination?.limit || 20
      const offset = options?.offset || options?.pagination?.offset || ((options?.pagination?.page || 1) - 1) * limit

      // Base query for products - now uses consolidated table structure
      let query = supabase
        .from('products')
        .select('*', { count: usePagination ? 'exact' : undefined })

      // Apply stage filter - check both direct stage param and filters.stages
      if (options?.stage && options.stage !== 'all') {
        query = query.eq('stage', options.stage)
      } else if (options?.filters?.stages?.length) {
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

      // Apply search - check both direct search param and filters.search
      const searchTerm = options?.search || options?.filters?.search
      if (searchTerm && searchTerm.trim()) {
        const searchQuery = searchTerm.trim()
        // Search in working_title, name, internal_code, and JSON fields (tags, categories)
        query = query.or(`working_title.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,internal_code.ilike.%${searchQuery}%,tags.ilike.%${searchQuery}%,categories.ilike.%${searchQuery}%`)
      }

      // Apply additional filters
      if (options?.filters?.categories?.length) {
        // For JSON array fields, we need to use overlap operator
        const categoriesFilter = options.filters.categories.map(cat => `"${cat}"`).join(',')
        query = query.filter('categories', 'cs', `[${categoriesFilter}]`)
      }

      if (options?.filters?.tags?.length) {
        const tagsFilter = options.filters.tags.map(tag => `"${tag}"`).join(',')
        query = query.filter('tags', 'cs', `[${tagsFilter}]`)
      }

      if (options?.filters?.potentialScoreMin !== undefined) {
        query = query.gte('potential_score', options.filters.potentialScoreMin)
      }

      if (options?.filters?.potentialScoreMax !== undefined) {
        query = query.lte('potential_score', options.filters.potentialScoreMax)
      }

      if (options?.filters?.internalCodePattern) {
        query = query.ilike('internal_code', `%${options.filters.internalCodePattern}%`)
      }

      if (options?.filters?.createdDateRange) {
        query = query.gte('created_at', options.filters.createdDateRange.start.toISOString())
        query = query.lte('created_at', options.filters.createdDateRange.end.toISOString())
      }

      if (options?.filters?.updatedDateRange) {
        query = query.gte('updated_at', options.filters.updatedDateRange.start.toISOString())
        query = query.lte('updated_at', options.filters.updatedDateRange.end.toISOString())
      }

      // Apply sorting
      if (options?.sort) {
        query = query.order(options.sort.field, { ascending: options.sort.direction === 'asc' })
      } else {
        query = query.order('updated_at', { ascending: false })
      }

      // Apply pagination if requested
      if (usePagination) {
        query = query.range(offset, offset + limit - 1)
      }

      const { data: products, error, count } = await query

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }

      if (!products) return []

      // OPTIMIZATION: Batch fetch all unique user IDs instead of individual calls
      const userIds = new Set<string>()
      products.forEach(product => {
        if (product.assigned_to) userIds.add(product.assigned_to)
        if (product.created_by) userIds.add(product.created_by)
      })

      // Fetch all users in one batch call
      const usersMap = new Map<string, { id: string; name: string; email: string }>()
      if (userIds.size > 0) {
        try {
          const { data: appUsers } = await supabase
            .from('app_users')
            .select('id, full_name, company_email')
            .in('id', Array.from(userIds))

          if (appUsers) {
            appUsers.forEach(appUser => {
              usersMap.set(appUser.id, {
                id: appUser.id,
                name: appUser.full_name || 'Unknown User',
                email: appUser.company_email || ''
              })
            })
          }

          // Add current user if not found in app_users
          const currentUser = await supabase.auth.getUser()
          if (currentUser.data.user && userIds.has(currentUser.data.user.id) && !usersMap.has(currentUser.data.user.id)) {
            usersMap.set(currentUser.data.user.id, {
              id: currentUser.data.user.id,
              name: currentUser.data.user.user_metadata?.full_name || currentUser.data.user.email || 'Current User',
              email: currentUser.data.user.email || ''
            })
          }
        } catch (error) {
          console.warn('Error fetching user details:', error)
        }
      }

      // Transform data to match UI expectations - optimized
      const transformedProducts: LifecycleProduct[] = products.map(product => {
        // Get user details from cache
        const teamLead = product.assigned_to && usersMap.has(product.assigned_to)
          ? usersMap.get(product.assigned_to)!
          : { id: product.assigned_to || '', name: 'Unassigned', email: '' }

        const owner = product.created_by && usersMap.has(product.created_by)
          ? usersMap.get(product.created_by)!
          : null

        // OPTIMIZATION: Safe JSON parsing with error handling and caching
        const parseJsonSafely = (value: any, fallback: any[] = []) => {
          if (!value) return fallback
          if (Array.isArray(value)) return value
          try {
            return typeof value === 'string' ? JSON.parse(value) : fallback
          } catch {
            return fallback
          }
        }

        const categories = parseJsonSafely(product.categories)
        const tags = parseJsonSafely(product.tags)
        const competitorLinks = parseJsonSafely(product.competitor_links)
        const adLinks = parseJsonSafely(product.ad_links)

        // Get thumbnail - optimized
        let thumbnailUrl = product.thumbnail_url
        if (!thumbnailUrl && product.uploaded_images) {
          const uploadedImages = parseJsonSafely(product.uploaded_images)
          if (uploadedImages.length > 0) {
            thumbnailUrl = uploadedImages[0]
          }
        }

        // Pre-calculate dates to avoid repeated Date constructor calls
        const createdAt = new Date(product.created_at)
        const updatedAt = new Date(product.updated_at)

        return {
          id: product.id,
          internalCode: product.internal_code || this.generateInternalCode(),
          workingTitle: product.working_title || product.name || 'Untitled Product',
          name: product.name,
          thumbnail: thumbnailUrl,
          thumbnailUrl: thumbnailUrl,
          tags,
          category: categories.length > 0 ? categories : ['General'],
          owner,
          teamLead,
          priority: (product.priority as 'low' | 'medium' | 'high') || 'medium',
          stage: (product.stage as 'idea' | 'production' | 'content' | 'scaling' | 'inventory') || 'idea',
          createdAt,
          updatedAt,
          idleDays: this.calculateIdleDays(updatedAt),
          potentialScore: product.potential_score || 0,
          ideaData: {
            notes: product.notes,
            thumbnail: product.thumbnail_url,
            problemStatement: product.problem_statement,
            opportunityStatement: product.opportunity_statement,
            estimatedSourcePriceMin: product.estimated_source_price_min,
            estimatedSourcePriceMax: product.estimated_source_price_max,
            estimatedSellingPrice: product.estimated_selling_price,
            selectedSupplierId: product.selected_supplier_id,
            competitorLinks,
            adLinks
          },
          activities: [] // Activities table was dropped during consolidation
        }
      })

      // Return paginated response or simple array based on request
      if (usePagination) {
        const totalItems = count || 0
        const currentPage = options?.pagination?.page || Math.floor(offset / limit) + 1
        const totalPages = Math.ceil(totalItems / limit)
        const hasMore = offset + limit < totalItems

        return {
          items: transformedProducts,
          total: totalItems,
          hasMore,
          page: currentPage,
          totalPages
        } as ProductListResponse
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

      const assignedTo = payload.assignedTo && payload.assignedTo.trim() !== '' && this.validateUserId(payload.assignedTo)
        ? payload.assignedTo
        : user.id

      // Create the main product record with consolidated data
      const productInsert: any = {
        internal_code: this.generateInternalCode(),
        working_title: payload.title,
        name: payload.title,
        thumbnail_url: payload.thumbnail,
        priority: payload.priority,
        stage: payload.stage,
        created_by: user.id,
        assigned_to: assignedTo,
        potential_score: 50, // Default score

        // Categories and tags as JSON arrays
        categories: payload.category ? JSON.stringify(payload.category) : '[]',
        tags: payload.tags ? JSON.stringify(payload.tags) : '[]',

        // Idea stage data (stored directly in products table)
        notes: payload.notes,
        problem_statement: payload.problemStatement,
        opportunity_statement: payload.opportunityStatement,
        estimated_source_price_min: payload.estimatedSourcePriceMin ? parseFloat(payload.estimatedSourcePriceMin) : null,
        estimated_source_price_max: payload.estimatedSourcePriceMax ? parseFloat(payload.estimatedSourcePriceMax) : null,
        estimated_selling_price: payload.estimatedSellingPrice ? parseFloat(payload.estimatedSellingPrice) : null,
        selected_supplier_id: payload.selectedSupplierId && payload.selectedSupplierId.trim() !== '' ? payload.selectedSupplierId : null,

        // Reference links as JSON arrays
        competitor_links: payload.competitorLinks ? JSON.stringify(payload.competitorLinks) : '[]',
        ad_links: payload.adLinks ? JSON.stringify(payload.adLinks) : '[]'
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

      // Note: Activity logging removed (product_activities table was dropped during consolidation)

      // Create inventory records for the new product
      await this.createInventoryRecords(product.id, product.internal_code)

      // Create design, production, and scaling records for the new product
      try {
        const { productDesignService } = await import('@/integrations/supabase/product-design-service')
        const { productProductionService } = await import('@/integrations/supabase/product-production-service')
        const { productScalingService } = await import('@/integrations/supabase/product-scaling-service')

        // Create initial design record
        await productDesignService.getOrCreateProductDesign(product.id)
        console.log('✅ Created product_design record for new product:', product.id)

        // Create initial production record
        await productProductionService.getOrCreateProductProduction(product.id)
        console.log('✅ Created product_production record for new product:', product.id)

        // Create initial scaling record
        await productScalingService.getOrCreateProductScaling(product.id)
        console.log('✅ Created product_scaling record for new product:', product.id)

      } catch (error) {
        console.warn('Warning: Could not create related records for new product:', error)
        // Don't fail product creation if related records fail
      }

      // Return the created product by fetching it with all relations
      const products = await this.listProducts() as LifecycleProduct[]
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

      // Build comprehensive update object for the consolidated products table
      const productUpdate: any = {}

      // Basic product information (always update if provided, including empty strings to clear)
      if (updates.title !== undefined) {
        productUpdate.working_title = updates.title
        productUpdate.name = updates.title
      }
      // Handle thumbnail - upload if it's a File, otherwise use as string/null
      if (updates.thumbnail !== undefined) {
        if (updates.thumbnail instanceof File) {
          try {
            const uploadedUrl = await this.uploadProductImage(updates.thumbnail, id)
            productUpdate.thumbnail_url = uploadedUrl
          } catch (uploadError) {
            console.warn('Failed to upload thumbnail:', uploadError)
            // Don't update thumbnail if upload fails
          }
        } else {
          productUpdate.thumbnail_url = updates.thumbnail // string URL or null
        }
      }
      if (updates.priority !== undefined) productUpdate.priority = updates.priority
      if (updates.stage !== undefined) productUpdate.stage = updates.stage
      if (updates.assignedTo !== undefined) productUpdate.assigned_to = updates.assignedTo

      // Categories and Tags as JSON arrays (always update if provided, even if empty)
      if (updates.category !== undefined) productUpdate.categories = JSON.stringify(updates.category)
      if (updates.tags !== undefined) productUpdate.tags = JSON.stringify(updates.tags)

      // Idea stage data - now stored directly in products table (allow clearing with null/empty)
      if (updates.notes !== undefined) productUpdate.notes = updates.notes || null
      if (updates.problemStatement !== undefined) productUpdate.problem_statement = updates.problemStatement || null
      if (updates.opportunityStatement !== undefined) productUpdate.opportunity_statement = updates.opportunityStatement || null
      if (updates.estimatedSourcePriceMin !== undefined) productUpdate.estimated_source_price_min = updates.estimatedSourcePriceMin ? parseFloat(updates.estimatedSourcePriceMin) : null
      if (updates.estimatedSourcePriceMax !== undefined) productUpdate.estimated_source_price_max = updates.estimatedSourcePriceMax ? parseFloat(updates.estimatedSourcePriceMax) : null
      if (updates.estimatedSellingPrice !== undefined) productUpdate.estimated_selling_price = updates.estimatedSellingPrice ? parseFloat(updates.estimatedSellingPrice) : null
      if (updates.selectedSupplierId !== undefined) productUpdate.selected_supplier_id = updates.selectedSupplierId || null

      // Reference links as JSON arrays (always update if provided, even if empty)
      if (updates.competitorLinks !== undefined) productUpdate.competitor_links = JSON.stringify(updates.competitorLinks)
      if (updates.adLinks !== undefined) productUpdate.ad_links = JSON.stringify(updates.adLinks)

      // Handle file uploads by uploading to storage first, then storing URLs
      if (updates.uploadedImages !== undefined) {
        if (updates.uploadedImages.length > 0) {
          try {
            const imageUrls = await Promise.all(
              updates.uploadedImages.map(async (file) => {
                if (typeof file === 'string') {
                  return file // Already a URL
                }
                if (file instanceof File) {
                  return await this.uploadProductImage(file, id)
                }
                return file.url || file.name || ''
              })
            )
            productUpdate.uploaded_images = JSON.stringify(imageUrls.filter(url => url))
          } catch (uploadError) {
            console.warn('Some images failed to upload:', uploadError)
            // Continue with update, just log the error
            productUpdate.uploaded_images = JSON.stringify([])
          }
        } else {
          productUpdate.uploaded_images = JSON.stringify([])
        }
      }

      if (updates.uploadedVideos !== undefined) {
        if (updates.uploadedVideos.length > 0) {
          try {
            const videoUrls = await Promise.all(
              updates.uploadedVideos.map(async (file) => {
                if (typeof file === 'string') {
                  return file // Already a URL
                }
                if (file instanceof File) {
                  // For now, store file name or implement video upload to storage
                  return file.name
                }
                return file.url || file.name || ''
              })
            )
            productUpdate.uploaded_videos = JSON.stringify(videoUrls.filter(url => url))
          } catch (uploadError) {
            console.warn('Some videos failed to process:', uploadError)
            productUpdate.uploaded_videos = JSON.stringify([])
          }
        } else {
          productUpdate.uploaded_videos = JSON.stringify([])
        }
      }

      // Update the products table with all changes at once
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

      // Note: Activity logging removed (product_activities table was dropped during consolidation)

      // Return updated product
      const products = await this.listProducts() as LifecycleProduct[]
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

      // Delete related data that still exists in separate tables
      const deleteTasks = [
        // Delete inventory details (will cascade to stock_movements)
        supabase.from('inventory_details').delete().eq('product_id', id)
      ]

      // Execute delete operations for remaining related data
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