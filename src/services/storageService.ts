import { supabase } from '@/integrations/supabase/client'

export interface StorageConfig {
  bucket: string
  basePath: string
  expirySeconds: number
}

export interface DocumentMetadata {
  type: string
  filename: string
  size: number
  mime_type: string
  employee_id?: string
  uploaded_at: string
}

// Centralized storage configuration
export const STORAGE_CONFIG = {
  // Main bucket for all employee documents
  EMPLOYEE_DOCS: {
    bucket: 'employee-documents',
    basePath: 'employees',
    expirySeconds: 3600 // 1 hour
  },
  
  // Temporary bucket for onboarding (auto-cleanup)
  TEMP_ONBOARDING: {
    bucket: 'employee-documents', 
    basePath: 'onboarding/temp',
    expirySeconds: 86400 // 24 hours
  },
  
  // Permanent onboarding storage
  PERMANENT_ONBOARDING: {
    bucket: 'employee-documents',
    basePath: 'onboarding/approved',
    expirySeconds: 3600 // 1 hour
  }
} as const

/**
 * Improved document storage service with reliable path management
 */
export class DocumentStorageService {
  
  /**
   * Upload file to temporary onboarding storage
   */
  static async uploadTempDocument(
    file: File, 
    documentType: string, 
    sessionId: string
  ): Promise<{ path: string; signedUrl: string | null }> {
    try {
      const fileName = this.generateFileName(file.name, documentType)
      const filePath = `${STORAGE_CONFIG.TEMP_ONBOARDING.basePath}/${sessionId}/${documentType}/${fileName}`
      
      console.log(`📤 Uploading temp document: ${filePath}`)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_CONFIG.TEMP_ONBOARDING.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('❌ Upload failed:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get signed URL immediately
      const signedUrl = await this.getSignedUrl(filePath)
      
      return {
        path: filePath,
        signedUrl
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      throw error
    }
  }

  /**
   * Move document from temp to permanent storage (called during approval)
   */
  static async moveToPermantentStorage(
    tempPath: string, 
    employeeId: string,
    documentType: string
  ): Promise<string> {
    try {
      console.log(`🔄 Moving ${tempPath} to permanent storage for employee ${employeeId}`)
      
      // Download from temp location
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(STORAGE_CONFIG.TEMP_ONBOARDING.bucket)
        .download(tempPath)

      if (downloadError) {
        console.error('❌ Download from temp failed:', downloadError)
        throw new Error(`Failed to download temp file: ${downloadError.message}`)
      }

      // Generate permanent path
      const fileName = this.extractFileNameFromPath(tempPath)
      const permanentPath = `${STORAGE_CONFIG.EMPLOYEE_DOCS.basePath}/${employeeId}/${documentType}/${fileName}`
      
      // Upload to permanent location
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_CONFIG.EMPLOYEE_DOCS.bucket)
        .upload(permanentPath, fileData, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('❌ Permanent upload failed:', uploadError)
        throw new Error(`Failed to upload to permanent storage: ${uploadError.message}`)
      }

      // Delete temp file
      await this.deleteFile(tempPath)
      
      console.log(`✅ Successfully moved to: ${permanentPath}`)
      return permanentPath
      
    } catch (error) {
      console.error('❌ Move to permanent storage failed:', error)
      throw error
    }
  }

  /**
   * Get signed URL for any document path with intelligent bucket detection
   */
  static async getSignedUrl(path: string): Promise<string | null> {
    try {
      // Determine bucket based on path
      const bucket = this.getBucketFromPath(path)
      const expirySeconds = this.getExpiryFromPath(path)
      
      console.log(`🔗 Getting signed URL: ${bucket}/${path}`)
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expirySeconds)

      if (error) {
        console.error(`❌ Signed URL failed for ${bucket}:`, error.message)
        return null
      }

      if (data?.signedUrl) {
        console.log(`✅ Signed URL created for ${bucket}`)
        return data.signedUrl
      }
      
      return null
    } catch (error) {
      console.error('❌ Exception getting signed URL:', error)
      return null
    }
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      const bucket = this.getBucketFromPath(path)
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) {
        console.warn(`⚠️ Failed to delete ${path}:`, error.message)
      } else {
        console.log(`🗑️ Deleted: ${path}`)
      }
    } catch (error) {
      console.warn('⚠️ Exception deleting file:', error)
    }
  }

  /**
   * Cleanup old temporary files (can be run periodically)
   */
  static async cleanupTempFiles(olderThanHours: number = 48): Promise<void> {
    try {
      console.log(`🧹 Cleaning up temp files older than ${olderThanHours} hours`)
      
      const { data: files, error } = await supabase.storage
        .from(STORAGE_CONFIG.TEMP_ONBOARDING.bucket)
        .list(STORAGE_CONFIG.TEMP_ONBOARDING.basePath, {
          limit: 1000,
          offset: 0
        })

      if (error) {
        console.error('❌ Failed to list temp files:', error)
        return
      }

      const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000))
      const filesToDelete: string[] = []

      files?.forEach(file => {
        if (file.updated_at && new Date(file.updated_at) < cutoffTime) {
          filesToDelete.push(`${STORAGE_CONFIG.TEMP_ONBOARDING.basePath}/${file.name}`)
        }
      })

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_CONFIG.TEMP_ONBOARDING.bucket)
          .remove(filesToDelete)

        if (deleteError) {
          console.error('❌ Failed to delete temp files:', deleteError)
        } else {
          console.log(`🗑️ Cleaned up ${filesToDelete.length} temp files`)
        }
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error)
    }
  }

  // Helper methods
  private static generateFileName(originalName: string, documentType: string): string {
    const ext = originalName.split('.').pop()
    const timestamp = Date.now()
    return `${documentType}_${timestamp}.${ext}`
  }

  private static extractFileNameFromPath(path: string): string {
    return path.split('/').pop() || 'unknown'
  }

  private static getBucketFromPath(path: string): string {
    if (path.includes('onboarding/temp')) {
      return STORAGE_CONFIG.TEMP_ONBOARDING.bucket
    }
    if (path.includes('onboarding/approved')) {
      return STORAGE_CONFIG.PERMANENT_ONBOARDING.bucket  
    }
    if (path.includes('employees/')) {
      return STORAGE_CONFIG.EMPLOYEE_DOCS.bucket
    }
    
    // Default to main employee documents bucket
    return STORAGE_CONFIG.EMPLOYEE_DOCS.bucket
  }

  private static getExpiryFromPath(path: string): number {
    if (path.includes('onboarding/temp')) {
      return STORAGE_CONFIG.TEMP_ONBOARDING.expirySeconds
    }
    if (path.includes('onboarding/approved')) {
      return STORAGE_CONFIG.PERMANENT_ONBOARDING.expirySeconds
    }
    
    // Default expiry
    return STORAGE_CONFIG.EMPLOYEE_DOCS.expirySeconds
  }

  /**
   * Migrate existing temp documents to permanent storage
   * Call this for users who already have temp paths in database
   */
  static async migrateTempDocuments(
    employeeId: string,
    documents: any[]
  ): Promise<any[]> {
    const migratedDocs = []
    
    for (const doc of documents) {
      try {
        if (doc.path && doc.path.includes('onboarding/temp')) {
          console.log(`🔄 Migrating temp document: ${doc.path}`)
          
          const newPath = await this.moveToPermantentStorage(
            doc.path,
            employeeId,
            doc.type
          )
          
          migratedDocs.push({
            ...doc,
            path: newPath
          })
        } else {
          // Keep non-temp documents as-is
          migratedDocs.push(doc)
        }
      } catch (error) {
        console.error(`❌ Failed to migrate ${doc.path}:`, error)
        // Keep original document if migration fails
        migratedDocs.push(doc)
      }
    }
    
    return migratedDocs
  }
}