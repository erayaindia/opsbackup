import { useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  title?: string;
}

export function ImagePreviewModal({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onIndexChange,
  title = "Image Preview"
}: ImagePreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      }
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        onIndexChange(currentIndex + 1);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex, images.length, onClose, onIndexChange]);
  
  if (!isOpen || images.length === 0) return null;
  
  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--overlay)' }}
      role="dialog" 
      aria-modal="true" 
      aria-label={title}
      onClick={onClose}
    >
      {/* Close Button */}
      <button 
        ref={closeButtonRef}
        aria-label="Close image preview" 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full p-2 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>
      
      {/* Navigation Arrows */}
      {hasMultiple && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(currentIndex - 1);
          }}
          className="absolute left-4 z-10 rounded-full p-2 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      
      {hasMultiple && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(currentIndex + 1);
          }}
          className="absolute right-4 z-10 rounded-full p-2 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}
      
      {/* Image */}
      <img 
        src={currentImage} 
        alt={`Image ${currentIndex + 1} of ${images.length}`}
        className="max-w-[90vw] max-h-[85vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Image Counter */}
      {hasMultiple && (
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {currentIndex + 1} of {images.length}
        </div>
      )}
    </div>
  );
}