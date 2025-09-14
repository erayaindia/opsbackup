import React from 'react';
import { TableHead } from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableHeaderProps {
  field?: string;
  children: React.ReactNode;
  sortable?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  field,
  children,
  sortable = false,
  sortField,
  sortDirection,
  onSort,
  className,
  align = 'center'
}) => {
  const getSortIcon = () => {
    if (!sortable || !field) return null;

    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    }

    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  };

  const handleClick = () => {
    if (sortable && field && onSort) {
      onSort(field);
    }
  };

  const alignClass = {
    left: 'text-left justify-start',
    center: 'text-center justify-center',
    right: 'text-right justify-end'
  };

  return (
    <TableHead
      className={cn(
        'border-r border-border/50',
        alignClass[align],
        sortable && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={handleClick}
    >
      {sortable ? (
        <div className={`flex items-center gap-1 ${alignClass[align]}`}>
          <span>{children}</span>
          {getSortIcon()}
        </div>
      ) : (
        children
      )}
    </TableHead>
  );
};

export default TableHeader;