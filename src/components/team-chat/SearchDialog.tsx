import React, { useState, useEffect } from 'react';
import { Search, Calendar, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    avatar_url?: string;
  };
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  supabaseClient: any;
}

export function SearchDialog({
  open,
  onOpenChange,
  channelId,
  supabaseClient
}: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim() && query.length >= 2) {
      searchMessages();
    } else {
      setResults([]);
    }
  }, [query, channelId]);

  const searchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles!inner(name, avatar_url)
        `)
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error searching messages:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search in Channel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={result.profiles.avatar_url} />
                      <AvatarFallback>
                        {result.profiles.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{result.profiles.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {highlightText(result.content, query)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.trim() && query.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages found for "{query}"</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Type at least 2 characters to search</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}