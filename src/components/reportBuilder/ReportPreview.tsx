import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { BarChart3, Loader2 } from 'lucide-react';
import type { ReportExecutionResult } from '@/types/reportBuilder';

interface ReportPreviewProps {
  result: ReportExecutionResult | null;
  isLoading: boolean;
  error: Error | null;
  hasConfig?: boolean;
}

export function ReportPreview({ result, isLoading, error, hasConfig }: ReportPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        <p className="text-sm">Running your report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-sm">
          <p className="text-destructive font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
        {!hasConfig ? (
          <>
            <p className="text-sm font-medium">Build your report</p>
            <p className="text-xs mt-1 text-center max-w-[260px]">
              Choose your data, pick the columns you need, then click Run Report to see results here
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Ready to run</p>
            <p className="text-xs mt-1">Click "Run Report" to see your results</p>
          </>
        )}
      </div>
    );
  }

  if (result.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
        <p className="text-sm font-medium">No results found</p>
        <p className="text-xs mt-1">Try adjusting your filters or selecting different data</p>
      </div>
    );
  }

  const columnKeys = Object.keys(result.rows[0]);

  const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString('en-GB');
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try { return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
      catch { return String(value); }
    }
    return String(value);
  };

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex gap-3 text-xs">
        <Badge variant="secondary">{result.rowCount} row{result.rowCount !== 1 ? 's' : ''}</Badge>
        <Badge variant="outline">{result.executionMs}ms</Badge>
      </div>

      {/* Table */}
      <ScrollArea className="border rounded-md">
        <div className="max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                {columnKeys.map(key => (
                  <TableHead key={key} className="whitespace-nowrap text-xs font-medium">
                    {key}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.map((row, i) => (
                <TableRow key={i}>
                  {columnKeys.map(key => (
                    <TableCell key={key} className="whitespace-nowrap text-xs">
                      {formatCell(row[key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
