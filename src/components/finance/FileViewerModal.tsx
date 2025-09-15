import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FileViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export default function FileViewerModal({
  open,
  onOpenChange,
  fileUrl,
  fileName,
  fileType
}: FileViewerModalProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string>('');

  // Generate signed URL for secure access
  useEffect(() => {
    const getSignedUrl = async () => {
      if (!open || !fileUrl) return;

      try {
        setHasError(false);
        setIsLoading(true);

        // Extract the file path from the URL
        let filePath = fileUrl;

        if (fileUrl.startsWith('http')) {
          // It's a full URL, extract the path
          if (fileUrl.includes('/storage/v1/object/public/invoice-documents/')) {
            // Extract path from public URL
            const parts = fileUrl.split('/storage/v1/object/public/invoice-documents/');
            if (parts.length > 1) {
              filePath = parts[1];
            } else {
              console.error('Could not extract file path from URL:', fileUrl);
              setSignedUrl(fileUrl);
              setIsLoading(false);
              return;
            }
          } else if (fileUrl.includes('/storage/v1/object/sign/invoice-documents/')) {
            // It's already a signed URL, use it directly
            setSignedUrl(fileUrl);
            setIsLoading(false);
            return;
          } else {
            // Try to use the URL directly
            setSignedUrl(fileUrl);
            setIsLoading(false);
            return;
          }
        }

        // Generate signed URL for secure access
        console.log('Attempting to create signed URL for:', filePath);
        const { data, error } = await supabase.storage
          .from('invoice-documents')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          console.error('Error creating signed URL:', error);
          console.error('File path attempted:', filePath);
          // Try to use the original URL for now
          setSignedUrl(fileUrl);
          setHasError(true);
        } else if (data?.signedUrl) {
          console.log('Successfully created signed URL');
          setSignedUrl(data.signedUrl);
        } else {
          console.warn('No signed URL returned, using original URL');
          setSignedUrl(fileUrl);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error in getSignedUrl:', error);
        setSignedUrl(fileUrl); // Fallback to original URL
        setIsLoading(false);
      }
    };

    getSignedUrl();
  }, [open, fileUrl]);

  if (!fileUrl) return null;

  const isPdf = fileType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');
  const isImage = fileType?.startsWith('image/') ||
    fileName?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = signedUrl || fileUrl;
      link.download = fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to opening in new tab
      window.open(signedUrl || fileUrl, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(signedUrl || fileUrl, '_blank');
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[95vh] rounded-none p-0 gap-0 flex flex-col [&>button]:hidden">
        {/* Custom Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
          <h2 className="text-lg font-semibold truncate">
            {fileName || 'File Viewer'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="rounded-none h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="rounded-none h-8"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in New Tab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-none p-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {hasError ? (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">File not accessible</h3>
                <p className="text-muted-foreground mb-4">
                  The file could not be loaded. This might be due to access permissions or the file may have been moved.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleDownload} className="rounded-none">
                    <Download className="h-4 w-4 mr-2" />
                    Try Download
                  </Button>
                  <Button variant="outline" onClick={handleOpenInNewTab} className="rounded-none">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </div>
          ) : isPdf ? (
            <div className="relative w-full h-full bg-gray-100">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>
              )}
              <iframe
                src={signedUrl || fileUrl}
                className="w-full h-full border-0 bg-white"
                title={fileName || 'PDF Viewer'}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            </div>
          ) : isImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-gray-50">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading image...</p>
                  </div>
                </div>
              )}
              <img
                src={signedUrl || fileUrl}
                alt={fileName || 'Image'}
                className="max-w-full max-h-full object-contain shadow-lg"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  This file type cannot be previewed directly.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleDownload} className="rounded-none">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                  <Button variant="outline" onClick={handleOpenInNewTab} className="rounded-none">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}