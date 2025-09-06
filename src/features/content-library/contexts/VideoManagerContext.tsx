import React, { createContext, useContext, useRef, useCallback } from 'react';

interface VideoManagerContextType {
  registerVideo: (id: string, videoElement: HTMLVideoElement) => void;
  unregisterVideo: (id: string) => void;
  pauseAllExcept: (activeId: string) => void;
}

const VideoManagerContext = createContext<VideoManagerContextType | null>(null);

export const VideoManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const registerVideo = useCallback((id: string, videoElement: HTMLVideoElement) => {
    videosRef.current.set(id, videoElement);
  }, []);

  const unregisterVideo = useCallback((id: string) => {
    videosRef.current.delete(id);
  }, []);

  const pauseAllExcept = useCallback((activeId: string) => {
    videosRef.current.forEach((video, id) => {
      if (id !== activeId && !video.paused) {
        video.pause();
      }
    });
  }, []);

  return (
    <VideoManagerContext.Provider value={{ registerVideo, unregisterVideo, pauseAllExcept }}>
      {children}
    </VideoManagerContext.Provider>
  );
};

export const useVideoManager = () => {
  const context = useContext(VideoManagerContext);
  if (!context) {
    throw new Error('useVideoManager must be used within a VideoManagerProvider');
  }
  return context;
};