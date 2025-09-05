import React, { useRef, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AssetCardProps, STAGE_COLORS, PERFORMANCE_COLORS } from "../types";
import { getAspectClass } from "../utils/aspect";
import { formatMetadata, formatDuration } from "../utils/formatters";
import { StageSelector, type StageOption } from "./StageSelector";
import { PerformanceSelector, type PerformanceOption } from "./PerformanceSelector";

/**
 * Frame.io-style AssetCard - Media-first card with hover overlays, scrub bar, and quick actions
 * Features exclusive video hover behavior, comment markers, and selection mode
 */
export const AssetCard: React.FC<AssetCardProps> = ({
  id,
  title,
  productName,
  stage,
  isVideo,
  thumbnailUrl,
  videoUrl,
  aspect = "16:9",
  performance,
  createdBy,
  createdAt,
  durationSec,
  commentMarkers = [],
  versionLabel,
  onOpen,
  onCopyLink,
  onDownload,
  onMore,
  onSelect,
  onDelete,
  onRename,
  onStageChange,
  onPerformanceChange,
  hoverScrubEnabled = false,
  showQuickActions = true,
  selectMode = false,
  selected = false,
  activeVideoId,
  onVideoPlay,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isActiveVideo = activeVideoId === id;

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Handle exclusive video playback
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isVideo && videoRef.current && !prefersReducedMotion) {
      onVideoPlay?.(id); // Notify parent to pause other videos
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Stop video if another video is playing
  useEffect(() => {
    if (isVideo && videoRef.current && activeVideoId && activeVideoId !== id) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsHovered(false);
    }
  }, [activeVideoId, id, isVideo]);

  // Update progress for scrub bar
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;
    const updateTime = () => setCurrentTime(video.currentTime);
    
    video.addEventListener('timeupdate', updateTime);
    return () => video.removeEventListener('timeupdate', updateTime);
  }, [isVideo]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (selectMode) {
        onSelect?.(id, !selected);
      } else {
        onOpen?.(id);
      }
    }
  };

  // Handle card click
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    if ((e.target as Element).closest('[data-action-button]')) return;
    
    if (selectMode) {
      onSelect?.(id, !selected);
    } else {
      onOpen?.(id);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(id, checked);
  };


  // Render comment markers on scrub bar
  const renderCommentMarkers = () => {
    if (!isVideo || !durationSec || commentMarkers.length === 0) return null;
    
    return commentMarkers.map((timeCode, index) => (
      <div
        key={index}
        className="absolute top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full border border-white shadow-sm"
        style={{ left: `${(timeCode / durationSec) * 100}%` }}
        title={`Comment at ${formatDuration(timeCode)}`}
      />
    ));
  };

  const metadata = formatMetadata(createdBy, createdAt);
  const progress = durationSec ? (currentTime / durationSec) * 100 : 0;

  return (
    <div
      className={cn(
        "group relative bg-card border border-border/50 rounded-xl overflow-hidden transition-all duration-300 ease-out flex flex-col min-h-[360px]",
        "hover:shadow-lg hover:shadow-black/5 hover:border-border hover:scale-[1.02] hover:-translate-y-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "active:scale-[0.98] active:transition-none",
        selectMode ? "cursor-pointer" : "cursor-pointer",
        selected && "ring-2 ring-primary bg-primary/5 shadow-md",
        isHovered && "shadow-lg shadow-black/10"
      )}
      tabIndex={0}
      role="button"
      aria-label={selectMode ? `Select ${title}` : `Open ${title}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      {selectMode && (
        <div className="absolute top-3 left-3 z-20">
          <Checkbox
            checked={selected}
            onCheckedChange={handleCheckboxChange}
            className="bg-white/90 backdrop-blur-sm shadow-sm"
            data-action-button
          />
        </div>
      )}

      {/* Media Container - 65% height */}
      <div className="relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted flex-[0.65] min-h-0 rounded-t-xl"
           style={{ aspectRatio: aspect === "16:9" ? "16/9" : aspect === "9:16" ? "9/16" : aspect === "1:1" ? "1/1" : "4/5" }}>
        {isVideo ? (
          <>
            {/* Show video thumbnail - plays on hover */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              src={videoUrl}
              muted
              playsInline
              preload="metadata"
              controls={false}
              loop
              style={{ 
                backgroundColor: 'transparent',
                outline: 'none',
                pointerEvents: 'none'
              }}
              poster=""
            />
            {/* Fallback for when video fails to load */}
            <div className={cn(
              "absolute inset-0 w-full h-full bg-gradient-to-br from-muted/20 to-muted/80 flex items-center justify-center",
              "opacity-0 transition-opacity duration-200"
            )}>
              <div className="flex flex-col items-center gap-3">
                <svg className="w-12 h-12 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-muted-foreground/60 font-medium">Video</span>
              </div>
            </div>
          </>
        ) : (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
        
        {/* Bottom gradient overlay for text legibility on hover */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent",
            "transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Scrub bar (for videos only) */}
        {isVideo && durationSec && (
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-1 bg-black/20 transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Progress indicator */}
            <div
              className={cn(
                "h-full bg-white transition-all duration-100",
                prefersReducedMotion && "transition-none"
              )}
              style={{ width: `${progress}%` }}
            />
            {/* Comment markers */}
            {renderCommentMarkers()}
          </div>
        )}

        {/* Top-left: Version chip */}
        {versionLabel && (
          <div className="absolute top-3 left-3">
            <Badge className="text-xs font-medium bg-black/60 text-white border-0 backdrop-blur-sm">
              {versionLabel}
            </Badge>
          </div>
        )}

        {/* Bottom-left: Duration badge */}
        {isVideo && durationSec && (
          <div
            className={cn(
              "absolute bottom-2 left-2 transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-80"
            )}
          >
            <Badge className="text-xs font-medium bg-black/70 text-white border-0 backdrop-blur-sm">
              {formatDuration(durationSec)}
            </Badge>
          </div>
        )}

      </div>

      {/* Text Block - 35% height with better organization */}
      <div className="flex-[0.35] p-4 flex flex-col min-h-0 bg-card">
        {/* Content organized in clear sections */}
        <div className="flex flex-col h-full">
          
          {/* Header: Title with actions */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 
              className="font-semibold text-sm leading-tight line-clamp-1 flex-1 text-foreground group-hover:text-primary transition-colors" 
              title={title}
            >
              {title}
            </h3>
            {showQuickActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-action-button
                    className="w-7 h-7 rounded-md bg-muted/70 hover:bg-muted hover:scale-105 transition-all duration-200 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="More options"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload?.(id); }}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyLink?.(id); }}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(id, title); }}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Middle: Controls section - Stage and Performance on same line */}
          <div className="flex flex-col gap-2.5 flex-1">
            <div className="flex items-center justify-between gap-2">
              {/* Performance selector on left */}
              <div className="flex-1 min-w-0">
                <PerformanceSelector
                  currentPerformance={performance as PerformanceOption[]}
                  onPerformanceChange={(newPerformance) => onPerformanceChange?.(id, newPerformance)}
                  disabled={selectMode}
                  maxVisible={2}
                />
              </div>
              
              {/* Stage selector on right */}
              <div className="flex-shrink-0">
                <StageSelector
                  currentStage={stage as StageOption}
                  onStageChange={(newStage) => onStageChange?.(id, newStage)}
                  disabled={selectMode}
                />
              </div>
            </div>
          </div>

          {/* Footer: Metadata */}
          {metadata && (
            <div className="mt-auto pt-2 border-t border-border/10">
              <p className="text-xs text-muted-foreground truncate">
                {metadata}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};