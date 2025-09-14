import React from 'react';
import { Bill } from '@/hooks/useBills';

interface BillsTableProps {
  bills: Bill[];
  onEdit?: (bill: Bill) => void;
  onMarkAsPaid?: (bill: Bill) => void;
  loading?: boolean;
}

export const BillsTable: React.FC<BillsTableProps> = ({
  bills,
  onEdit,
  onMarkAsPaid,
  loading
}) => {
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">BillsTable temporarily removed for deployment fix</p>
    </div>
  );
};