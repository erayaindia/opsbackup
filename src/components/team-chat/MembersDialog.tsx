import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserMinus, Crown, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Channel {
  id: string;
  name: string;
  description?: string;
  created_by: string;
}

interface Member {
  user_id: string;
  role: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface MembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel;
  currentUser: any;
  supabaseClient: any;
  canManageMembers: boolean;
}

export function MembersDialog({
  open,
  onOpenChange,
  channel,
  currentUser,
  supabaseClient,
  canManageMembers
}: MembersDialogProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembers();
      if (canManageMembers) {
        fetchAllUsers();
      }
    }
  }, [open, channel.id]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('channel_members')
        .select(`
          user_id,
          role,
          profiles!inner(name, email, avatar_url)
        `)
        .eq('channel_id', channel.id);

      if (error) throw error;

      const membersData = data.map((member: any) => ({
        user_id: member.user_id,
        role: member.role,
        name: member.profiles.name,
        email: member.profiles.email,
        avatar_url: member.profiles.avatar_url,
      }));

      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('user_id, name, email, avatar_url');

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddMember = async (userId: string) => {
    setLoading(true);
    try {
      const { error } = await supabaseClient
        .from('channel_members')
        .insert({
          channel_id: channel.id,
          user_id: userId,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: 'Member added',
        description: 'User has been added to the channel',
      });

      fetchMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (userId === channel.created_by) {
      toast({
        title: 'Error',
        description: 'Cannot remove channel owner',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseClient
        .from('channel_members')
        .delete()
        .eq('channel_id', channel.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Member removed',
        description: 'User has been removed from the channel',
      });

      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const memberIds = members.map(m => m.user_id);
  const nonMembers = allUsers.filter(user => !memberIds.includes(user.user_id));

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNonMembers = nonMembers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string, userId: string) => {
    if (userId === channel.created_by) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (role === 'moderator') return <Shield className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getRoleBadge = (role: string, userId: string) => {
    if (userId === channel.created_by) return <Badge variant="secondary">Owner</Badge>;
    if (role === 'moderator') return <Badge variant="outline">Moderator</Badge>;
    return <Badge variant="outline">Member</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Members of #{channel.name}
            <Badge variant="secondary">{members.length}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Current Members</h4>
              {filteredMembers.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{member.name}</span>
                        {getRoleIcon(member.role, member.user_id)}
                      </div>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                    {getRoleBadge(member.role, member.user_id)}
                  </div>
                  {canManageMembers && member.user_id !== channel.created_by && member.user_id !== currentUser.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                      disabled={loading}
                      className="h-8 w-8 p-0 hover:bg-destructive/10"
                    >
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}

              {canManageMembers && filteredNonMembers.length > 0 && (
                <>
                  <h4 className="text-sm font-medium text-muted-foreground mt-6">Add Members</h4>
                  {filteredNonMembers.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{user.name}</span>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddMember(user.user_id)}
                        disabled={loading}
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                      >
                        <UserPlus className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}