import { useEffect, useState } from 'react';
import { Plus, Hash, Users } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateChannelDialog } from './CreateChannelDialog';

interface Channel {
  id: string;
  name: string;
  description: string;
  created_by: string;
  unread_count?: number;
}

interface TeamChatSidebarProps {
  supabaseClient: any;
  currentUser: any;
  selectedChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
}

export function TeamChatSidebar({ 
  supabaseClient, 
  currentUser, 
  selectedChannelId, 
  onChannelSelect 
}: TeamChatSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!supabaseClient) return;

    const fetchChannels = async () => {
      const { data: channelsData } = await supabaseClient
        .from('channels')
        .select(`
          id,
          name,
          description,
          created_by,
          channel_members!inner(
            user_id,
            last_read_at
          )
        `)
        .eq('channel_members.user_id', currentUser.user_id)
        .order('name');

      if (channelsData) {
        // Calculate unread counts
        const channelsWithUnread = await Promise.all(
          channelsData.map(async (channel) => {
            const member = channel.channel_members?.[0];
            if (!member?.last_read_at) return { ...channel, unread_count: 0 };

            const { count } = await supabaseClient
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('channel_id', channel.id)
              .gt('created_at', member.last_read_at)
              .is('deleted_at', null);

            return { ...channel, unread_count: count || 0 };
          })
        );

        setChannels(channelsWithUnread);
      }
    };

    fetchChannels();

    // Subscribe to channel changes
    const channelSubscription = supabaseClient
      .channel('channels-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'channels' },
        fetchChannels
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'channel_members' },
        fetchChannels
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channelSubscription);
    };
  }, [supabaseClient, currentUser.user_id]);

  const handleChannelSelect = async (channelId: string) => {
    onChannelSelect(channelId);
    
    // Update last_read_at when selecting a channel
    await supabaseClient
      .from('channel_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('channel_id', channelId)
      .eq('user_id', currentUser.user_id);
  };

  return (
    <>
      <Sidebar className={collapsed ? "w-14" : "w-64"}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              {!collapsed && (
                <>
                  <span>Channels</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </SidebarGroupLabel>
            
            <SidebarGroupContent>
              <SidebarMenu>
                {channels.map((channel) => (
                  <SidebarMenuItem key={channel.id}>
                    <SidebarMenuButton 
                      asChild
                      isActive={selectedChannelId === channel.id}
                    >
                      <button
                        onClick={() => handleChannelSelect(channel.id)}
                        className="w-full flex items-center gap-2 justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          {!collapsed && <span>{channel.name}</span>}
                        </div>
                        {!collapsed && channel.unread_count > 0 && (
                          <Badge variant="destructive" className="h-5 text-xs px-1.5">
                            {channel.unread_count}
                          </Badge>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <CreateChannelDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        supabaseClient={supabaseClient}
        currentUser={currentUser}
      />
    </>
  );
}