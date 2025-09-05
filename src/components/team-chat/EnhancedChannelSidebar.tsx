import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Hash, Users, MoreVertical, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreateChannelDialog } from './CreateChannelDialog';
import { ChannelContextMenu } from './ChannelContextMenu';
import { Input } from '@/components/ui/input';

interface Channel {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: string;
    user_name: string;
  };
  online_members?: number;
}

interface EnhancedChannelSidebarProps {
  supabaseClient: any;
  currentUser: any;
  onChannelSelect?: (channelId: string) => void;
}

export function EnhancedChannelSidebar({ supabaseClient, currentUser }: EnhancedChannelSidebarProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { channelId } = useParams();

  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting up channel sidebar for user:', currentUser.user_id);
    fetchChannels();
    
    const unsubscribe = subscribeToChannels();
    
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const fetchChannels = async () => {
    try {
      console.log('Fetching channels for user:', currentUser.user_id);
      
      const { data: channelMembers, error } = await supabaseClient
        .from('channel_members')
        .select(`
          channel_id,
          channels (
            id,
            name,
            description,
            created_by
          )
        `)
        .eq('user_id', currentUser.user_id);

      if (error) {
        console.error('Error fetching channel members:', error);
        throw error;
      }

      console.log('Channel members data:', channelMembers);

      if (channelMembers) {
        const channelData = channelMembers.map((member: any) => member.channels).filter(Boolean);
        console.log('Extracted channels:', channelData);
        
        // Get unread counts and last messages for each channel
        const channelsWithMetadata = await Promise.all(
          channelData.map(async (channel: any) => {
            const { data: lastRead } = await supabaseClient
              .from('message_reads')
              .select('read_at')
              .eq('channel_id', channel.id)
              .eq('user_id', currentUser.user_id)
              .order('read_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const { data: messages } = await supabaseClient
              .from('messages')
              .select('id, content, created_at, supabase_user_id')
              .eq('channel_id', channel.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(10);

            // Get profile data for the last message
            let lastMessage = undefined;
            if (messages && messages.length > 0) {
              const { data: profile } = await supabaseClient
                .from('profiles')
                .select('name')
                .eq('user_id', messages[0].supabase_user_id)
                .single();

              lastMessage = {
                content: messages[0].content,
                created_at: messages[0].created_at,
                user_name: profile?.name || 'Unknown'
              };
            }

            const unreadCount = lastRead 
              ? messages?.filter(msg => new Date(msg.created_at) > new Date(lastRead.read_at)).length || 0
              : messages?.length || 0;

            return {
              ...channel,
              unread_count: unreadCount,
              last_message: lastMessage,
              online_members: Math.floor(Math.random() * 5) + 1 // Placeholder for now
            };
          })
        );

        console.log('Channels with metadata:', channelsWithMetadata);
        setChannels(channelsWithMetadata);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChannels = () => {
    console.log('Setting up channel realtime subscription');
    
    const subscription = supabaseClient
      .channel('channel-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channels'
      }, (payload: any) => {
        console.log('Realtime channel update:', payload);
        setTimeout(fetchChannels, 100);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload: any) => {
        console.log('Realtime message update for channels:', payload);
        setTimeout(fetchChannels, 100);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_members'
      }, (payload: any) => {
        console.log('Realtime channel member update:', payload);
        setTimeout(fetchChannels, 100);
      })
      .subscribe((status: string) => {
        console.log('Channel subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from channel updates');
      subscription.unsubscribe();
    };
  };

  const handleChannelSelect = async (selectedChannelId: string) => {
    navigate(`/team-chat/${selectedChannelId}`);
    
    // Mark messages as read when selecting channel
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('id')
      .eq('channel_id', selectedChannelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (messages && messages.length > 0) {
      await supabaseClient
        .from('message_reads')
        .upsert({
          message_id: messages[0].id,
          user_id: currentUser.user_id,
          channel_id: selectedChannelId,
          read_at: new Date().toISOString()
        });
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-background/95">
        <div className="p-4 space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Modern Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                <div className="text-primary-foreground text-sm font-bold">💬</div>
              </div>
              <h2 className="text-lg font-semibold text-foreground">Channels</h2>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="h-8 w-8 p-0 bg-primary/10 hover:bg-primary/20 border-0 transition-all duration-200 hover:scale-110"
            >
              <Plus className="h-4 w-4 text-primary" />
            </Button>
          </div>
          
          {/* Enhanced Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/30 border-border/40 focus:bg-background/90 transition-all duration-200 focus:scale-[1.02]"
            />
          </div>
        </div>
        
        <div className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-2">
              {filteredChannels.map((channel) => (
                <div key={channel.id}>
                  <ChannelContextMenu
                    channel={channel}
                    currentUser={currentUser}
                    supabaseClient={supabaseClient}
                    onChannelUpdate={fetchChannels}
                  >
                    <div
                      onClick={() => handleChannelSelect(channel.id)}
                      className={`w-full p-3 h-auto hover:bg-primary/5 hover:shadow-sm transition-all duration-200 cursor-pointer flex items-start gap-3 rounded-xl group ${
                        channelId === channel.id 
                          ? 'bg-primary/10 text-foreground shadow-sm border border-primary/20' 
                          : 'hover:border border-transparent'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          channelId === channel.id 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          <Hash className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium text-sm truncate ${
                            channelId === channel.id ? 'text-foreground' : 'text-foreground group-hover:text-foreground'
                          }`}>
                            {channel.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {channel.online_members && (
                              <div className="flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs text-green-700 font-medium">
                                  {channel.online_members}
                                </span>
                              </div>
                            )}
                            {channel.unread_count && channel.unread_count > 0 && (
                              <div className="h-5 min-w-[20px] px-1.5 bg-primary rounded-full flex items-center justify-center animate-bounce">
                                <span className="text-xs font-bold text-primary-foreground">
                                  {channel.unread_count > 99 ? '99+' : channel.unread_count}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {channel.last_message && (
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground truncate">
                              <span className="font-medium">
                                {channel.last_message.user_name}:
                              </span>{' '}
                              {channel.last_message.content}
                            </p>
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                              {formatLastMessageTime(channel.last_message.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </ChannelContextMenu>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        supabaseClient={supabaseClient}
        currentUser={currentUser}
      />
    </>
  );
}