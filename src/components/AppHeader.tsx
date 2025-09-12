import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, LogOut, LayoutGrid, List, User as UserIcon, Mail, MapPin, Building2, Calendar, Briefcase } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { WeatherWidget } from "@/components/WeatherWidget";

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
        <WeatherWidget />
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
            <DropdownMenuContent className="w-80" align="end" forceMount>
              {/* Profile Header */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.profilePicture?.signedUrl || ""} />
                  <AvatarFallback className="text-sm">
                    {getUserInitials(
                      profile?.appUser?.full_name || profile?.employeeDetails?.full_name, 
                      user.email || ''
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {profile?.appUser?.full_name || profile?.employeeDetails?.full_name || 'User'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0.5 ${
                        profile?.appUser?.role === 'super_admin' 
                          ? 'text-purple-700 bg-purple-100 border-purple-200' 
                          : profile?.appUser?.role === 'admin'
                            ? 'text-blue-700 bg-blue-100 border-blue-200'
                            : profile?.appUser?.role === 'manager'
                              ? 'text-indigo-700 bg-indigo-100 border-indigo-200'
                              : 'text-gray-700 bg-gray-100 border-gray-200'
                      }`}
                    >
                      {profile?.appUser?.role?.replace('_', ' ') || 'Employee'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-2">
                {profile?.appUser?.company_email && (
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{profile.appUser.company_email}</span>
                  </div>
                )}
                
                {profile?.appUser?.department && (
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{profile.appUser.department}</span>
                  </div>
                )}
                
                {profile?.appUser?.designation && (
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{profile.appUser.designation}</span>
                  </div>
                )}
                
                {profile?.appUser?.work_location && (
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{profile.appUser.work_location}</span>
                  </div>
                )}
                
                {profile?.appUser?.joined_at && (
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      Joined {new Date(profile.appUser.joined_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric', 
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="cursor-pointer"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>View Full Profile</span>
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