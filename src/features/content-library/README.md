# Content Library - Grid View

A complete content library grid view feature for the Eraya Ops Hub, built with React, TypeScript, and Tailwind CSS.

## Overview

This feature provides a responsive grid view for browsing approved creative assets. Each asset is displayed as a card with thumbnail/video preview, metadata, stage information, and performance indicators.

## Features

- **Responsive Grid Layout**: Adapts from 2 columns (mobile) to 7 columns (desktop)
- **Video Hover Preview**: Auto-plays muted videos on hover with reduced motion support
- **Multiple Aspect Ratios**: Supports 16:9, 9:16, 1:1, and 4:5 aspect ratios
- **Stage Management**: Visual stage chips for "Ready to Test", "Live", "Re-edit", "Archived"
- **Performance Indicators**: Badges for "Top Creative", "Scaling", "Testing", "Low Performer"
- **Dark/Light Mode**: Full theme support with proper contrast ratios
- **Accessibility**: Keyboard navigation, screen reader support, reduced motion respect
- **Truncation & Tooltips**: Smart text handling with native tooltips

## Components

### AssetCard

The main card component that displays individual assets.

**Props:**
```typescript
interface AssetCardProps extends AssetCardData {
  onOpen?: (id: string) => void;
  hoverScrubEnabled?: boolean;    // Future: time-scrub on hover
  showQuickActions?: boolean;      // Future: quick action overlay
}
```

**Usage:**
```tsx
<AssetCard
  id="asset-1"
  title="Summer Campaign Video"
  productName="Summer Collection"
  stage="Live"
  isVideo={true}
  thumbnailUrl="..."
  videoUrl="..."
  aspect="16:9"
  performance={["Top Creative", "Scaling"]}
  createdBy="John Doe"
  createdAt={new Date()}
  onOpen={(id) => console.log('Open asset', id)}
/>
```

### AssetGrid

Responsive grid container for multiple asset cards.

**Props:**
```typescript
interface AssetGridProps {
  items: AssetCardData[];
  onOpen?: (id: string) => void;
}
```

**Usage:**
```tsx
<AssetGrid
  items={assetData}
  onOpen={handleAssetOpen}
/>
```

### LibraryGridPage

Complete page component with header, search, and grid.

**Usage:**
```tsx
import { LibraryGridPage } from '@/features/content-library';

// In your router
<Route path="/content/library" element={<LibraryGridPage />} />
```

## Data Types

### Core Types

```typescript
type Stage = "Ready to Test" | "Live" | "Re-edit" | "Archived";
type PerformanceLabel = "Top Creative" | "Scaling" | "Testing" | "Low Performer";
type Aspect = "16:9" | "9:16" | "1:1" | "4:5";

interface AssetCardData {
  id: string;
  title: string;
  productName: string;
  stage: Stage;
  isVideo: boolean;
  thumbnailUrl: string;
  videoUrl?: string;      // Required if isVideo is true
  aspect?: Aspect;        // Defaults to "16:9"
  performance: PerformanceLabel[];
  createdBy?: string;
  createdAt?: string | Date;
}
```

## Utilities

### Aspect Ratio Helper

```typescript
import { getAspectClass } from '@/features/content-library/utils/aspect';

// Returns appropriate Tailwind class
const className = getAspectClass("16:9"); // "aspect-video"
```

### Time Formatting

```typescript
import { formatRelativeTime, formatMetadata } from '@/features/content-library/utils/formatters';

const timeAgo = formatRelativeTime(new Date()); // "2h ago"
const metadata = formatMetadata("John", new Date()); // "John • 2h ago"
```

## Styling & Theming

### Stage Colors

Stage chips automatically adapt to light/dark mode:

- **Ready to Test**: Violet (`bg-violet-100 text-violet-700` / `bg-violet-900/20 text-violet-300`)
- **Live**: Emerald (`bg-emerald-100 text-emerald-700` / `bg-emerald-900/20 text-emerald-300`)
- **Re-edit**: Amber (`bg-amber-100 text-amber-700` / `bg-amber-900/20 text-amber-300`)
- **Archived**: Gray (`bg-gray-100 text-gray-700` / `bg-gray-800 text-gray-300`)

### Performance Colors

- **Top Creative**: Green
- **Scaling**: Blue  
- **Testing**: Purple
- **Low Performer**: Rose/Red

### Responsive Breakpoints

- Mobile (default): 2 columns
- Small tablet (640px+): 3 columns
- Large tablet (768px+): 4 columns
- Small desktop (1024px+): 5 columns
- Large desktop (1280px+): 6 columns
- Extra large (1536px+): 7 columns

## Integration Guide

### 1. Replace Mock Data

Replace the mock data in `LibraryGridPage.tsx` with real API calls:

```tsx
import { useAssets } from '@/hooks/useAssets';

export const LibraryGridPage: React.FC = () => {
  const { data: assets, loading } = useAssets();
  
  return (
    <div>
      {/* Header stays the same */}
      <AssetGrid items={assets || []} onOpen={handleAssetOpen} />
    </div>
  );
};
```

### 2. Implement Detail Drawer

Connect the `onOpen` callback to your detail drawer:

```tsx
const handleAssetOpen = (id: string) => {
  setSelectedAssetId(id);
  setDrawerOpen(true);
};
```

### 3. Add Real Search

Replace the disabled search input with working functionality:

```tsx
const [searchQuery, setSearchQuery] = useState('');
const filteredAssets = useMemo(() => 
  assets.filter(asset => 
    asset.title.toLowerCase().includes(searchQuery.toLowerCase())
  ), [assets, searchQuery]
);
```

### 4. Enable Quick Actions

Set `showQuickActions={true}` on AssetCard and implement the callbacks.

### 5. Add Video Scrubbing

Set `hoverScrubEnabled={true}` for advanced video scrubbing on hover.

## Accessibility Features

- **Keyboard Navigation**: Tab through cards, Enter/Space to open
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Reduced Motion**: Respects `prefers-reduced-motion` for video autoplay
- **Focus Management**: Visible focus indicators with ring styling
- **Contrast Compliance**: Colors meet WCAG contrast requirements in both themes

## Performance Considerations

- **Lazy Loading**: Images use `loading="lazy"`
- **Video Optimization**: `preload="metadata"` prevents bandwidth waste
- **Layout Stability**: Fixed aspect ratios prevent layout shift
- **Hover Debouncing**: Smooth video play/pause without flickering

## Future Enhancements

The codebase is prepared for these future features:

1. **Time Scrubbing**: Mouse position controls video playback time
2. **Quick Actions**: Overlay buttons for preview/move/copy actions  
3. **Bulk Selection**: Multi-select with bulk operations
4. **List View**: Alternative layout (toggle prepared in header)
5. **Filtering**: Advanced filters beyond basic search
6. **Tags System**: Additional metadata row for tags/occasions

## Testing

The feature includes comprehensive mock data covering:

- Mix of video and image assets
- All stage types represented  
- Performance labels including overflow (+N) scenarios
- Different aspect ratios
- Long titles and product names for truncation testing
- Missing metadata for graceful fallback testing

Run the components in both light and dark modes to verify theming works correctly.