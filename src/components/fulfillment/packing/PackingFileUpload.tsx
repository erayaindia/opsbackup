import { useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PackingFileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  loading: boolean;
}

export function PackingFileUpload({ onFileUpload, loading }: PackingFileUploadProps) {
  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid CSV or Excel file');
      return;
    }
    
    onFileUpload(file);
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Upload Packing Orders</h2>
        <p className="text-muted-foreground">
          Import your orders from CSV or Excel files to get started with packing management
        </p>
      </div>

      <Card
        className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv,.xlsx,.xls';
          input.onchange = (e) => handleInputChange(e as any);
          input.click();
        }}
      >
        <CardContent className="p-8 text-center">
          <Upload className="mx-auto h-8 w-8 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {loading ? 'Processing file...' : 'Drop your file here or click to browse'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Supports CSV, XLSX, and XLS files
          </p>
          <Button disabled={loading} className="mt-2">
            {loading ? 'Processing...' : 'Select File'}
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Supported columns:</strong> Order Number, Product Name, Variant, Color, 
          Main Photo, Polaroids, Back Engraving Type, Back Engraving Value, Customer, 
          SKU, Quantity, Packer, Notes. The system will auto-detect column names.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Auto-Detection</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-xs">
              Automatically detects column types from headers
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Image Support</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-xs">
              Photo URLs are displayed as thumbnails with lightbox view
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Bulk Operations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-xs">
              Mark multiple orders as packed, dispute, or pending
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}