import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedChannelSidebar } from '@/components/team-chat/EnhancedChannelSidebar';
import { EnhancedChatMain } from '@/components/team-chat/EnhancedChatMain';
import { Card } from '@/components/ui/card';
import { User } from '@supabase/supabase-js';

export default function TeamChat() {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { channelId } = useParams();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && profile) {
          setCurrentUser(profile);
        }
      }
      
      setIsLoading(false);
    };

    getCurrentUser();
  }, []);

  if (isLoading || !user || !currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Team Chat</h1>
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Left Sidebar - Channels */}
      <div className="w-72 h-full bg-card/95 backdrop-blur-sm border-r border-border/50 shadow-lg">
        <EnhancedChannelSidebar
          supabaseClient={supabase}
          currentUser={currentUser}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-full flex flex-col bg-background/50">
        {channelId ? (
          <EnhancedChatMain
            supabaseClient={supabase}
            currentUser={currentUser}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 p-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                <div className="text-primary text-3xl">💬</div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">Welcome to Team Chat</h2>
                <p className="text-muted-foreground text-lg">Select a channel to start collaborating</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Will show thread details when needed */}
      <div className="w-80 h-full bg-card/95 backdrop-blur-sm border-l border-border/50 shadow-lg hidden xl:block">
        <div className="p-6 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Thread Details</h3>
          <p className="text-sm text-muted-foreground mt-1">No active thread</p>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          <div className="text-4xl mb-4">🧵</div>
          <p className="text-sm">Thread conversations will appear here</p>
        </div>
      </div>
    </div>
  );
}