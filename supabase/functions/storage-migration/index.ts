import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MigrationRequest {
  action: 'preview' | 'migrate' | 'cleanup'
  employeeIds?: string[] // Optional: migrate specific employees only
}

interface MigrationResult {
  success: boolean
  message: string
  summary: {
    employeesProcessed: number
    documentsMovedSuccessfully: number
    documentsFailed: number
    foldersCleanedUp: number
  }
  details: Array<{
    employeeId: string
    fullName: string
    documentsProcessed: number
    errors: string[]
  }>
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { action, employeeIds }: MigrationRequest = await req.json()

    console.log(`🚀 Starting storage migration action: ${action}`)

    const result: MigrationResult = {
      success: false,
      message: '',
      summary: {
        employeesProcessed: 0,
        documentsMovedSuccessfully: 0,
        documentsFailed: 0,
        foldersCleanedUp: 0
      },
      details: []
    }

    // Get employees needing migration
    let query = supabase
      .from('employees_details')
      .select('employee_id, full_name, application_id, documents')
      .not('documents', 'is', null)
      .not('employee_id', 'is', null)

    if (employeeIds && employeeIds.length > 0) {
      query = query.in('employee_id', employeeIds)
    }

    const { data: employees, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch employees: ${fetchError.message}`)
    }

    // Filter employees with temp paths
    const employeesNeedingMigration = employees?.filter(emp => 
      emp.documents && 
      Array.isArray(emp.documents) &&
      emp.documents.some((doc: any) => doc.path && doc.path.includes('onboarding/temp/'))
    ) || []

    console.log(`📋 Found ${employeesNeedingMigration.length} employees needing migration`)

    if (action === 'preview') {
      // Just return what would be migrated
      result.success = true
      result.message = `Preview: ${employeesNeedingMigration.length} employees need migration`
      result.summary.employeesProcessed = employeesNeedingMigration.length
      
      result.details = employeesNeedingMigration.map(emp => ({
        employeeId: emp.employee_id,
        fullName: emp.full_name,
        documentsProcessed: emp.documents.filter((doc: any) => 
          doc.path && doc.path.includes('onboarding/temp/')
        ).length,
        errors: []
      }))

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'migrate') {
      // Migrate files for each employee
      for (const employee of employeesNeedingMigration) {
        console.log(`👤 Processing ${employee.full_name} (${employee.employee_id})`)
        
        const employeeDetail = {
          employeeId: employee.employee_id,
          fullName: employee.full_name,
          documentsProcessed: 0,
          errors: []
        }

        const tempDocuments = employee.documents.filter((doc: any) => 
          doc.path && doc.path.includes('onboarding/temp/')
        )

        for (const doc of tempDocuments) {
          try {
            console.log(`📁 Migrating: ${doc.path}`)

            // Download file from temp location
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('employee-documents')
              .download(doc.path)

            if (downloadError) {
              throw new Error(`Download failed: ${downloadError.message}`)
            }

            // Generate new clean path
            const fileExtension = doc.filename?.split('.').pop() || 
                                  doc.path.split('.').pop() || 'unknown'
            const documentType = doc.type?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'document'
            const cleanFilename = `${documentType}.${fileExtension}`
            const newPath = `onboarding/${employee.employee_id}/${cleanFilename}`

            // Upload to new location
            const { error: uploadError } = await supabase.storage
              .from('employee-documents')
              .upload(newPath, fileData, {
                cacheControl: '3600',
                upsert: true
              })

            if (uploadError) {
              throw new Error(`Upload failed: ${uploadError.message}`)
            }

            // Delete old file
            const { error: deleteError } = await supabase.storage
              .from('employee-documents')
              .remove([doc.path])

            if (deleteError) {
              console.warn(`⚠️ Failed to delete old file ${doc.path}: ${deleteError.message}`)
            }

            console.log(`✅ Migrated: ${doc.path} → ${newPath}`)
            result.summary.documentsMovedSuccessfully++
            employeeDetail.documentsProcessed++

          } catch (error) {
            console.error(`❌ Failed to migrate ${doc.path}:`, error)
            employeeDetail.errors.push(`${doc.path}: ${error.message}`)
            result.summary.documentsFailed++
          }
        }

        result.details.push(employeeDetail)
        result.summary.employeesProcessed++
      }

      // Update database paths (this was done via SQL migration)
      console.log('📝 Database paths should be updated via SQL migration')
    }

    if (action === 'cleanup') {
      // Clean up empty temp folders
      console.log('🧹 Cleaning up temp folders...')
      
      try {
        const { data: tempFolders, error: listError } = await supabase.storage
          .from('employee-documents')
          .list('onboarding/temp', {
            limit: 1000,
            offset: 0
          })

        if (listError) {
          throw new Error(`Failed to list temp folders: ${listError.message}`)
        }

        for (const folder of tempFolders || []) {
          if (folder.name && folder.name !== '.emptyFolderPlaceholder') {
            try {
              // List contents of this folder
              const folderPath = `onboarding/temp/${folder.name}`
              const { data: folderContents, error: folderListError } = await supabase.storage
                .from('employee-documents')
                .list(folderPath, { limit: 1000, offset: 0 })

              if (!folderListError && folderContents && folderContents.length > 0) {
                // Delete all files in folder
                const filesToDelete = folderContents
                  .filter(item => item.name !== '.emptyFolderPlaceholder')
                  .map(item => `${folderPath}/${item.name}`)

                if (filesToDelete.length > 0) {
                  const { error: deleteError } = await supabase.storage
                    .from('employee-documents')
                    .remove(filesToDelete)

                  if (!deleteError) {
                    result.summary.foldersCleanedUp++
                    console.log(`🗑️ Cleaned: ${folderPath}`)
                  }
                }
              }
            } catch (error) {
              console.warn(`⚠️ Failed to clean ${folder.name}:`, error)
            }
          }
        }
      } catch (error) {
        console.error('❌ Cleanup error:', error)
      }
    }

    result.success = true
    result.message = `Migration completed successfully. Processed ${result.summary.employeesProcessed} employees, moved ${result.summary.documentsMovedSuccessfully} documents.`

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Migration error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Migration failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})