import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  MoreHorizontal, 
  Reply, 
  Edit, 
  Trash2, 
  Pin,
  Smile,
  Copy,
  MessageSquare
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

interface MessageItemProps {
  message: Message;
  currentUser: any;
  isGrouped?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onPin?: (messageId: string) => void;
}

export function MessageItem({
  message,
  currentUser,
  isGrouped = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const isOwnMessage = message.user_id === currentUser?.user_id;
  const timestamp = new Date(message.created_at);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const formatFullDate = (date: Date) => {
    return format(date, 'MMMM d, yyyy \'at\' h:mm a');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <div
      className={cn(
        "group relative hover:bg-muted/30 rounded-lg transition-colors",
        isGrouped ? "py-1" : "py-2",
        "px-2"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={cn("flex-shrink-0", isGrouped ? "w-10" : "w-10")}>
          {!isGrouped && (
            <Avatar className="h-10 w-10">
              <AvatarImage src={message.profiles.avatar_url} />
              <AvatarFallback className="text-sm">
                {getInitials(message.profiles.name)}
              </AvatarFallback>
            </Avatar>
          )}
          {isGrouped && (
            <div className="h-5 flex items-center justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatTime(timestamp)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatFullDate(timestamp)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          {/* Header (name + timestamp) */}
          {!isGrouped && (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{message.profiles.name}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(timestamp)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatFullDate(timestamp)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {message.is_pinned && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Pin className="h-3 w-3" />
                  Pinned
                </Badge>
              )}
            </div>
          )}

          {/* Message text */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
            {message.edited_at && (
              <span className="text-xs text-muted-foreground ml-2">(edited)</span>
            )}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="p-2 border rounded-lg bg-muted/30">
                  <span className="text-sm">{attachment.file_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1 hover:bg-accent"
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
              >
                <Smile className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Quick reaction picker */}
          {showReactionPicker && (
            <div className="flex gap-1 mt-2 p-2 bg-popover border rounded-lg shadow-lg">
              {quickReactions.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent"
                  onClick={() => {
                    onReact?.(message.id, emoji);
                    setShowReactionPicker(false);
                  }}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="absolute right-2 top-1 flex items-center gap-1 bg-background border rounded-lg shadow-sm p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowReactionPicker(!showReactionPicker)}
            >
              <Smile className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onReply?.(message)}
            >
              <Reply className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyMessage}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy message
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onReply?.(message)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Reply in thread
                </DropdownMenuItem>

                {onPin && (
                  <DropdownMenuItem onClick={() => onPin(message.id)}>
                    <Pin className="mr-2 h-4 w-4" />
                    {message.is_pinned ? 'Unpin message' : 'Pin message'}
                  </DropdownMenuItem>
                )}

                {isOwnMessage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit?.(message)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit message
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(message.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete message
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}