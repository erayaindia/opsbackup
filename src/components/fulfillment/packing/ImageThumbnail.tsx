import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageThumbnailProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function ImageThumbnail({ src, alt, size = 'md', onClick, className = '' }: ImageThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`thumb-${src}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!src || src.trim() === '' || src.toLowerCase() === 'missing photo') {
    return (
      <div className={`${sizeClasses[size]} bg-muted rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center ${className}`}>
        <span className="text-xs text-muted-foreground">No image</span>
      </div>
    );
  }

  return (
    <div 
      id={`thumb-${src}`}
      className={`${sizeClasses[size]} bg-muted rounded border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={onClick}
    >
      {isLoading && <Skeleton className="w-full h-full" />}
      
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} ${hasError ? 'hidden' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {hasError && !isLoading && (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">Error</span>
        </div>
      )}
    </div>
  );
}