import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Reply, Edit2, Trash2, Pin, MoreVertical, File, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmojiPicker } from './EmojiPicker';

interface Message {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  edited_at?: string;
  user_id: string;
  channel_id: string;
  parent_message_id?: string;
  is_pinned: boolean;
  profiles: {
    name: string;
    avatar_url?: string;
  };
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
  }>;
}

interface EnhancedMessageItemProps {
  message: Message;
  currentUser: any;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  supabaseClient: any;
}

export function EnhancedMessageItem({
  message,
  currentUser,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  onPin,
  supabaseClient
}: EnhancedMessageItemProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isOwnMessage = message.user_id === currentUser.user_id;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadAttachment = async (attachment: any) => {
    try {
      const { data, error } = await supabaseClient.storage
        .from('chat-uploads')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onReaction(message.id, emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div
      className={`group flex gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors ${
        message.is_pinned ? 'bg-accent/20 border-l-4 border-primary' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={message.profiles.avatar_url} />
        <AvatarFallback>
          {message.profiles.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{message.profiles.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.edited_at && (
            <Badge variant="outline" className="text-xs">
              edited
            </Badge>
          )}
          {message.is_pinned && (
            <Pin className="h-3 w-3 text-primary" />
          )}
        </div>

        {/* Message Content */}
        <div className="text-sm text-foreground whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg border"
              >
                <File className="h-6 w-6 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadAttachment(attachment)}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction: any) => (
              <Button
                key={reaction.emoji}
                variant="outline"
                size="sm"
                className={`h-6 px-2 text-xs ${
                  reaction.users.includes(currentUser.user_id)
                    ? 'bg-primary/10 border-primary'
                    : ''
                }`}
                onClick={() => onReaction(message.id, reaction.emoji)}
              >
                {reaction.emoji} {reaction.count}
              </Button>
            ))}
          </div>
        )}

        {/* Quick Actions (shown on hover) */}
        {isHovered && (
          <div className="absolute right-4 top-2 flex items-center gap-1 bg-background border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="h-7 w-7 p-0"
              >
                😊
              </Button>
              {showEmojiPicker && (
                <div className="absolute top-8 right-0 z-10">
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(message)}
              className="h-7 w-7 p-0"
            >
              <Reply className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPin(message.id)}>
                  <Pin className="mr-2 h-4 w-4" />
                  {message.is_pinned ? 'Unpin' : 'Pin'} Message
                </DropdownMenuItem>
                {isOwnMessage && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(message)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Message
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(message.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Message
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