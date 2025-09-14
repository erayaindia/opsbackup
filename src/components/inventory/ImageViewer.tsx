import React from "react";
import { Button } from "@/components/ui/button";
import {
  Image,
  ExternalLink,
  Download,
  X,
} from "lucide-react";

interface ImageViewerProps {
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  compact?: boolean;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const downloadFile = async (url: string, filename: string) => {
  try {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
};

const viewImage = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export default function ImageViewer({
  imageUrl,
  fileName,
  fileSize,
  compact = false
}: ImageViewerProps) {
  // If no image data, return empty state
  if (!imageUrl || !fileName) {
    return (
      <div className="text-center">
        <span className="text-muted-foreground text-sm">-</span>
      </div>
    );
  }

  const truncatedFileName = fileName.length > 20
    ? `${fileName.substring(0, 17)}...`
    : fileName;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Image className="h-4 w-4 text-green-500" />
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-sm font-medium truncate cursor-pointer hover:text-primary"
            title={fileName}
            onClick={() => viewImage(imageUrl)}
          >
            {truncatedFileName}
          </span>
          {fileSize && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(fileSize)}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => viewImage(imageUrl)}
            title="View product image"
            className="h-7 w-7 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadFile(imageUrl, fileName)}
            title="Download product image"
            className="h-7 w-7 p-0"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Image className="h-5 w-5 text-green-500" />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate" title={fileName}>
          {fileName}
        </h4>
        {fileSize && (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => viewImage(imageUrl)}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadFile(imageUrl, fileName)}
          className="text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      </div>
    </div>
  );
}