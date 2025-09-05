/**
 * Content Library Types
 * Defines all TypeScript interfaces and types for the content library feature
 */

export type Stage = "Ready" | "Live" | "Re-edit" | "Archived" | "Pending" | "Approved";

export type PerformanceLabel = "Top Creative" | "Scaling" | "Testing" | "Low Performer";

export type Aspect = "16:9" | "9:16" | "1:1" | "4:5";

export interface AssetCardData {
  id: string;
  title: string;
  productName: string;
  stage: Stage;
  isVideo: boolean;
  thumbnailUrl: string;
  videoUrl?: string; // Required only if isVideo is true
  aspect?: Aspect; // Default 16:9
  performance: PerformanceLabel[];
  createdBy?: string;
  createdAt?: string | Date;
  durationSec?: number; // Video duration in seconds
  commentMarkers?: number[]; // Array of timecodes in seconds for comment markers
  versionLabel?: string; // Version label (e.g., "V3")
}

export interface AssetCardProps extends AssetCardData {
  onOpen?: (id: string) => void;
  onCopyLink?: (id: string) => void;
  onDownload?: (id: string) => void;
  onMore?: (id: string) => void;
  onSelect?: (id: string, checked: boolean) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onStageChange?: (id: string, stage: import("../components/StageSelector").StageOption) => Promise<void>;
  onPerformanceChange?: (id: string, performance: import("../components/PerformanceSelector").PerformanceOption[]) => Promise<void>;
  hoverScrubEnabled?: boolean;
  showQuickActions?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  // Global video state management
  activeVideoId?: string;
  onVideoPlay?: (id: string) => void;
}

export interface AssetGridProps {
  items: AssetCardData[];
  onOpen?: (id: string) => void;
  onCopyLink?: (id: string) => void;
  onDownload?: (id: string) => void;
  onMore?: (id: string) => void;
  onSelect?: (id: string, checked: boolean) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onStageChange?: (id: string, stage: import("../components/StageSelector").StageOption) => Promise<void>;
  onPerformanceChange?: (id: string, performance: import("../components/PerformanceSelector").PerformanceOption[]) => Promise<void>;
  selectMode?: boolean;
  selectedItems?: Set<string>;
  showQuickActions?: boolean;
}

// Stage color mappings for consistent theming
export const STAGE_COLORS = {
  "Ready": {
    light: "bg-violet-100 text-violet-700 border-violet-200",
    dark: "bg-violet-900/20 text-violet-300 border-violet-700"
  },
  "Live": {
    light: "bg-emerald-100 text-emerald-700 border-emerald-200", 
    dark: "bg-emerald-900/20 text-emerald-300 border-emerald-700"
  },
  "Re-edit": {
    light: "bg-amber-100 text-amber-700 border-amber-200",
    dark: "bg-amber-900/20 text-amber-300 border-amber-700"
  },
  "Archived": {
    light: "bg-gray-100 text-gray-700 border-gray-200",
    dark: "bg-gray-800 text-gray-300 border-gray-600"
  },
  "Pending": {
    light: "bg-orange-100 text-orange-700 border-orange-200",
    dark: "bg-orange-900/20 text-orange-300 border-orange-700"
  },
  "Approved": {
    light: "bg-green-100 text-green-700 border-green-200",
    dark: "bg-green-900/20 text-green-300 border-green-700"
  }
} as const;

// Performance label color mappings
export const PERFORMANCE_COLORS = {
  "Top Creative": {
    light: "bg-green-100 text-green-700 border-green-200",
    dark: "bg-green-900/20 text-green-300 border-green-700"
  },
  "Scaling": {
    light: "bg-blue-100 text-blue-700 border-blue-200",
    dark: "bg-blue-900/20 text-blue-300 border-blue-700"
  },
  "Testing": {
    light: "bg-purple-100 text-purple-700 border-purple-200", 
    dark: "bg-purple-900/20 text-purple-300 border-purple-700"
  },
  "Low Performer": {
    light: "bg-rose-100 text-rose-700 border-rose-200",
    dark: "bg-rose-900/20 text-rose-300 border-rose-700"
  }
} as const;

// Upload-related types
export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  isVideo: boolean;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  thumbnailUrl?: string;
  assetId?: string;
}

export interface UploadProgress {
  totalFiles: number;
  completedFiles: number;
  currentFile?: string;
  isUploading: boolean;
}

export interface DuplicateFile {
  uploadFileId: string;
  existingAssetId: string;
  fileName: string;
  action?: 'replace' | 'keep_both';
}

export interface ProductSelectorProps {
  onSelect: (productName: string) => void;
  onCancel: () => void;
}

// Temporary upload card data
export interface UploadCardData extends Omit<AssetCardData, 'id'> {
  id: string;
  isUploading: boolean;
  uploadProgress?: number;
  uploadError?: string;
}