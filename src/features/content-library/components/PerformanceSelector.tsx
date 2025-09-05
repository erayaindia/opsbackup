import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { showSuccessToast, showErrorToast } from "../utils/toast";

export type PerformanceOption = "Scaling" | "Testing" | "Paused" | "Top Creative";

interface PerformanceSelectorProps {
  currentPerformance: PerformanceOption[];
  onPerformanceChange: (performance: PerformanceOption[]) => Promise<void>;
  disabled?: boolean;
  className?: string;
  maxVisible?: number;
}

const PERFORMANCE_COLORS = {
  "Scaling": {
    bg: "bg-blue-100",
    text: "text-blue-700", 
    border: "border-blue-200",
    dark: "dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
  },
  "Testing": {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200", 
    dark: "dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700"
  },
  "Paused": {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dark: "dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
  },
  "Top Creative": {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    dark: "dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
  }
} as const;

export const PerformanceSelector: React.FC<PerformanceSelectorProps> = ({
  currentPerformance,
  onPerformanceChange,
  disabled = false,
  className,
  maxVisible = 2
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePerformanceToggle = async (performance: PerformanceOption) => {
    setIsLoading(true);
    try {
      const newPerformance = currentPerformance.includes(performance)
        ? currentPerformance.filter(p => p !== performance)
        : [...currentPerformance, performance];
      
      await onPerformanceChange(newPerformance);
      
      const action = currentPerformance.includes(performance) ? "removed" : "added";
      showSuccessToast(`Performance label ${action}`);
    } catch (error) {
      console.error("Failed to change performance:", error);
      showErrorToast("Failed to update performance labels");
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformanceColors = (performance: PerformanceOption) => {
    const colors = PERFORMANCE_COLORS[performance];
    return `${colors.bg} ${colors.text} ${colors.border} ${colors.dark}`;
  };

  const visiblePerformance = currentPerformance.slice(0, maxVisible);
  const remainingCount = currentPerformance.length - maxVisible;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visiblePerformance.map((performance) => (
        <Badge
          key={performance}
          variant="outline"
          className={cn(
            "text-xs px-2 py-0.5 font-medium rounded-full border transition-colors",
            getPerformanceColors(performance)
          )}
        >
          {performance}
        </Badge>
      ))}
      
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className="text-xs px-2 py-0.5 font-medium rounded-full bg-muted text-muted-foreground border-muted-foreground/20"
        >
          +{remainingCount}
        </Badge>
      )}

      {/* Performance selector dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              disabled && "opacity-50 cursor-not-allowed",
              isLoading && "opacity-75"
            )}
            disabled={disabled || isLoading}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            title="Edit performance labels"
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-48"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 text-xs font-medium text-muted-foreground border-b">
            Performance Labels
          </div>
          {(["Scaling", "Testing", "Paused", "Top Creative"] as const).map((performance) => (
            <DropdownMenuItem
              key={performance}
              onClick={() => handlePerformanceToggle(performance)}
              className="cursor-pointer focus:bg-accent flex items-center gap-2"
            >
              <Checkbox
                checked={currentPerformance.includes(performance)}
                readOnly
                className="w-4 h-4"
              />
              <div className={cn(
                "w-2 h-2 rounded-full",
                PERFORMANCE_COLORS[performance].bg.replace("bg-", "bg-"),
                PERFORMANCE_COLORS[performance].dark
              )} />
              <span className="flex-1">{performance}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};