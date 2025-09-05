import React, { useState } from 'react';
import { Hash, Users, Search, Pin, MoreHorizontal, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Channel {
  id: string;
  name: string;
  description: string;
}

interface User {
  user_id: string;
  name: string;
  avatar_url?: string;
  online?: boolean;
}

interface ChatHeaderProps {
  channel: Channel;
  memberCount: number;
  members: User[];
  onSearch?: (query: string) => void;
  onShowPinned?: () => void;
  onInviteMembers?: () => void;
}

export function ChatHeader({ 
  channel, 
  memberCount, 
  members,
  onSearch,
  onShowPinned,
  onInviteMembers
}: ChatHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const onlineMembers = members.filter(m => m.online);
  const offlineMembers = members.filter(m => !m.online);

  return (
    <div className="h-16 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">{channel.name}</h1>
            {channel.description && (
              <p className="text-sm text-muted-foreground truncate">{channel.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        {showSearch ? (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Search in channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(true)}
              className="h-8 w-8 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Pinned Messages */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowPinned}
              className="h-8 w-8 p-0"
            >
              <Pin className="h-4 w-4" />
            </Button>

            {/* Members Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 h-8">
                  <Users className="h-4 w-4" />
                  <Badge variant="secondary" className="text-xs">
                    {memberCount}
                  </Badge>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center justify-between">
                    Channel Members
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onInviteMembers}
                      className="h-8 w-8 p-0"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </SheetTitle>
                  <SheetDescription>
                    {memberCount} member{memberCount !== 1 ? 's' : ''} in #{channel.name}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {onlineMembers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Online — {onlineMembers.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {onlineMembers.map((member) => (
                          <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                            </div>
                            <span className="font-medium">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {offlineMembers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Offline — {offlineMembers.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {offlineMembers.map((member) => (
                          <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback className="text-xs opacity-60">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onShowPinned}>
                  <Pin className="mr-2 h-4 w-4" />
                  View pinned messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onInviteMembers}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite members
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}