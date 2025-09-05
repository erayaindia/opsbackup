import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { AssetGridProps, STAGE_COLORS, PERFORMANCE_COLORS } from "../types";
import { formatMetadata, formatDuration } from "../utils/formatters";

/**
 * AssetList - List view layout for displaying assets in rows
 * Shows thumbnail, title, details, and actions in a table-like format
 */
export const AssetList: React.FC<AssetGridProps> = ({
  items,
  onOpen,
  onCopyLink,
  onDownload,
  onMore,
  onSelect,
  selectMode = false,
  selectedItems = new Set(),
  showQuickActions = true,
}) => {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const handleVideoPlay = (id: string) => {
    setActiveVideoId(id);
  };

  // Get stage colors based on current theme
  const getStageColors = (stage: keyof typeof STAGE_COLORS) => {
    return `${STAGE_COLORS[stage].light} dark:${STAGE_COLORS[stage].dark}`;
  };

  // Get performance colors based on current theme
  const getPerformanceColors = (label: keyof typeof PERFORMANCE_COLORS) => {
    return `${PERFORMANCE_COLORS[label].light} dark:${PERFORMANCE_COLORS[label].dark}`;
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
              d="M4 6h16M4 10h16M4 14h16M4 18h16" 
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
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 p-3 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
        {selectMode && <div className="col-span-1">Select</div>}
        <div className={selectMode ? "col-span-2" : "col-span-3"}>Preview</div>
        <div className="col-span-3">Title & Product</div>
        <div className="col-span-2">Stage</div>
        <div className="col-span-2">Performance</div>
        <div className="col-span-2">Created</div>
        {showQuickActions && <div className="col-span-1">Actions</div>}
      </div>

      {/* Asset Rows */}
      <div className="divide-y">
        {items.map((item) => {
          const metadata = formatMetadata(item.createdBy, item.createdAt);
          const isSelected = selectedItems.has(item.id);
          const isActiveVideo = activeVideoId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                "grid grid-cols-12 gap-4 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                isSelected && "bg-primary/5 border-primary/20"
              )}
              onClick={() => {
                if (selectMode) {
                  onSelect?.(item.id, !isSelected);
                } else {
                  onOpen?.(item.id);
                }
              }}
            >
              {/* Selection Checkbox */}
              {selectMode && (
                <div className="col-span-1 flex items-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect?.(item.id, checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Preview Thumbnail */}
              <div className={cn("flex items-center", selectMode ? "col-span-2" : "col-span-3")}>
                <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.isVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        className="w-full h-full object-cover"
                        poster={item.thumbnailUrl}
                        src={item.videoUrl}
                        muted
                        playsInline
                        preload="metadata"
                        onMouseEnter={() => handleVideoPlay(item.id)}
                        onMouseLeave={() => setActiveVideoId(null)}
                      />
                      {item.durationSec && (
                        <div className="absolute bottom-1 right-1">
                          <Badge className="text-xs bg-black/70 text-white border-0 px-1 py-0">
                            {formatDuration(item.durationSec)}
                          </Badge>
                        </div>
                      )}
                      {item.versionLabel && (
                        <div className="absolute top-1 left-1">
                          <Badge className="text-xs bg-black/60 text-white border-0 px-1 py-0">
                            {item.versionLabel}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={item.thumbnailUrl}
                        alt={`Preview of ${item.title}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {item.versionLabel && (
                        <div className="absolute top-1 left-1">
                          <Badge className="text-xs bg-black/60 text-white border-0 px-1 py-0">
                            {item.versionLabel}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Product */}
              <div className="col-span-3 flex flex-col justify-center min-w-0">
                <h3 
                  className="font-medium text-sm line-clamp-1 mb-1" 
                  title={item.title}
                >
                  {item.title}
                </h3>
                <p 
                  className="text-xs text-muted-foreground line-clamp-1" 
                  title={item.productName}
                >
                  {item.productName}
                </p>
              </div>

              {/* Stage */}
              <div className="col-span-2 flex items-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-1 font-medium",
                    getStageColors(item.stage)
                  )}
                >
                  {item.stage}
                </Badge>
              </div>

              {/* Performance Labels */}
              <div className="col-span-2 flex items-center">
                <div className="flex flex-wrap gap-1">
                  {item.performance.slice(0, 2).map((label) => (
                    <Badge
                      key={label}
                      variant="outline"
                      className={cn(
                        "text-xs px-1.5 py-0 h-5 font-medium",
                        getPerformanceColors(label)
                      )}
                    >
                      {label}
                    </Badge>
                  ))}
                  {item.performance.length > 2 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-1.5 py-0 h-5 bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                    >
                      +{item.performance.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Created Info */}
              <div className="col-span-2 flex items-center">
                {metadata && (
                  <p className="text-xs text-muted-foreground">
                    {metadata}
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              {showQuickActions && (
                <div className="col-span-1 flex items-center">
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpen?.(item.id); }}
                      className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center"
                      title="Preview"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMore?.(item.id); }}
                      className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center"
                      title="More actions"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};