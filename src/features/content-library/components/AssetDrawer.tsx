import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AssetCardData } from "../types";
import { StageSelector, type StageOption } from "./StageSelector";
import { PerformanceSelector, type PerformanceOption } from "./PerformanceSelector";
import { formatMetadata } from "../utils/formatters";
import { YouTubeVideoPlayer } from "./YouTubeVideoPlayer";

interface AssetDrawerProps {
  asset: AssetCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStageChange?: (id: string, stage: StageOption) => Promise<void>;
  onPerformanceChange?: (id: string, performance: PerformanceOption[]) => Promise<void>;
  onDownload?: (id: string) => void;
  onCopyLink?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, currentName: string) => void;
}

export const AssetDrawer: React.FC<AssetDrawerProps> = ({
  asset,
  open,
  onOpenChange,
  onStageChange,
  onPerformanceChange,
  onDownload,
  onCopyLink,
  onDelete,
  onRename,
}) => {
  const [hasVideoError, setHasVideoError] = useState(false);

  // Reset video error state when asset changes
  useEffect(() => {
    if (asset) {
      setHasVideoError(false);
    }
  }, [asset]);

  if (!asset) return null;

  const metadata = formatMetadata(asset.createdBy, asset.createdAt);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-left truncate">{asset.title}</SheetTitle>
                <SheetDescription className="text-left">
                  {asset.productName}
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                {asset.versionLabel && (
                  <Badge variant="outline" className="text-xs">
                    {asset.versionLabel}
                  </Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Media Container */}
          <div className="flex-1 bg-black relative overflow-hidden">
            {asset.isVideo ? (
              <YouTubeVideoPlayer
                src={asset.videoUrl || ''}
                poster={asset.thumbnailUrl}
                assetId={asset.id}
                onError={() => setHasVideoError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.title}
                  className="max-w-full max-h-full object-contain"
                  onError={() => setHasVideoError(true)}
                />
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="border-t bg-card">
            <div className="px-6 py-4 space-y-4">
              {/* Stage and Performance Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Performance
                  </label>
                  <PerformanceSelector
                    currentPerformance={asset.performance as PerformanceOption[]}
                    onPerformanceChange={(newPerformance) => 
                      onPerformanceChange?.(asset.id, newPerformance)
                    }
                    maxVisible={3}
                  />
                </div>
                <div className="flex-shrink-0">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Stage
                  </label>
                  <StageSelector
                    currentStage={asset.stage as StageOption}
                    onStageChange={(newStage) => onStageChange?.(asset.id, newStage)}
                  />
                </div>
              </div>

              {/* Metadata */}
              {metadata && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">{metadata}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload?.(asset.id)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyLink?.(asset.id)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRename?.(asset.id, asset.title)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Rename
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete?.(asset.id)}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};