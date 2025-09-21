import React, { memo, useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Star,
  MoreHorizontal,
  Edit3,
  Copy,
  Archive,
  Package,
} from 'lucide-react'
import type { LifecycleProduct } from '@/services/productLifecycleService'

// Lazy Image component with Intersection Observer
const LazyImage = memo(({
  src,
  alt,
  className,
  onError
}: {
  src: string
  alt: string
  className: string
  onError?: () => void
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isInView && src) {
      setImageSrc(src)
    }
  }, [isInView, src])

  return (
    <div ref={imgRef} className="w-full h-full flex items-center justify-center bg-muted">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          onError={onError}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full animate-pulse">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted-foreground/30"
          >
            <path
              d="M20 7h-3V6a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v1H4a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V6zm9 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h6v1a1 1 0 0 0 2 0V9h2v10z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}
    </div>
  )
})

LazyImage.displayName = 'LazyImage'

interface ProductCardProps {
  card: LifecycleProduct
  onClick: (card: LifecycleProduct) => void
  onFavorite: (e: React.MouseEvent, productId: string) => void
  onArchive: (e: React.MouseEvent, productId: string) => void
  onDuplicate: (e: React.MouseEvent, card: LifecycleProduct) => void
  isFavorite: boolean
  getProductAge: (card: LifecycleProduct) => number
  stageConfig?: {
    name: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    bgColor: string
  }
}

const ProductCard = memo<ProductCardProps>(({
  card,
  onClick,
  onFavorite,
  onArchive,
  onDuplicate,
  isFavorite,
  getProductAge,
  stageConfig
}) => {
  const priorityColor = card.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                      card.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      'bg-green-100 text-green-700 border border-green-200'

  const StageIcon = stageConfig?.icon || Package
  const days = getProductAge(card)

  return (
    <TooltipProvider>
      <div className="group relative">
        <Card
          onClick={() => onClick(card)}
          className={`enhanced-card hover:shadow-elegant transition-all duration-300 cursor-pointer border-border/50 backdrop-blur-sm animate-fade-in overflow-hidden ${
            isFavorite ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
          }`}
        >
          {/* Favorite Star - Top Left Corner */}
          <div className="absolute top-2 left-2 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-all duration-200 ${
                    isFavorite
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => onFavorite(e, card.id)}
                >
                  <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Quick Actions Menu - Top Right Corner */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick actions</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(card); }}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => onDuplicate(e, card)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => onArchive(e, card.id)}
                  className="text-orange-600"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Age Indicator - Top Right Badge */}
          <div className="absolute top-2 right-12 z-10">
            <Tooltip>
              <TooltipTrigger>
                <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {days}d
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{days} days in {stageConfig?.name || card.stage} stage</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Product Image with Lazy Loading */}
          <div className="relative h-[200px] bg-muted flex items-center justify-center">
            {card.thumbnail || card.thumbnailUrl || card.ideaData?.thumbnail ? (
              <LazyImage
                src={card.thumbnail || card.thumbnailUrl || card.ideaData?.thumbnail}
                alt={card.workingTitle || card.name}
                className="w-full h-full object-cover"
                onError={() => {
                  console.log('Failed to load image for product:', card.id)
                }}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-muted-foreground/40"
                >
                  <path
                    d="M20 7h-3V6a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v1H4a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V6zm9 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h6v1a1 1 0 0 0 2 0V9h2v10z"
                    fill="currentColor"
                  />
                  <circle cx="9" cy="13" r="1" fill="currentColor" />
                  <circle cx="15" cy="13" r="1" fill="currentColor" />
                  <path d="M12 15.5c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z" fill="currentColor" />
                </svg>
              </div>
            )}
          </div>

          {/* Card Content */}
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-xs">{card.internalCode}</span>
                <span>{new Date(card.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </div>

              {/* Product Name */}
              <div className="text-sm font-bold text-foreground truncate">
                {card.workingTitle || card.name || `Product ${card.internalCode}`}
              </div>

              {/* Priority and Stage */}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-none text-xs font-medium ${priorityColor}`}>
                  {(card.priority || 'medium').charAt(0).toUpperCase() + (card.priority || 'medium').slice(1)}
                </span>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded-none text-xs">
                  <StageIcon className="h-3 w-3" />
                  <span className="font-medium">{stageConfig?.name || card.stage}</span>
                </div>
              </div>

              {/* Category and Assigned User */}
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-none text-xs">
                  {card.category[0] || 'Uncategorized'}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {card.teamLead.name.charAt(0)}
                  </div>
                  <span className="text-xs">{card.teamLead.name.split(' ')[0]}</span>
                </div>
              </div>

              {/* Tags at bottom */}
              {(card.tags && card.tags.length > 0) && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1 overflow-hidden">
                    {card.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-none text-[10px] font-normal whitespace-nowrap flex-shrink-0">
                        {tag}
                      </span>
                    ))}
                    {card.tags.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-none text-[10px] font-normal flex-shrink-0">
                        +{card.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hover Preview Tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute inset-0 pointer-events-none" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm p-4">
            <div className="space-y-2 text-sm">
              <div className="font-semibold">{card.workingTitle || card.name}</div>
              {card.ideaData?.problemStatement && (
                <div>
                  <span className="font-medium">Problem:</span>
                  <p className="text-xs text-muted-foreground truncate">
                    {card.ideaData.problemStatement.slice(0, 100)}...
                  </p>
                </div>
              )}
              {card.ideaData?.opportunityStatement && (
                <div>
                  <span className="font-medium">Opportunity:</span>
                  <p className="text-xs text-muted-foreground truncate">
                    {card.ideaData.opportunityStatement.slice(0, 100)}...
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span>Stage: {stageConfig?.name || card.stage}</span>
                <span>Age: {days} days</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
})

ProductCard.displayName = 'ProductCard'

export { ProductCard, LazyImage }
export type { ProductCardProps }