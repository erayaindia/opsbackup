import { useEffect, useState, useRef } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageItem } from './MessageItem';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  reply_to: string | null;
  attachments: any;
  profiles: {
    name: string;
    avatar_url?: string;
  };
  reactions: Array<{
    id: string;
    emoji: string;
    user_id: string;
    profiles: {
      name: string;
    };
  }>;
  reply_message?: Message;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  created_by: string;
}

interface TeamChatMainProps {
  supabaseClient: any;
  currentUser: any;
  channelId: string;
}

export function TeamChatMain({ supabaseClient, currentUser, channelId }: TeamChatMainProps) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!supabaseClient || !channelId) return;

    const fetchChannel = async () => {
      const { data } = await supabaseClient
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();
      
      setChannel(data);
    };

    const fetchMessages = async () => {
      const { data } = await supabaseClient
        .from('messages')
        .select(`
          *,
          profiles (name, avatar_url),
          reactions (
            id,
            emoji,
            user_id,
            profiles (name)
          ),
          reply_message:messages!reply_to (
            id,
            content,
            user_id,
            profiles (name, avatar_url)
          )
        `)
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(50);

      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    };

    fetchChannel();
    fetchMessages();

    // Subscribe to new messages
    const messageSubscription = supabaseClient
      .channel(`messages-${channelId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          // Fetch the complete message with relations
          supabaseClient
            .from('messages')
            .select(`
              *,
              profiles (name, avatar_url),
              reactions (
                id,
                emoji,
                user_id,
                profiles (name)
              ),
              reply_message:messages!reply_to (
                id,
                content,
                user_id,
                profiles (name, avatar_url)
              )
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setMessages(prev => [...prev, data]);
                setTimeout(scrollToBottom, 100);
              }
            });
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions'
        },
        () => {
          // Refetch messages when reactions change
          fetchMessages();
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reactions'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(messageSubscription);
    };
  }, [supabaseClient, channelId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    
    try {
      const messageData = {
        channel_id: channelId,
        user_id: currentUser.user_id,
        content: newMessage.trim(),
        reply_to: replyingTo?.id || null,
      };

      await supabaseClient
        .from('messages')
        .insert(messageData);

      setNewMessage('');
      setReplyingTo(null);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // Check if user already reacted with this emoji
      const existingReaction = messages
        .find(m => m.id === messageId)
        ?.reactions?.find(r => r.emoji === emoji && r.user_id === currentUser.user_id);

      if (existingReaction) {
        // Remove reaction
        await supabaseClient
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Add reaction
        await supabaseClient
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: currentUser.user_id,
            emoji,
          });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  if (!channel) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8">
          <CardContent>
            <p className="text-muted-foreground">Loading channel...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <span className="text-muted-foreground">#</span>
            {channel.name}
          </h2>
          {channel.description && (
            <p className="text-sm text-muted-foreground">{channel.description}</p>
          )}
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            currentUser={currentUser}
            onReact={handleReaction}
            onReply={setReplyingTo}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Reply className="h-4 w-4" />
              <span>Replying to {replyingTo.profiles?.name}</span>
              <span className="text-xs">"{replyingTo.content.slice(0, 50)}..."</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="border-t px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${channel.name}`}
              disabled={isLoading}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button type="submit" disabled={isLoading || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}