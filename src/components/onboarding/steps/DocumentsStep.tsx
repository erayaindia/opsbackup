import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { OnboardingFormData, DOCUMENT_TYPES, DocumentType } from '@/types/onboarding.types'
import { uploadDocument, isValidFileType, isValidFileSize, formatFileSize } from '@/services/onboardingService'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, File, X, Check, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentsStepProps {
  form: UseFormReturn<OnboardingFormData>
}

export function DocumentsStep({ form }: DocumentsStepProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const [uploading, setUploading] = useState<string | null>(null)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('Other')

  const documents = watch('documents') || []

  const handleFileUpload = async (file: File, type: DocumentType) => {
    // Validate file type
    if (!isValidFileType(file)) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, or image files only.')
      return
    }

    // Validate file size
    if (!isValidFileSize(file)) {
      toast.error('File size must be less than 50MB.')
      return
    }

    // Check if document type already exists (only for types that don't allow multiple)
    const docTypeConfig = DOCUMENT_TYPES.find(dt => dt.value === type)
    const existingDoc = documents.find(doc => doc.type === type)
    
    if (existingDoc && !docTypeConfig?.allowMultiple) {
      toast.error(`A document of type "${type}" is already uploaded. Please remove it first to upload a new one.`)
      return
    }

    setUploading(type)

    try {
      const response = await uploadDocument(file, type)

      if (response.ok && response.data) {
        const newDocument = {
          type,
          filename: response.data.filename,
          path: response.data.path,
          size: response.data.size,
          mime_type: response.data.mime_type,
          uploaded_at: response.data.uploaded_at,
          signed_url: response.data.signed_url
        }

        const updatedDocuments = [...documents, newDocument]
        setValue('documents', updatedDocuments)
        
        // Show appropriate success message
        const existingCount = documents.filter(doc => doc.type === type).length
        if (existingCount > 0) {
          toast.success(`Additional ${type} document uploaded successfully!`)
        } else {
          toast.success(`${type} document uploaded successfully!`)
        }
      } else {
        throw new Error(response.error?.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload document')
    } finally {
      setUploading(null)
    }
  }

  const removeDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index)
    setValue('documents', updatedDocuments)
    toast.success('Document removed successfully')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && selectedDocType) {
      handleFileUpload(files[0], selectedDocType)
    }
  }

  const getDocumentTypeInfo = (type: DocumentType) => {
    return DOCUMENT_TYPES.find(doc => doc.value === type)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-white">Document Upload:</span> Please upload the required documents marked with *. 
            Accepted formats: PDF, DOC, DOCX, JPG, PNG. Maximum file size: 50MB per document.
          </p>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <Upload className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document_type" className="text-slate-700 dark:text-slate-300 font-medium">Document Type</Label>
              <Select
                value={selectedDocType}
                onValueChange={(value: DocumentType) => setSelectedDocType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((doc) => (
                    <SelectItem key={doc.value} value={doc.value}>
                      {doc.label} {doc.required && '*'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file_upload" className="text-slate-700 dark:text-slate-300 font-medium">Select File</Label>
              <Input
                id="file_upload"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && selectedDocType) {
                    handleFileUpload(file, selectedDocType)
                    e.target.value = '' // Reset input
                  }
                }}
                disabled={!!uploading}
                className="bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300 file:border-slate-300 dark:file:border-slate-600"
              />
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center bg-slate-50/30 dark:bg-slate-800/30
              ${uploading ? 'bg-slate-100/50 dark:bg-slate-700/50 cursor-not-allowed' : 'hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer'}
            `}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-600 dark:text-slate-400">Uploading {uploading}...</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400 mb-1">
                  Drag and drop your {selectedDocType} document here, or click to browse
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getDocumentTypeInfo(selectedDocType)?.description}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <File className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              Uploaded Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{doc.type}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {doc.filename} • {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            Additional Notes (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300 font-medium">Notes or Comments</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information, special circumstances, or notes you'd like to share with the HR team..."
              rows={4}
              {...register('notes')}
              className={`bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400 ${errors.notes ? 'border-red-400 focus:border-red-500 dark:border-red-400' : ''}`}
            />
            {errors.notes && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.notes.message}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You can mention any special circumstances, document issues, or other relevant information
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Requirements */}
      <Card className="bg-slate-50/30 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 dark:text-white">Document Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Required Documents * :</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Aadhaar Card (Government Identity Proof)</li>
                <li>• PAN Card (Tax Identification)</li>
                <li>• Bank Passbook Photo (Clear front page photo)</li>
                <li>• Profile Photo (For employee profile)</li>
                <li>• Education Certificates (Can upload multiple)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Optional Documents:</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Resume/CV</li>
                <li>• Other Relevant Documents</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-300">
              <p className="font-medium mb-1 text-red-900 dark:text-red-200">Security & Privacy Notice:</p>
              <p>
                All uploaded documents are securely encrypted and stored. Access is restricted to authorized 
                HR personnel only. Your documents will be used solely for employment verification and 
                onboarding purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}