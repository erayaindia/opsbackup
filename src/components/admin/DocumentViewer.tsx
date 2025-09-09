import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Download, FileText, Image, AlertCircle } from 'lucide-react'
import { getDocumentSignedUrl } from '@/services/onboardingService'
import { toast } from 'sonner'

interface DocumentViewerProps {
  applicationId: string
  documents: Array<{
    type: string
    filename: string
    path: string
    size: number
    mime_type: string
    uploaded_at: string
  }>
}

export default function DocumentViewer({ applicationId, documents }: DocumentViewerProps) {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null)

  const handleViewDocument = async (document: any) => {
    setLoadingUrl(document.path)
    
    try {
      const signedUrl = await getDocumentSignedUrl(document.path)
      
      if (signedUrl) {
        // Open document in new tab
        window.open(signedUrl, '_blank')
      } else {
        toast.error('Failed to load document')
      }
    } catch (error) {
      console.error('Error viewing document:', error)
      toast.error('Failed to load document')
    } finally {
      setLoadingUrl(null)
    }
  }

  const handleDownloadDocument = async (document: any) => {
    try {
      const signedUrl = await getDocumentSignedUrl(document.path)
      
      if (signedUrl) {
        // Create download link
        const link = document.createElement('a')
        link.href = signedUrl
        link.download = document.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('Download started')
      } else {
        toast.error('Failed to download document')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-400" />
    } else {
      return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'aadhaar_front': 'Aadhaar Front',
      'aadhaar_back': 'Aadhaar Back',
      'pan': 'PAN Card',
      'bank_passbook': 'Bank Passbook',
      'profile_photo': 'Profile Photo',
      'education_certificate': 'Education Certificate',
      'resume': 'Resume',
      'other': 'Other'
    }
    return typeMap[type] || type
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No documents uploaded</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Uploaded Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((document, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                {getDocumentIcon(document.mime_type)}
                <div>
                  <h4 className="font-medium text-sm">
                    {getDocumentTypeLabel(document.type)}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {document.filename} • {formatFileSize(document.size)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {document.mime_type.split('/')[1]?.toUpperCase()}
                </Badge>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewDocument(document)}
                  disabled={loadingUrl === document.path}
                  className="px-3"
                >
                  {loadingUrl === document.path ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  View
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadDocument(document)}
                  className="px-3"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Document Storage Location
              </h5>
              <p className="text-blue-700 dark:text-blue-300">
                Files are stored in: <code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded text-xs">
                  employee-documents/onboarding/{applicationId}/
                </code>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}