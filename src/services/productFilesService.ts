import { supabase } from '@/integrations/supabase/client'

export interface ProductFile {
  id: string
  product_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  display_order: number
  is_primary: boolean
  caption?: string
  uploaded_at: string
  uploaded_by: string
}

export interface UploadFileOptions {
  caption?: string
  isPrimary?: boolean
  displayOrder?: number
}

class ProductFilesService {
  private readonly STORAGE_BUCKET = 'product-files'  // Note: This bucket needs to be created in Supabase
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for general files
  private readonly ALLOWED_TYPES = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    // Videos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
  ]

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Allowed: images, videos, PDFs, documents, and archives'
      }
    }

    const maxSizeInMB = this.MAX_FILE_SIZE / (1024 * 1024)
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizeInMB}MB`
      }
    }

    return { valid: true }
  }

  /**
   * Generate unique filename for storage
   */
  private generateFileName(productId: string, originalName: string): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = originalName.split('.').pop()
    return `${productId}/${timestamp}_${randomString}.${extension}`
  }

  /**
   * Upload file to Supabase storage
   */
  private async uploadToStorage(file: File, fileName: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.STORAGE_BUCKET)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }

  /**
   * Get all files for a product
   */
  async getProductFiles(productId: string): Promise<ProductFile[]> {
    try {
      // console.log('🔍 Fetching images for product:', productId)
      const { data, error } = await supabase
        .from('product_files')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('❌ Error fetching product images:', error)

        // Handle case where table doesn't exist yet
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('Product images table does not exist yet. Returning empty array.')
          return []
        }

        throw new Error('Failed to fetch product images')
      }

      // console.log('✅ Successfully fetched images:', data?.length || 0, 'images')
      return data || []
    } catch (error) {
      console.error('❌ Error in getProductImages:', error)

      // Handle table not existing gracefully
      if (error instanceof Error &&
          (error.message?.includes('relation') ||
           error.message?.includes('does not exist') ||
           error.message?.includes('42P01'))) {
        console.warn('Product images table does not exist yet. Returning empty array.')
        return []
      }

      throw error
    }
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    productId: string,
    file: File,
    options: UploadFileOptions = {}
  ): Promise<ProductFile> {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Generate filename and upload to storage
      const fileName = this.generateFileName(productId, file.name)
      const imageUrl = await this.uploadToStorage(file, fileName)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Insert record into database
      const { data, error } = await supabase
        .from('product_files')
        .insert({
          product_id: productId,
          file_url: imageUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          display_order: options.displayOrder || 0,
          is_primary: options.isPrimary || false,
          caption: options.caption,
          uploaded_by: user.id
        })
        .select()
        .single()

      if (error) {
        // Clean up uploaded file if database insert fails
        await this.deleteFromStorage(fileName)
        console.error('Database insert error:', error)
        throw new Error('Failed to save file record')
      }

      return data
    } catch (error) {
      console.error('Error in uploadFile:', error)
      throw error
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    productId: string,
    files: File[],
    options: UploadFileOptions = {}
  ): Promise<ProductFile[]> {
    const results: ProductFile[] = []

    for (let i = 0; i < files.length; i++) {
      try {
        const imageOptions = {
          ...options,
          displayOrder: options.displayOrder ? options.displayOrder + i : undefined,
          isPrimary: options.isPrimary && i === 0 // Only first file can be primary
        }

        const result = await this.uploadFile(productId, files[i], imageOptions)
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload file ${i + 1}:`, error)
        // Continue uploading other images even if one fails
      }
    }

    return results
  }

  /**
   * Delete file from storage
   */
  private async deleteFromStorage(fileName: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .remove([fileName])

    if (error) {
      console.error('Storage delete error:', error)
      // Don't throw error for storage cleanup failures
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get file record first to get the storage path
      const { data: file, error: fetchError } = await supabase
        .from('product_files')
        .select('file_url, product_id')
        .eq('id', fileId)
        .single()

      if (fetchError || !file) {
        throw new Error('File not found')
      }

      // Extract filename from URL for storage deletion
      const urlParts = file.file_url.split('/')
      const fileName = `${file.product_id}/${urlParts[urlParts.length - 1]}`

      // Delete from database
      const { error: deleteError } = await supabase
        .from('product_files')
        .delete()
        .eq('id', fileId)

      if (deleteError) {
        console.error('Database delete error:', deleteError)
        throw new Error('Failed to delete file record')
      }

      // Delete from storage (don't throw error if this fails)
      await this.deleteFromStorage(fileName)

    } catch (error) {
      console.error('Error in deleteFile:', error)
      throw error
    }
  }

  /**
   * Reorder files for a product
   */
  async reorderImages(productId: string, imageOrders: { id: string; order: number }[]): Promise<void> {
    try {
      // Update each file's display_order
      const updates = imageOrders.map(({ id, order }) =>
        supabase
          .from('product_files')
          .update({ display_order: order })
          .eq('id', id)
          .eq('product_id', productId) // Security check
      )

      const results = await Promise.all(updates)

      // Check for any errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        console.error('Reorder errors:', errors)
        throw new Error('Failed to reorder some images')
      }

    } catch (error) {
      console.error('Error in reorderImages:', error)
      throw error
    }
  }

  /**
   * Set primary file for a product
   */
  async setPrimaryFile(productId: string, fileId: string): Promise<void> {
    try {
      // First, unset all primary files for this product (for safety)
      await supabase
        .from('product_files')
        .update({ is_primary: false })
        .eq('product_id', productId)

      // Then set the specified file as primary
      const { error } = await supabase
        .from('product_files')
        .update({ is_primary: true })
        .eq('id', fileId)
        .eq('product_id', productId) // Security check

      if (error) {
        console.error('Set primary error:', error)
        throw new Error('Failed to set primary file')
      }

      console.log('✅ Successfully set primary file:', fileId, 'for product:', productId)

    } catch (error) {
      console.error('Error in setPrimaryFile:', error)
      throw error
    }
  }

  /**
   * Update file caption
   */
  async updateFileCaption(fileId: string, caption: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_files')
        .update({ caption })
        .eq('id', fileId)

      if (error) {
        console.error('Update caption error:', error)
        throw new Error('Failed to update file caption')
      }

    } catch (error) {
      console.error('Error in updateFileCaption:', error)
      throw error
    }
  }

  /**
   * Get primary file for a product
   */
  async getPrimaryFile(productId: string): Promise<ProductFile | null> {
    try {
      const { data, error } = await supabase
        .from('product_files')
        .select('*')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching primary file:', error)
        throw new Error('Failed to fetch primary file')
      }

      return data || null
    } catch (error) {
      console.error('Error in getPrimaryFile:', error)
      throw error
    }
  }

  /**
   * Get file count for a product
   */
  async getFileCount(productId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('product_files')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)

      if (error) {
        console.error('Error getting file count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in getFileCount:', error)
      return 0
    }
  }
}

export const productFilesService = new ProductFilesService()