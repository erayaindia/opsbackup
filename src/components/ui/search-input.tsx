import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  isCollapsed?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, placeholder = "Search menu...", className, isCollapsed }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClear();
      }
    };

    if (isCollapsed) {
      return (
        <div className="flex items-center justify-center p-2 group">
          <div className="relative p-1.5 rounded-md hover:bg-sidebar-accent/50 transition-all duration-200">
            <Search className="h-4 w-4 text-sidebar-foreground/60 group-hover:text-sidebar-foreground transition-colors" />
            <div className="absolute -top-1 -right-1 text-[10px] text-sidebar-foreground/40 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
              ⌘K
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/60 transition-colors" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "h-9 w-full rounded-md border border-sidebar-border bg-sidebar/30 pl-9 pr-9 text-sm",
            "placeholder:text-sidebar-foreground/50 focus:border-sidebar-primary focus:outline-none focus:ring-1 focus:ring-sidebar-primary",
            "transition-all duration-300 ease-in-out",
            "hover:bg-sidebar/50 hover:border-sidebar-border/80 hover:shadow-sm",
            "focus:bg-sidebar/60 focus:shadow-md",
            "backdrop-blur-sm",
            className
          )}
        />
        {!value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sidebar-foreground/40 font-mono pointer-events-none">
            ⌘K
          </div>
        )}
        {value && (
          <button
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 hover:bg-sidebar-accent/50 transition-all duration-200 group"
            type="button"
          >
            <X className="h-3 w-3 text-sidebar-foreground/60 group-hover:text-sidebar-foreground transition-colors" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";