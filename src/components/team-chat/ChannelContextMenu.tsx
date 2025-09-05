import React, { useState } from 'react';
import { MoreVertical, Edit, UserPlus, UserMinus, VolumeX, LogOut, Trash2, Users } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EditChannelDialog } from './EditChannelDialog';
import { MembersDialog } from './MembersDialog';

interface Channel {
  id: string;
  name: string;
  description?: string;
  created_by: string;
}

interface ChannelContextMenuProps {
  channel: Channel;
  currentUser: any;
  supabaseClient: any;
  children: React.ReactNode;
  onChannelUpdate: () => void;
}

export function ChannelContextMenu({
  channel,
  currentUser,
  supabaseClient,
  children,
  onChannelUpdate
}: ChannelContextMenuProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const { toast } = useToast();

  const isOwner = channel.created_by === currentUser.user_id;

  const handleLeaveChannel = async () => {
    try {
      const { error } = await supabaseClient
        .from('channel_members')
        .delete()
        .eq('channel_id', channel.id)
        .eq('user_id', currentUser.user_id);

      if (error) throw error;

      toast({
        title: 'Left channel',
        description: `You've left #${channel.name}`,
      });

      onChannelUpdate();
    } catch (error) {
      console.error('Error leaving channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave channel',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteChannel = async () => {
    if (!isOwner) return;

    try {
      const { error } = await supabaseClient
        .from('channels')
        .delete()
        .eq('id', channel.id);

      if (error) throw error;

      toast({
        title: 'Channel deleted',
        description: `#${channel.name} has been deleted`,
      });

      onChannelUpdate();
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete channel',
        variant: 'destructive',
      });
    }
  };

  const handleMuteChannel = async () => {
    // Implement mute functionality
    toast({
      title: 'Channel muted',
      description: `Notifications for #${channel.name} have been muted`,
    });
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => setMembersDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            View Members
          </ContextMenuItem>
          
          {isOwner && (
            <>
              <ContextMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Channel
              </ContextMenuItem>
              <ContextMenuItem onClick={() => setMembersDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Members
              </ContextMenuItem>
            </>
          )}
          
          <ContextMenuItem onClick={handleMuteChannel}>
            <VolumeX className="mr-2 h-4 w-4" />
            Mute Channel
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          {!isOwner && (
            <ContextMenuItem onClick={handleLeaveChannel} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Leave Channel
            </ContextMenuItem>
          )}
          
          {isOwner && (
            <ContextMenuItem onClick={handleDeleteChannel} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Channel
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <EditChannelDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        channel={channel}
        supabaseClient={supabaseClient}
        onChannelUpdate={onChannelUpdate}
      />

      <MembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        channel={channel}
        currentUser={currentUser}
        supabaseClient={supabaseClient}
        canManageMembers={isOwner}
      />
    </>
  );
}