import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { message },
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify({
      ok: true,
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Generate a unique file path
function generateFilePath(type: string, originalName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const randomId = crypto.randomUUID().slice(0, 8)
  const extension = originalName.split('.').pop()
  const sanitizedType = type.replace(/[^a-zA-Z0-9]/g, '_')
  
  return `${sanitizedType}/${timestamp}_${randomId}.${extension}`
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    // Validate inputs
    if (!file) {
      return createErrorResponse('File is required')
    }

    if (!type) {
      return createErrorResponse('Document type is required')
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return createErrorResponse('File size must be less than 50MB')
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse('File type not allowed. Please upload images, PDF, or Word documents.')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate unique file path
    const filePath = generateFilePath(type, file.name)

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-docs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return createErrorResponse('Failed to upload file. Please try again.')
    }

    // Create signed URL for the uploaded file (valid for 1 hour)
    const { data: signedUrlData } = await supabase.storage
      .from('employee-docs')
      .createSignedUrl(filePath, 3600)

    // Return success response
    return createSuccessResponse({
      path: uploadData.path,
      type: type,
      filename: file.name,
      size: file.size,
      mime_type: file.type,
      signed_url: signedUrlData?.signedUrl,
      uploaded_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Unexpected error in onboarding-upload:', error)
    return createErrorResponse('An unexpected error occurred. Please try again.')
  }
})

/* 
DEPLOYMENT COMMAND:
supabase functions deploy onboarding-upload --no-verify-jwt

TEST COMMAND:
curl -X POST 'http://localhost:54321/functions/v1/onboarding-upload' \
  -F 'file=@/path/to/document.pdf' \
  -F 'type=Aadhaar'

ALLOWED DOCUMENT TYPES:
- Aadhaar
- PAN
- BankProof
- Education
- Experience
- Resume
- Photo
- Other
*/