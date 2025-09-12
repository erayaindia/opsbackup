import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  ExternalLink, 
  X 
} from 'lucide-react'

interface DocumentPreviewProps {
  document: {
    type: string
    filename: string
    path: string
    size?: number
    mime_type?: string
    uploaded_at?: string
    signedUrl?: string | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentPreview({ document, open, onOpenChange }: DocumentPreviewProps) {
  const isImage = document.mime_type?.startsWith('image/')
  const isPDF = document.mime_type === 'application/pdf'
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = () => {
    if (document.signedUrl) {
      const link = document.createElement('a')
      link.href = document.signedUrl
      link.download = document.filename
      link.click()
    }
  }

  const handleOpenExternal = () => {
    if (document.signedUrl) {
      window.open(document.signedUrl, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                {document.filename}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{document.type}</Badge>
                <span className="text-sm text-gray-600">
                  {formatFileSize(document.size)}
                </span>
                {document.uploaded_at && (
                  <span className="text-sm text-gray-600">
                    • {new Date(document.uploaded_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!document.signedUrl}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                disabled={!document.signedUrl}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {!document.signedUrl ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center max-w-md mx-auto p-6">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium mb-2">Document Not Available</p>
                <p className="text-sm text-gray-500 mb-4">
                  This document file could not be found in storage. This may happen if:
                </p>
                <ul className="text-xs text-gray-500 text-left space-y-1 mb-4">
                  <li>• The file upload process was incomplete</li>
                  <li>• The file was moved or deleted from storage</li>
                  <li>• There are temporary access issues</li>
                </ul>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-700">
                    <strong>Solution:</strong> Please contact your administrator to re-upload this document or verify its location.
                  </p>
                </div>
              </div>
            </div>
          ) : isImage ? (
            <div className="p-6">
              <div className="flex justify-center">
                <img
                  src={document.signedUrl}
                  alt={document.filename}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const errorDiv = target.parentElement?.querySelector('.error-message')
                    if (errorDiv) {
                      errorDiv.classList.remove('hidden')
                    }
                  }}
                />
                <div className="error-message hidden text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Failed to load image</p>
                  <Button 
                    variant="outline" 
                    onClick={handleOpenExternal}
                    className="mt-2"
                  >
                    Open in new tab
                  </Button>
                </div>
              </div>
            </div>
          ) : isPDF ? (
            <div className="h-[70vh]">
              <iframe
                src={document.signedUrl}
                className="w-full h-full border-0"
                title={document.filename}
                onError={() => {
                  console.error('Failed to load PDF in iframe')
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Preview not available for this file type</p>
                <p className="text-sm text-gray-500 mb-4">
                  {document.mime_type || 'Unknown file type'}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleOpenExternal}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}