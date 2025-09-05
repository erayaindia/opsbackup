import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { showSuccessToast, showErrorToast } from "../utils/toast";

export type StageOption = "Ready" | "Live" | "Re-edit" | "Archived" | "Pending" | "Approved";

interface StageSelectorProps {
  currentStage?: StageOption;
  onStageChange: (stage: StageOption) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const STAGE_COLORS = {
  "Ready": {
    bg: "bg-violet-100 hover:bg-violet-200",
    text: "text-violet-700",
    border: "border-violet-200",
    dark: "dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700"
  },
  "Live": {
    bg: "bg-emerald-100 hover:bg-emerald-200",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dark: "dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700"
  },
  "Re-edit": {
    bg: "bg-amber-100 hover:bg-amber-200",
    text: "text-amber-700",
    border: "border-amber-200",
    dark: "dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700"
  },
  "Archived": {
    bg: "bg-gray-100 hover:bg-gray-200",
    text: "text-gray-700",
    border: "border-gray-200",
    dark: "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
  },
  "Pending": {
    bg: "bg-orange-100 hover:bg-orange-200",
    text: "text-orange-700",
    border: "border-orange-200",
    dark: "dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700"
  },
  "Approved": {
    bg: "bg-green-100 hover:bg-green-200",
    text: "text-green-700",
    border: "border-green-200",
    dark: "dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
  }
} as const;

export const StageSelector: React.FC<StageSelectorProps> = ({
  currentStage,
  onStageChange,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStageSelect = async (stage: StageOption) => {
    // Show confirmation for destructive actions
    if (stage === "Archived") {
      const confirmed = window.confirm(
        "Are you sure you want to archive this asset? This will remove it from active use."
      );
      if (!confirmed) return;
    }

    if (stage === "Re-edit") {
      const confirmed = window.confirm(
        "Are you sure you want to mark this asset for re-edit?"
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      await onStageChange(stage);
      setIsOpen(false);
      showSuccessToast(`Stage set to ${stage}`);
    } catch (error) {
      console.error("Failed to change stage:", error);
      showErrorToast("Failed to update stage");
    } finally {
      setIsLoading(false);
    }
  };

  const getStageColors = (stage?: StageOption) => {
    if (!stage) {
      return "bg-muted hover:bg-muted/80 text-muted-foreground border-muted-foreground/20";
    }
    const colors = STAGE_COLORS[stage];
    if (!colors) {
      console.warn(`Unknown stage: ${stage}. Falling back to default colors.`);
      return "bg-muted hover:bg-muted/80 text-muted-foreground border-muted-foreground/20";
    }
    return `${colors.bg} ${colors.text} ${colors.border} ${colors.dark}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center text-xs px-3 py-1 font-medium rounded-md border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            getStageColors(currentStage),
            disabled && "opacity-50 cursor-not-allowed",
            isLoading && "opacity-75",
            className
          )}
          disabled={disabled || isLoading}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {isLoading ? (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
          ) : null}
          {currentStage || "Set stage"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-40"
        onClick={(e) => e.stopPropagation()}
      >
        {(["Ready", "Live", "Re-edit", "Archived", "Pending", "Approved"] as const).map((stage) => (
          <DropdownMenuItem
            key={stage}
            onClick={() => handleStageSelect(stage)}
            className={cn(
              "cursor-pointer focus:bg-accent",
              currentStage === stage && "bg-accent"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              STAGE_COLORS[stage].bg.replace("hover:", "").replace("bg-", "bg-"),
              STAGE_COLORS[stage].dark
            )} />
            {stage}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};