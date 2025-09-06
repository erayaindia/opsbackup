import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadCardData, STAGE_COLORS } from "../types";
import { getAspectClass } from "../utils/aspect";
import { formatFileSize } from "../utils/upload";

interface UploadCardProps extends UploadCardData {
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
}

/**
 * UploadCard - Temporary card shown during upload process
 * Displays upload progress and handles error states
 */
export const UploadCard: React.FC<UploadCardProps> = ({
  id,
  displayId,
  title,
  productName,
  stage,
  isVideo,
  thumbnailUrl,
  aspect = "16:9",
  isUploading,
  uploadProgress = 0,
  uploadError,
  onRetry,
  onCancel,
  ...rest
}) => {
  const getStageColors = (stage: keyof typeof STAGE_COLORS) => {
    const colors = STAGE_COLORS[stage];
    if (!colors) {
      console.warn(`Unknown stage: ${stage}. Using default colors.`);
      return "bg-muted text-muted-foreground border-muted-foreground/20";
    }
    return `${colors.light} ${colors.dark}`;
  };

  return (
    <div
      className={cn(
        "group relative bg-card border rounded-2xl overflow-hidden transition-all duration-200 ease-smooth flex flex-col min-h-[280px]",
        uploadError ? "border-destructive/50 bg-destructive/5" : "border-border",
        isUploading && "animate-pulse"
      )}
    >
      {/* Media Container - 60% height */}
      <div 
        className="relative overflow-hidden bg-muted flex-[0.6] min-h-0"
        style={{ aspectRatio: aspect === "16:9" ? "16/9" : aspect === "9:16" ? "9/16" : aspect === "1:1" ? "1/1" : "4/5" }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Preview of ${title}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isVideo ? (
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white/90 rounded-lg px-3 py-2 text-center backdrop-blur-sm">
              <div className="text-xs font-medium text-foreground mb-1">
                Uploading...
              </div>
              <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {uploadProgress}%
              </div>
            </div>
          </div>
        )}

        {/* Error State Overlay */}
        {uploadError && (
          <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
            <div className="bg-destructive text-destructive-foreground rounded-lg px-3 py-2 text-center">
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs font-medium">
                Upload Failed
              </div>
            </div>
          </div>
        )}

        {/* File Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge className="text-xs bg-black/60 text-white border-0 backdrop-blur-sm">
            {isVideo ? 'VIDEO' : 'IMAGE'}
          </Badge>
        </div>

        {/* Cancel Button */}
        {(isUploading || uploadError) && onCancel && (
          <button
            onClick={() => onCancel(id)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/70 backdrop-blur-sm transition-colors flex items-center justify-center"
            title="Cancel upload"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Text Block - 40% height */}
      <div className="flex-[0.4] p-3 flex flex-col justify-between min-h-0">
        {/* Top Section: Title and Product+Stage */}
        <div className="space-y-1">
          {/* Title */}
          <h3 
            className="font-bold text-sm leading-tight line-clamp-1" 
            title={`${displayId ? `#${displayId} - ` : ''}${title}`}
          >
            {displayId && (
              <span className="text-muted-foreground font-normal mr-1.5">
                #{displayId}
              </span>
            )}
            {title}
          </h3>

          {/* Product + Stage */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground line-clamp-1 flex-1" title={productName}>
              {productName}
            </p>
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-2 py-0.5 font-medium flex-shrink-0",
                getStageColors(stage)
              )}
            >
              {stage}
            </Badge>
          </div>
        </div>

        {/* Bottom Section: Status and Actions */}
        <div className="space-y-1">
          {/* Upload Status */}
          {isUploading ? (
            <p className="text-xs text-primary">
              Uploading... {uploadProgress}%
            </p>
          ) : uploadError ? (
            <div className="space-y-1">
              <p className="text-xs text-destructive">
                {uploadError}
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetry(id)}
                  className="text-xs h-6 px-2"
                >
                  Retry Upload
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Processing...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};