import React, { useEffect, useRef, forwardRef } from 'react';
import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { MessageItem } from './MessageItem';
import { Separator } from '@/components/ui/separator';

interface Message {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  reply_to: string | null;
  attachments: any[];
  profiles: {
    name: string;
    avatar_url?: string;
  };
  reactions: any[];
  parent_message_id?: string;
  edited_at?: string;
  is_pinned?: boolean;
}

interface MessageListProps {
  messages: Message[];
  currentUser: any;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onPin?: (messageId: string) => void;
  loading?: boolean;
  hasNewMessages?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(({
  messages,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  loading = false,
  hasNewMessages = false
}, ref) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  };

  useEffect(() => {
    if (hasNewMessages) {
      scrollToBottom(true);
    }
  }, [messages.length, hasNewMessages]);

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [messages.length > 0 && !loading]);

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE'); // Monday, Tuesday, etc.
    if (isThisYear(date)) return format(date, 'MMMM d'); // January 15
    return format(date, 'MMMM d, yyyy'); // January 15, 2023
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const shouldGroupWithPrevious = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return false;
    
    const currentTime = new Date(currentMessage.created_at);
    const previousTime = new Date(previousMessage.created_at);
    const timeDiff = currentTime.getTime() - previousTime.getTime();
    
    // Group if same user and within 5 minutes
    return (
      currentMessage.user_id === previousMessage.user_id &&
      timeDiff < 5 * 60 * 1000 // 5 minutes
    );
  };

  const messageGroups = groupMessagesByDate(messages);
  const sortedDates = Object.keys(messageGroups).sort();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p className="text-sm text-muted-foreground">
            Be the first to send a message in this channel!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-2 space-y-3" ref={scrollAreaRef}>
      <div ref={ref} className="space-y-1">
        {sortedDates.map(dateKey => {
          const dateMessages = messageGroups[dateKey];
          const date = new Date(dateKey);
          
          return (
            <div key={dateKey}>
              {/* Date divider */}
              <div className="flex items-center gap-4 my-6">
                <Separator className="flex-1" />
                <div className="bg-background px-3 py-1 rounded-full border text-xs font-medium text-muted-foreground">
                  {formatDateLabel(date)}
                </div>
                <Separator className="flex-1" />
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const previousMessage = index > 0 ? dateMessages[index - 1] : null;
                const isGrouped = shouldGroupWithPrevious(message, previousMessage);
                
                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    currentUser={currentUser}
                    isGrouped={isGrouped}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReact={onReact}
                    onPin={onPin}
                  />
                );
              })}
            </div>
          );
        })}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';