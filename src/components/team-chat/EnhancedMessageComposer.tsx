import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Smile, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  profiles: {
    name: string;
  };
}

interface EnhancedMessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string, attachments?: File[]) => void;
  onEdit?: (messageId: string, content: string) => void;
  replyingTo?: Message | null;
  editingMessage?: Message | null;
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
  placeholder?: string;
  supabaseClient: any;
  currentUser: any;
  channelId: string;
  onTypingChange?: (isTyping: boolean) => void;
}

export function EnhancedMessageComposer({
  value,
  onChange,
  onSend,
  onEdit,
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  placeholder = "Type a message...",
  supabaseClient,
  currentUser,
  channelId,
  onTypingChange
}: EnhancedMessageComposerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max height ~6 lines
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  useEffect(() => {
    if (editingMessage) {
      onChange(editingMessage.content);
    }
  }, [editingMessage, onChange]);

  useEffect(() => {
    // Auto-focus textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Typing indicator logic
  const handleTypingStart = useCallback(() => {
    if (!isTyping && onTypingChange) {
      setIsTyping(true);
      onTypingChange(true);
      
      // Broadcast typing status
      if (supabaseClient && channelId && currentUser) {
        supabaseClient
          .channel(`typing-${channelId}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              user_id: currentUser.user_id,
              typing: true,
              timestamp: Date.now()
            }
          });
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  }, [isTyping, onTypingChange, supabaseClient, channelId, currentUser]);

  const handleTypingStop = useCallback(() => {
    if (isTyping && onTypingChange) {
      setIsTyping(false);
      onTypingChange(false);
      
      // Broadcast stop typing
      if (supabaseClient && channelId && currentUser) {
        supabaseClient
          .channel(`typing-${channelId}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              user_id: currentUser.user_id,
              typing: false,
              timestamp: Date.now()
            }
          });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [isTyping, onTypingChange, supabaseClient, channelId, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() && attachments.length === 0) return;

    handleTypingStop();

    if (editingMessage && onEdit) {
      onEdit(editingMessage.id, value);
      onChange('');
      onCancelEdit?.();
    } else {
      onSend(value, attachments);
      onChange('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    if (validFiles.length !== files.length) {
      toast({
        title: 'File size limit',
        description: 'Some files were skipped. Maximum file size is 10MB.',
        variant: 'destructive',
      });
    }

    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      handleTypingStop();
    };
  }, [handleTypingStop]);

  return (
    <div className="bg-transparent">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 pt-3">
          <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Replying to {replyingTo.profiles.name}</span>
                <span className="text-muted-foreground truncate max-w-xs">
                  {replyingTo.content}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit indicator */}
      {editingMessage && (
        <div className="px-4 pt-3">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Editing message</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3">
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modern Floating Message Input */}
      <div className="px-1">
        <form onSubmit={handleSubmit} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "resize-none min-h-[52px] max-h-[120px] pr-24 pl-4 py-3 border-0 bg-transparent transition-all duration-200 rounded-2xl",
                "focus:ring-0 focus:border-0 placeholder:text-muted-foreground/60 text-[15px] leading-relaxed",
                "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              )}
              rows={1}
            />
            
            {/* Modern Action Buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110"
                  title="Add emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-8 right-0 z-50">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modern Send Button - appears when there's content */}
          {(value.trim() || attachments.length > 0) && (
            <div className="absolute right-3 bottom-3">
              <Button
                type="submit"
                disabled={isUploading}
                size="sm"
                className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 animate-in slide-in-from-right-2 fade-in"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </form>

        {/* Enhanced Helper Text */}
        <div className="flex justify-center mt-3 text-xs text-muted-foreground/60">
          <div className="flex items-center gap-4 bg-muted/20 px-3 py-1.5 rounded-full">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd> Send
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⇧↵</kbd> New line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}