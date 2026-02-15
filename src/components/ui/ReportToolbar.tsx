import { Printer, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportToolbarProps {
  onPrint?: () => void;
  onExportExcel?: () => void;
  onImport?: () => void;
  className?: string;
}

export function ReportToolbar({ onPrint, onExportExcel, onImport, className = '' }: ReportToolbarProps) {
  return (
    <div className={`flex items-center gap-2 flex-shrink-0 ${className}`}>
      {onImport && (
        <Button variant="outline" size="sm" onClick={onImport}>
          <Upload className="h-4 w-4 mr-1.5" />
          Import
        </Button>
      )}
      {onPrint && (
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-1.5" />
          Print
        </Button>
      )}
      {onExportExcel && (
        <Button variant="outline" size="sm" onClick={onExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-1.5" />
          Export Excel
        </Button>
      )}
    </div>
  );
}
