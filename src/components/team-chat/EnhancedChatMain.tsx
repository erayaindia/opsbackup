import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { EnhancedMessageComposer } from './EnhancedMessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { useToast } from '@/hooks/use-toast';

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

interface Channel {
  id: string;
  name: string;
  description: string;
  created_by?: string;
}

interface User {
  user_id: string;
  name: string;
  avatar_url?: string;
  online?: boolean;
}

interface EnhancedChatMainProps {
  supabaseClient: any;
  currentUser: any;
}

export function EnhancedChatMain({ supabaseClient, currentUser }: EnhancedChatMainProps) {
  const { channelId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerValue, setComposerValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [channelMembers, setChannelMembers] = useState<User[]>([]);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!channelId || !currentUser?.user_id) return;

    console.log('Setting up EnhancedChatMain for channel:', channelId, 'user:', currentUser.user_id);
    fetchChannel();
    fetchChannelMembers();
    fetchMessages();
    const unsubscribe = subscribeToRealtime();
    const unsubscribeTyping = subscribeToTyping();

    return () => {
      unsubscribe();
      unsubscribeTyping();
    };
  }, [channelId, currentUser?.user_id]);

  const fetchChannel = async () => {
    if (!channelId) return;

    try {
      const { data: channelData, error } = await supabaseClient
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) {
        console.error('Error fetching channel:', error);
        return;
      }

      setChannel(channelData);
    } catch (error) {
      console.error('Error in fetchChannel:', error);
    }
  };

  const fetchChannelMembers = async () => {
    if (!channelId) return;

    try {
      const { data: membersData, error } = await supabaseClient
        .from('channel_members')
        .select(`
          user_id,
          profiles (
            name,
            avatar_url
          )
        `)
        .eq('channel_id', channelId);

      if (error) {
        console.error('Error fetching channel members:', error);
        return;
      }

      const members = membersData?.map((member: any) => ({
        user_id: member.user_id,
        name: member.profiles?.name || 'Unknown User',
        avatar_url: member.profiles?.avatar_url,
        online: Math.random() > 0.5 // Placeholder for now
      })) || [];

      setChannelMembers(members);
    } catch (error) {
      console.error('Error in fetchChannelMembers:', error);
    }
  };

  const fetchMessages = async () => {
    if (!channelId) return;

    try {
      setLoading(true);
      console.log('Fetching messages for channel:', channelId);
      
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw messagesError;
      }

      console.log('Raw messages data:', messagesData);

      if (!messagesData || messagesData.length === 0) {
        console.log('No messages found');
        setMessages([]);
        return;
      }

      // Get unique user IDs from messages
      const userIds = [...new Set(messagesData.map(msg => msg.user_id))].filter(Boolean);
      console.log('User IDs from messages:', userIds);

      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles data:', profilesData);

      // Create profile lookup
      const profilesMap = new Map();
      profilesData?.forEach((profile: any) => {
        profilesMap.set(profile.user_id, profile);
      });

      // Fetch reactions for all messages
      const messageIds = messagesData.map(msg => msg.id);
      const { data: reactionsData } = await supabaseClient
        .from('reactions')
        .select('*')
        .in('message_id', messageIds);

      // Fetch attachments for all messages
      const { data: attachmentsData } = await supabaseClient
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);

      // Combine data
      const processedMessages = messagesData.map((message: any) => ({
        ...message,
        profiles: profilesMap.get(message.user_id) || { name: 'Unknown User', avatar_url: null },
        reactions: reactionsData?.filter(r => r.message_id === message.id) || [],
        attachments: attachmentsData?.filter(a => a.message_id === message.id) || []
      }));

      console.log('Final processed messages:', processedMessages);
      setMessages(processedMessages);
      setHasNewMessages(true);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast({
        title: 'Error loading messages',
        description: 'Failed to load channel messages. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRealtime = () => {
    if (!channelId) return () => {};

    console.log('Setting up realtime subscription for channel:', channelId);

    const subscription = supabaseClient
      .channel(`enhanced-chat-${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload: any) => {
        console.log('Realtime message update:', payload);
        fetchMessages();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions'
      }, (payload: any) => {
        console.log('Realtime reaction update:', payload);
        fetchMessages();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_attachments'
      }, (payload: any) => {
        console.log('Realtime attachment update:', payload);
        fetchMessages();
      })
      .subscribe((status: string) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from realtime');
      subscription.unsubscribe();
    };
  };

  const subscribeToTyping = () => {
    if (!channelId) return () => {};

    const subscription = supabaseClient
      .channel(`typing-${channelId}`)
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        console.log('Typing event:', payload);
        if (payload.payload.user_id !== currentUser.user_id) {
          const typingUser = channelMembers.find(m => m.user_id === payload.payload.user_id);
          if (typingUser) {
            if (payload.payload.typing) {
              setTypingUsers(prev => {
                const filtered = prev.filter(u => u.user_id !== payload.payload.user_id);
                return [...filtered, typingUser];
              });
            } else {
              setTypingUsers(prev => prev.filter(u => u.user_id !== payload.payload.user_id));
            }
          }
        }
      })
      .subscribe((status: string) => {
        console.log('Typing subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from typing');
      subscription.unsubscribe();
    };
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;
    if (!currentUser?.user_id || !channelId) return;

    console.log('Sending message:', { content, channelId, userId: currentUser.user_id });

    try {
      const messageData = {
        content: content.trim(),
        channel_id: channelId,
        user_id: currentUser.user_id,
        supabase_user_id: currentUser.user_id,
        parent_message_id: replyingTo?.id || null,
      };

      console.log('Message data:', messageData);

      const { data: message, error } = await supabaseClient
        .from('messages')
        .insert(messageData)
        .select('id')
        .single();

      if (error) {
        console.error('Message insert error:', error);
        throw error;
      }

      console.log('Message inserted successfully:', message);

      // Handle file uploads if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${channelId}/${fileName}`;

          const { error: uploadError } = await supabaseClient.storage
            .from('chat-uploads')
            .upload(filePath, file);

          if (!uploadError) {
            await supabaseClient
              .from('message_attachments')
              .insert({
                message_id: message.id,
                file_path: filePath,
                file_name: file.name,
                mime_type: file.type,
                file_size: file.size,
              });
          }
        }
      }

      setReplyingTo(null);
      
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      await supabaseClient
        .from('messages')
        .update({ 
          content: content,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

      setEditingMessage(null);
      fetchMessages();
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await supabaseClient
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // Check if user already reacted with this emoji
      const { data: existingReaction } = await supabaseClient
        .from('reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', currentUser.user_id)
        .eq('emoji', emoji)
        .maybeSingle();

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
            supabase_user_id: currentUser.user_id,
            emoji: emoji,
          });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      if (message.is_pinned) {
        // Unpin message
        await supabaseClient
          .from('pinned_messages')
          .delete()
          .eq('message_id', messageId);
        
        await supabaseClient
          .from('messages')
          .update({ is_pinned: false })
          .eq('id', messageId);
      } else {
        // Pin message
        await supabaseClient
          .from('pinned_messages')
          .insert({
            message_id: messageId,
            channel_id: channelId,
            pinned_by: currentUser.user_id,
          });

        await supabaseClient
          .from('messages')
          .update({ is_pinned: true })
          .eq('id', messageId);
      }

      fetchMessages();
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  const handleTypingChange = useCallback((typing: boolean) => {
    // Broadcast typing status
    if (supabaseClient && channelId && currentUser) {
      supabaseClient
        .channel(`typing-${channelId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: currentUser.user_id,
            typing: typing,
            timestamp: Date.now()
          }
        });
    }
  }, [supabaseClient, channelId, currentUser]);

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

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Channel not found</h2>
          <p className="text-muted-foreground">
            The channel you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-gradient-to-b from-background/50 to-background">
      {/* Modern Chat Header with glass morphism */}
      <div className="sticky top-0 z-20 border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <ChatHeader
          channel={channel}
          memberCount={channelMembers.length}
          members={channelMembers}
          onSearch={(query) => console.log('Search:', query)}
          onShowPinned={() => console.log('Show pinned')}
          onInviteMembers={() => console.log('Invite members')}
        />
      </div>

      {/* Enhanced Messages List with custom scrollbar */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-1" 
           style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(148 163 184 / 0.3) transparent' }}>
        <div className="px-3 py-2">
          <MessageList
            ref={messageListRef}
            messages={messages}
            currentUser={currentUser}
            onReply={setReplyingTo}
            onEdit={setEditingMessage}
            onDelete={handleDeleteMessage}
            onReact={handleReaction}
            onPin={handlePinMessage}
            loading={loading}
            hasNewMessages={hasNewMessages}
          />
          
          {/* Enhanced Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="px-2 pb-2">
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl backdrop-blur-sm border border-border/20">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <TypingIndicator typingUsers={typingUsers} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="border-t border-border/30 bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-primary rounded-full"></div>
              <div className="text-sm">
                <div className="text-muted-foreground mb-1">
                  Replying to <span className="text-primary font-semibold">{replyingTo.profiles.name}</span>
                </div>
                <div className="text-xs text-muted-foreground/80 bg-muted/50 px-2 py-1 rounded-md inline-block max-w-md truncate">
                  "{replyingTo.content.slice(0, 50)}..."
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setReplyingTo(null)}
              className="h-7 px-3 bg-background/50 hover:bg-background border-border/50"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Floating Message Composer */}
      <div className="sticky bottom-0 border-t border-border/20 bg-background/95 backdrop-blur-xl p-4">
        <EnhancedMessageComposer
          value={composerValue}
          onChange={setComposerValue}
          onSend={handleSendMessage}
          onEdit={handleEditMessage}
          replyingTo={replyingTo}
          editingMessage={editingMessage}
          onCancelReply={() => setReplyingTo(null)}
          onCancelEdit={() => setEditingMessage(null)}
          placeholder={`Message #${channel.name}`}
          supabaseClient={supabaseClient}
          currentUser={currentUser}
          channelId={channelId!}
          onTypingChange={handleTypingChange}
        />
      </div>
    </div>
  );
}