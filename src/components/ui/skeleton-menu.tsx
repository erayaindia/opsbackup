import React from 'react';

interface SkeletonMenuProps {
  count?: number;
  showLabels?: boolean;
}

export const SkeletonMenu: React.FC<SkeletonMenuProps> = ({ 
  count = 3, 
  showLabels = true 
}) => {
  return (
    <div className="px-3 py-1">
      {showLabels && (
        <div className="px-2 mb-2">
          <div className="h-3 bg-sidebar-foreground/10 rounded animate-skeleton-pulse w-16" />
        </div>
      )}
      <div className="space-y-0.5">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="h-9 rounded-lg bg-sidebar-foreground/5 animate-skeleton-pulse flex items-center px-3">
            <div className="h-4 w-4 bg-sidebar-foreground/10 rounded animate-skeleton-pulse" />
            {showLabels && (
              <div className="ml-2 h-3 bg-sidebar-foreground/10 rounded animate-skeleton-pulse flex-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface SkeletonCollapsibleProps {
  showLabels?: boolean;
}

export const SkeletonCollapsible: React.FC<SkeletonCollapsibleProps> = ({ showLabels = true }) => {
  return (
    <div className="px-3 py-1">
      <div className="space-y-0.5">
        <div className="h-9 rounded-lg bg-sidebar-foreground/5 animate-skeleton-pulse flex items-center px-3">
          <div className="h-4 w-4 bg-sidebar-foreground/10 rounded animate-skeleton-pulse" />
          {showLabels && (
            <>
              <div className="ml-2 h-3 bg-sidebar-foreground/10 rounded animate-skeleton-pulse w-24" />
              <div className="ml-auto h-4 w-4 bg-sidebar-foreground/10 rounded animate-skeleton-pulse" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};