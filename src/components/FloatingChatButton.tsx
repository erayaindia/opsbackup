import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FloatingChatButtonProps {
  unreadCount?: number;
  isOnline?: boolean;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ 
  unreadCount = 0, 
  isOnline = true 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [previousCount, setPreviousCount] = useState(unreadCount);

  // Hide the floating button when already on team chat page
  useEffect(() => {
    setIsVisible(!location.pathname.startsWith('/team-chat'));
  }, [location.pathname]);

  // Detect new messages for animation
  useEffect(() => {
    if (unreadCount > previousCount) {
      setHasNewMessage(true);
      // Reset animation after 3 seconds
      const timer = setTimeout(() => setHasNewMessage(false), 3000);
      return () => clearTimeout(timer);
    }
    setPreviousCount(unreadCount);
  }, [unreadCount, previousCount]);

  const handleClick = () => {
    navigate('/team-chat');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main Chat Button */}
      <div className="relative">
        <Button
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="h-14 w-14 p-0 rounded-full shadow-lg hover:shadow-xl bg-primary hover:bg-primary/90 border-2 border-white/20"
        >
          {/* Clean Modern Chat Icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
          >
            {/* Simple Chat Bubble */}
            <path
              d="M12 3C16.97 3 21 6.69 21 11.2S16.97 19.4 12 19.4C10.75 19.4 9.54 19.13 8.44 18.65L4 20L5.41 16.09C4.52 14.65 4 13.01 4 11.2C4 6.69 8.03 3 12 3Z"
              fill="white"
              fillOpacity="0.9"
            />
            
            {/* Message Icon Inside */}
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="8" y1="10" x2="16" y2="10" />
              <line x1="8" y1="13" x2="13" y2="13" />
            </g>
            
            {/* Small notification dot */}
            {unreadCount > 0 && (
              <circle
                cx="18"
                cy="6"
                r="3"
                fill="#ef4444"
                stroke="white"
                strokeWidth="1.5"
              />
            )}
          </svg>
        </Button>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-6 min-w-6 p-0 flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg bg-red-500"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}

        {/* Online Status Indicator */}
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        )}

      </div>

      {/* Simple Tooltip */}
      {isHovered && (
        <div className="absolute bottom-16 right-0 mb-2">
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap">
            {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Team Chat'}
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook to provide unread count and online status
export const useChatStatus = () => {
  const [unreadCount, setUnreadCount] = useState(3); // Mock data
  const [isOnline, setIsOnline] = useState(true);

  // In real app, this would fetch from your chat API/Supabase
  useEffect(() => {
    // Mock: Update unread count every few seconds
    const interval = setInterval(() => {
      setUnreadCount(Math.floor(Math.random() * 10));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return { unreadCount, isOnline };
};