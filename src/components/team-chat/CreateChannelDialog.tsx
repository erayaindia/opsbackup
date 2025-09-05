import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supabaseClient: any;
  currentUser: any;
}

export function CreateChannelDialog({ 
  open, 
  onOpenChange, 
  supabaseClient, 
  currentUser 
}: CreateChannelDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Channel name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create channel
      const { data: channel, error: channelError } = await supabaseClient
        .from('channels')
        .insert({
          name: name.trim().toLowerCase().replace(/\s+/g, '-'),
          description: description.trim(),
          created_by: currentUser.user_id,
        })
        .select()
        .single();

      if (channelError) throw channelError;

      // Add creator as owner
      const { error: memberError } = await supabaseClient
        .from('channel_members')
        .insert({
          channel_id: channel.id,
          user_id: currentUser.user_id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      toast({
        title: 'Success',
        description: 'Channel created successfully',
      });

      // Reset form and close dialog
      setName('');
      setDescription('');
      onOpenChange(false);
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create channel',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create a new channel for team communication.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Channel Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. product-updates"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              disabled={isLoading}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}