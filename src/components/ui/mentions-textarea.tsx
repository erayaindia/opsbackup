import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  full_name: string;
  role: string;
  department?: string;
}

interface MentionsTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (userId: string, userName: string) => void;
  placeholder?: string;
  className?: string;
  users: User[];
  disabled?: boolean;
}

interface MentionSuggestion {
  user: User;
  startIndex: number;
  query: string;
}

export const MentionsTextarea: React.FC<MentionsTextareaProps> = ({
  value,
  onChange,
  onMention,
  placeholder = "Type your message...",
  className = "",
  users = [],
  disabled = false,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [mentionQuery, setMentionQuery] = useState<MentionSuggestion | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get user initials for avatar
  const getUserInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500';
      case 'admin': return 'bg-blue-500';
      case 'manager': return 'bg-green-500';
      case 'employee': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Parse mentions and find current mention query
  const parseMentions = useCallback((text: string, cursorPos: number) => {
    const beforeCursor = text.slice(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      const startIndex = cursorPos - mentionMatch[0].length;
      return {
        query,
        startIndex,
        isValid: true
      };
    }

    return null;
  }, []);

  // Filter users based on mention query
  const filterUsers = useCallback((query: string) => {
    if (!query) return users.slice(0, 5); // Show first 5 users when no query

    return users.filter(user =>
      user.full_name.toLowerCase().includes(query.toLowerCase()) ||
      user.role.toLowerCase().includes(query.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);
  }, [users]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(newCursorPos);

    // Check for mention
    const mention = parseMentions(newValue, newCursorPos);

    if (mention) {
      const filteredUsers = filterUsers(mention.query);
      setSuggestions(filteredUsers);
      setMentionQuery({
        user: filteredUsers[0],
        startIndex: mention.startIndex,
        query: mention.query
      });
      setShowSuggestions(filteredUsers.length > 0);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
      setMentionQuery(null);
    }
  };

  // Handle mention selection
  const insertMention = useCallback((user: User) => {
    if (!mentionQuery || !textareaRef.current) return;

    const beforeMention = value.slice(0, mentionQuery.startIndex);
    const afterMention = value.slice(cursorPosition);
    const mentionText = `@${user.full_name} `;

    const newValue = beforeMention + mentionText + afterMention;
    const newCursorPos = mentionQuery.startIndex + mentionText.length;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionQuery(null);

    // Set cursor position after mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);

    // Call onMention callback
    if (onMention) {
      onMention(user.id, user.full_name);
    }
  }, [value, mentionQuery, cursorPosition, onChange, onMention]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedSuggestion]) {
          insertMention(suggestions[selectedSuggestion]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setMentionQuery(null);
        break;
    }
  };

  // Handle cursor position changes
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Scroll selected suggestion into view
  useEffect(() => {
    if (suggestionsRef.current && showSuggestions) {
      const selectedElement = suggestionsRef.current.children[selectedSuggestion] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedSuggestion, showSuggestions]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelectionChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full max-w-sm border shadow-lg">
          <div
            ref={suggestionsRef}
            className="max-h-48 overflow-y-auto p-1"
          >
            {suggestions.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  index === selectedSuggestion
                    ? 'bg-blue-50 dark:bg-blue-950/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => insertMention(user)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className={`text-white text-xs ${getRoleColor(user.role)}`}>
                    {getUserInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {user.full_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {user.role.replace('_', ' ')}
                    </Badge>
                    {user.department && (
                      <span className="text-xs text-muted-foreground">
                        • {user.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-2 text-xs text-muted-foreground">
            Use ↑↓ to navigate, Enter to select, Esc to cancel
          </div>
        </Card>
      )}
    </div>
  );
};