import React from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  File,
  Image,
  Download,
  ExternalLink,
} from "lucide-react";

interface InvoiceViewerProps {
  invoiceUrl?: string;
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

const getFileIcon = (fileName?: string) => {
  if (!fileName) return <File className="h-4 w-4 text-gray-500" />;

  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <Image className="h-4 w-4 text-blue-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-4 w-4 text-blue-600" />;
    default:
      return <File className="h-4 w-4 text-gray-500" />;
  }
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

const viewFile = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

export default function InvoiceViewer({
  invoiceUrl,
  fileName,
  fileSize,
  compact = false
}: InvoiceViewerProps) {
  // If no invoice data, return empty state
  if (!invoiceUrl || !fileName) {
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
        {getFileIcon(fileName)}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-sm font-medium truncate cursor-pointer hover:text-primary"
            title={fileName}
            onClick={() => viewFile(invoiceUrl)}
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
            onClick={() => viewFile(invoiceUrl)}
            title="View invoice"
            className="h-7 w-7 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadFile(invoiceUrl, fileName)}
            title="Download invoice"
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
      {getFileIcon(fileName)}
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
          onClick={() => viewFile(invoiceUrl)}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadFile(invoiceUrl, fileName)}
          className="text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      </div>
    </div>
  );
}