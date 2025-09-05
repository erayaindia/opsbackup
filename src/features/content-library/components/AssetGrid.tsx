import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { AssetGridProps } from "../types";
import { AssetCard } from "./AssetCard";

/**
 * AssetGrid - Responsive grid layout for displaying asset cards
 * Automatically adjusts column count based on screen size:
 * - Mobile: 2 columns
 * - Tablet: 3-4 columns  
 * - Desktop: 5-7 columns
 * Manages exclusive video playback (only one video plays at a time)
 */
export const AssetGrid: React.FC<AssetGridProps> = ({ 
  items, 
  onOpen,
  onCopyLink,
  onDownload,
  onMore,
  onSelect,
  onDelete,
  onRename,
  onStageChange,
  onPerformanceChange,
  selectMode = false,
  selectedItems = new Set(),
  showQuickActions = true,
}) => {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const handleVideoPlay = (id: string) => {
    setActiveVideoId(id);
  };
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg 
            className="w-8 h-8 text-muted-foreground" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No assets found</h3>
        <p className="text-sm text-muted-foreground">
          There are no approved assets to display at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Grid Container */}
      <div
        className={cn(
          // Base grid setup
          "grid gap-4 w-full px-4",
          // Responsive columns:
          // Mobile (default): 2 columns
          "grid-cols-2",
          // Tablets: 3 columns (md: 768px+)  
          "md:grid-cols-3",
          // Desktop: 6 columns (lg: 1024px+)
          "lg:grid-cols-6"
        )}
      >
        {items.map((item) => (
          <AssetCard
            key={item.id}
            {...item}
            onOpen={onOpen}
            onCopyLink={onCopyLink}
            onDownload={onDownload}
            onMore={onMore}
            onSelect={onSelect}
            onDelete={onDelete}
            onRename={onRename}
            onStageChange={onStageChange}
            onPerformanceChange={onPerformanceChange}
            selectMode={selectMode}
            selected={selectedItems.has(item.id)}
            showQuickActions={showQuickActions}
            activeVideoId={activeVideoId}
            onVideoPlay={handleVideoPlay}
          />
        ))}
      </div>

      {/* Optional: Load more functionality placeholder */}
      {/* This could be implemented later when real data/pagination is added */}
    </div>
  );
};