import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Package } from 'lucide-react';

interface BaseTableProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
}

export const BaseTable: React.FC<BaseTableProps> = ({
  children,
  loading = false,
  error = null,
  emptyMessage = "No data available",
  emptyIcon,
  className
}) => {
  if (loading) {
    return (
      <Card className={`rounded-none ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`rounded-none ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="text-destructive text-sm">Error: {error}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`rounded-none ${className}`}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            {children}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "No data available",
  icon,
  children
}) => {
  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        {icon || <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        <h3 className="text-lg font-semibold mb-2">{message}</h3>
        {children && (
          <div className="text-muted-foreground">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseTable;