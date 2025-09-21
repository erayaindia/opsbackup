import React, { useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Download, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerModalProps {
  open: boolean
  onClose: () => void
  videoUrl: string
  videoTitle?: string
  className?: string
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  open,
  onClose,
  videoUrl,
  videoTitle,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Pause video when modal closes
  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause()
    }
  }, [open])

  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = videoTitle || 'video'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle open in new tab
  const handleOpenInNewTab = () => {
    window.open(videoUrl, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-semibold truncate pr-4">
            {videoTitle || 'Video Player'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Download video"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewTab}
              className="h-8 w-8 p-0"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Video Player */}
        <div className="flex-1 bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full max-h-[70vh] object-contain"
            onError={(e) => {
              console.error('Video playback error:', e)
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Footer with video info */}
        <div className="p-4 pt-2 bg-muted/30 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Use controls to play, pause, and adjust volume</span>
            <span className="text-xs">ESC to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VideoPlayerModal