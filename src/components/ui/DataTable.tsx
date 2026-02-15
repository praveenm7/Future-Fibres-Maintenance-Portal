import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedId?: string;
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  selectedId,
  keyExtractor
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg overflow-hidden">
      <table className="w-full caption-bottom text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                No data available.
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const id = keyExtractor(item);
              const isSelected = selectedId === id;
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'border-b border-border transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected
                      ? 'bg-primary/8 border-l-2 border-l-primary'
                      : index % 2 === 1 ? 'bg-muted/20' : '',
                    onRowClick && !isSelected && 'hover:bg-muted/40'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
