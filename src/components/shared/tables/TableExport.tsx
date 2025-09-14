import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export interface ExportColumn {
  key: string;
  header: string;
  transform?: (value: any, row: any) => string | number;
}

interface TableExportProps {
  data: any[];
  columns: ExportColumn[];
  filename?: string;
  disabled?: boolean;
  className?: string;
}

export const TableExport: React.FC<TableExportProps> = ({
  data,
  columns,
  filename,
  disabled = false,
  className
}) => {
  const exportToCSV = () => {
    if (data.length === 0) return;

    // Create headers
    const headers = columns.map(col => col.header);

    // Create CSV data
    const csvData = data.map(row =>
      columns.map(col => {
        let value = row[col.key];

        // Apply transformation if provided
        if (col.transform) {
          value = col.transform(value, row);
        }

        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }

        // Convert to string and escape quotes
        const stringValue = String(value);

        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
    );

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);

    // Generate filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const defaultFilename = `export_${dateStr}_${timeStr}.csv`;

    link.setAttribute('download', filename || defaultFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={exportToCSV}
      variant="outline"
      disabled={disabled || data.length === 0}
      className={`rounded-none ${className}`}
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
};

export default TableExport;