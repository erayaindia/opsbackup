import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDuration } from '../utils/formatters';
import { useVideoManager } from '../contexts/VideoManagerContext';

interface YouTubeVideoPlayerProps {
  src: string;
  poster?: string;
  assetId: string;
  onError?: () => void;
}

export const YouTubeVideoPlayer: React.FC<YouTubeVideoPlayerProps> = ({
  src,
  poster,
  assetId,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [canPictureInPicture, setCanPictureInPicture] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [buffered, setBuffered] = useState(0);
  
  // UI state
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const videoManager = useVideoManager();

  // Auto-hide controls (YouTube-style: 3 seconds)
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying && !isDragging && !showVolumeSlider) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, isDragging, showVolumeSlider]);

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = isMuted;
    video.playbackRate = playbackRate;
    setCanPictureInPicture('pictureInPictureEnabled' in document);
    setHasError(false);
    
    videoManager.registerVideo(assetId, video);
    
    return () => {
      videoManager.unregisterVideo(assetId);
    };
  }, [assetId, volume, isMuted, playbackRate, videoManager]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      resetControlsTimeout();
    };
    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleRateChange = () => setPlaybackRate(video.playbackRate);
    const handleError = () => {
      setHasError(true);
      setIsBuffering(false);
      onError?.();
    };
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };
    const handleEnterpip = () => setIsPictureInPicture(true);
    const handleLeavepip = () => setIsPictureInPicture(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('error', handleError);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('enterpictureinpicture', handleEnterpip);
    video.addEventListener('leavepictureinpicture', handleLeavepip);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('error', handleError);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('enterpictureinpicture', handleEnterpip);
      video.removeEventListener('leavepictureinpicture', handleLeavepip);
    };
  }, [resetControlsTimeout, onError]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.05)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.05)]);
          break;
        case 'KeyM':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'KeyF':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            document.exitFullscreen();
          }
          break;
        case 'Digit0': e.preventDefault(); videoRef.current.currentTime = duration * 0; break;
        case 'Digit1': e.preventDefault(); videoRef.current.currentTime = duration * 0.1; break;
        case 'Digit2': e.preventDefault(); videoRef.current.currentTime = duration * 0.2; break;
        case 'Digit3': e.preventDefault(); videoRef.current.currentTime = duration * 0.3; break;
        case 'Digit4': e.preventDefault(); videoRef.current.currentTime = duration * 0.4; break;
        case 'Digit5': e.preventDefault(); videoRef.current.currentTime = duration * 0.5; break;
        case 'Digit6': e.preventDefault(); videoRef.current.currentTime = duration * 0.6; break;
        case 'Digit7': e.preventDefault(); videoRef.current.currentTime = duration * 0.7; break;
        case 'Digit8': e.preventDefault(); videoRef.current.currentTime = duration * 0.8; break;
        case 'Digit9': e.preventDefault(); videoRef.current.currentTime = duration * 0.9; break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [volume, duration, isPlaying, isFullscreen]);

  // Control handlers
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoManager.pauseAllExcept(assetId);
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
        setHasError(true);
      });
    }
  }, [isPlaying, videoManager, assetId]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = hoverX / rect.width;
    const time = percentage * duration;
    
    setHoverTime(time);
  };

  const handleVolumeChange = useCallback((value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted]);

  const handlePlaybackRateChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handlePictureInPicture = async () => {
    if (!videoRef.current) return;
    
    try {
      if (!isPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error('Picture-in-picture error:', error);
    }
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hoverProgress = duration > 0 ? (hoverTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group cursor-pointer"
      onMouseMove={resetControlsTimeout}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying && !isDragging && !showVolumeSlider) {
          setShowControls(false);
        }
        setShowVolumeSlider(false);
      }}
      onClick={handlePlayPause}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={src}
        poster={poster}
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Loading Spinner */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg mb-4">Video unavailable</p>
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setHasError(false);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Big Play Button (YouTube-style) */}
      {!isPlaying && !isBuffering && !hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          onClick={handlePlayPause}
        >
          <div className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-2xl">
            <svg className="w-8 h-8 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent transition-all duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div
            ref={progressBarRef}
            className="relative h-1 bg-white/30 rounded-full cursor-pointer group/progress hover:h-2 transition-all"
            onClick={handleProgressClick}
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => setIsHoveringProgress(false)}
            onMouseMove={handleProgressHover}
          >
            {/* Buffer Progress */}
            <div
              className="absolute inset-0 bg-white/50 rounded-full transition-all"
              style={{ width: `${buffered}%` }}
            />
            
            {/* Playback Progress */}
            <div
              className="absolute inset-0 bg-red-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            
            {/* Hover Preview */}
            {isHoveringProgress && (
              <div
                className="absolute top-0 w-1 h-full bg-red-400 rounded-full transition-all"
                style={{ left: `${hoverProgress}%` }}
              />
            )}
            
            {/* Progress Handle */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full transition-all transform",
                showControls ? "opacity-100 scale-100" : "opacity-0 scale-0"
              )}
              style={{ left: `${progress}%`, marginLeft: '-6px' }}
            />
          </div>
          
          {/* Hover Time Tooltip */}
          {isHoveringProgress && (
            <div
              className="absolute bottom-8 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded"
              style={{ left: `${hoverProgress}%` }}
            >
              {formatDuration(hoverTime)}
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between px-4 pb-4 text-white">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </Button>

            {/* Skip Buttons */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
              onClick={(e) => {
                e.stopPropagation();
                skipTime(-5);
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
              <span className="ml-1 text-xs">5</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
              onClick={(e) => {
                e.stopPropagation();
                skipTime(5);
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.01 19V15l5-5-5-5v4C8.7 9 6.01 11.69 6.01 15s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              </svg>
              <span className="ml-1 text-xs">5</span>
            </Button>

            {/* Volume Controls (YouTube-style) */}
            <div 
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMuteToggle();
                }}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </Button>
              
              {/* Volume Slider (YouTube-style vertical) */}
              <div
                className={cn(
                  "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 p-2 rounded transition-all duration-200",
                  showVolumeSlider ? "opacity-100 visible" : "opacity-0 invisible"
                )}
              >
                <div className="h-20 flex items-center justify-center">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.01}
                    orientation="vertical"
                    className="h-16"
                  />
                </div>
              </div>
            </div>

            {/* Time Display */}
            <span className="text-sm font-mono whitespace-nowrap">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 px-2 py-1 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {playbackRate}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <DropdownMenuItem
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={cn(playbackRate === rate && "bg-accent")}
                  >
                    {rate}x {rate === 1 && "(Normal)"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Picture-in-Picture */}
            {canPictureInPicture && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePictureInPicture();
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
                </svg>
              </Button>
            )}

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2"
              onClick={(e) => {
                e.stopPropagation();
                handleFullscreen();
              }}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};