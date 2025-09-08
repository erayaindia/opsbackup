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

    // Check if document type already exists
    const existingDoc = documents.find(doc => doc.type === type)
    if (existingDoc) {
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
        toast.success(`${type} document uploaded successfully!`)
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
      <Card className="bg-orange-50/50 border-orange-200">
        <CardContent className="p-4">
          <p className="text-sm text-orange-800">
            <span className="font-medium">Document Upload:</span> Please upload the required documents. 
            Accepted formats: PDF, DOC, DOCX, JPG, PNG. Maximum file size: 50MB per document.
          </p>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type</Label>
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
                      {doc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file_upload">Select File</Label>
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
              />
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed border-gray-300 rounded-lg p-6 text-center
              ${uploading ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
            `}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">Uploading {uploading}...</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-1">
                  Drag and drop your {selectedDocType} document here, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  {getDocumentTypeInfo(selectedDocType)?.description}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              Uploaded Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.type}</p>
                      <p className="text-xs text-gray-500">
                        {doc.filename} • {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Additional Notes (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes or Comments</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information, special circumstances, or notes you'd like to share with the HR team..."
              rows={4}
              {...register('notes')}
              className={errors.notes ? 'border-red-300' : ''}
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes.message}</p>
            )}
            <p className="text-xs text-gray-500">
              You can mention any special circumstances, document issues, or other relevant information
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Requirements */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">Document Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Required Documents:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Aadhaar Card (Identity Proof)</li>
                <li>• PAN Card (Tax ID)</li>
                <li>• Bank Account Proof</li>
                <li>• Recent Passport Photo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Optional Documents:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Education Certificates</li>
                <li>• Experience Letters</li>
                <li>• Updated Resume/CV</li>
                <li>• Other Relevant Documents</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Security & Privacy Notice:</p>
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