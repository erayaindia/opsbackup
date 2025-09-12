import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, LogOut, LayoutGrid, List, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";

export function AppHeader() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { profile } = useUserProfile();
  const [isCompact, setIsCompact] = useState(() => {
    try {
      return localStorage.getItem('app-compact-mode') === 'true' || document.documentElement.classList.contains('compact');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Apply compact mode on mount and when state changes
  useEffect(() => {
    if (isCompact) {
      document.documentElement.classList.add('compact');
      localStorage.setItem('app-compact-mode', 'true');
    } else {
      document.documentElement.classList.remove('compact');
      localStorage.setItem('app-compact-mode', 'false');
    }
  }, [isCompact]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleCompactMode = () => {
    setIsCompact(!isCompact);
  };

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email.split('@')[0].slice(0, 2).toUpperCase() : 'U';
  };

  return (
    <header className="h-14 flex items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-accent/50 transition-colors h-8 w-8"
              onClick={toggleCompactMode}
            >
              {isCompact ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isCompact ? 'Switch to Normal View' : 'Switch to Compact View'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Button variant="ghost" size="icon" className="relative hover:bg-accent/50 transition-colors h-8 w-8">
          <Search className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="relative hover:bg-accent/50 transition-colors h-8 w-8">
          <Bell className="h-4 w-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center animate-pulse text-[10px] min-w-0"
          >
            3
          </Badge>
        </Button>
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.profilePicture?.signedUrl || ""} />
                  <AvatarFallback>
                    {getUserInitials(
                      profile?.appUser?.full_name || profile?.employeeDetails?.full_name, 
                      user.email || ''
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="cursor-pointer"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}