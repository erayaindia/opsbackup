import React, { useState, useEffect } from 'react';
import { Pin, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface PinnedMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    avatar_url?: string;
  };
  pinned_messages: {
    pinned_at: string;
    pinned_by: string;
  }[];
}

interface PinnedMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  supabaseClient: any;
  onUnpin: (messageId: string) => void;
}

export function PinnedMessagesDialog({
  open,
  onOpenChange,
  channelId,
  supabaseClient,
  onUnpin
}: PinnedMessagesDialogProps) {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPinnedMessages();
    }
  }, [open, channelId]);

  const fetchPinnedMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles!inner(name, avatar_url),
          pinned_messages!inner(pinned_at, pinned_by)
        `)
        .eq('channel_id', channelId)
        .eq('is_pinned', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPinnedMessages(data || []);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      setPinnedMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (messageId: string) => {
    await onUnpin(messageId);
    fetchPinnedMessages(); // Refresh the list
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5" />
            Pinned Messages
            {pinnedMessages.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({pinnedMessages.length})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : pinnedMessages.length > 0 ? (
            <div className="space-y-4">
              {pinnedMessages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-3 p-4 rounded-lg border bg-accent/20 border-l-4 border-primary"
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
                      <Pin className="h-3 w-3 text-primary" />
                    </div>
                    
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {message.pinned_messages[0] && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Pinned {formatDistanceToNow(new Date(message.pinned_messages[0].pinned_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnpin(message.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Pin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pinned messages in this channel</p>
              <p className="text-sm mt-1">Pin important messages to keep them handy</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}