import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadProgress as UploadProgressType } from "../types";

interface UploadProgressProps {
  progress: UploadProgressType;
  onCancel: () => void;
}

/**
 * UploadProgress - Thin progress bar with upload status
 * Shows under the header while uploads are running
 */
export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  onCancel
}) => {
  const { totalFiles, completedFiles, currentFile, isUploading } = progress;
  
  // Calculate progress percentage
  const progressPercentage = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
  const isIndeterminate = !currentFile;

  if (!isUploading && completedFiles === 0) {
    return null;
  }

  return (
    <div className="bg-background border-b">
      <div className="container mx-auto px-6">
        {/* Progress Bar */}
        <div className="h-1 bg-muted relative overflow-hidden">
          <div
            className={cn(
              "h-full bg-primary transition-all duration-300 ease-out",
              isIndeterminate && "animate-pulse slide-animation"
            )}
            style={{
              width: isIndeterminate ? '30%' : `${progressPercentage}%`,
            }}
          />
        </div>

        {/* Status Text and Actions */}
        <div className="py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Status Text */}
            <span className="text-xs text-muted-foreground">
              {isUploading ? (
                currentFile ? (
                  `Uploading ${completedFiles + 1} of ${totalFiles}... ${currentFile}`
                ) : (
                  `Processing ${completedFiles + 1} of ${totalFiles}...`
                )
              ) : (
                `Uploaded ${completedFiles} of ${totalFiles} files`
              )}
            </span>

            {/* Progress Numbers */}
            <div className="text-xs font-medium text-foreground">
              {completedFiles}/{totalFiles}
            </div>
          </div>

          {/* Cancel Button */}
          {isUploading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
            >
              Cancel All
            </Button>
          )}
        </div>
      </div>

      {/* CSS for sliding animation */}
      <style>{`
        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(200%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .slide-animation {
          animation: slide 2s infinite;
        }
      `}</style>
    </div>
  );
};