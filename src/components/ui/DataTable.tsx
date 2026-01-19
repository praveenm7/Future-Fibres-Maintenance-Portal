import { ReactNode } from 'react';

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
    <div className="overflow-x-auto border border-border rounded">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const id = keyExtractor(item);
            const isSelected = selectedId === id;
            return (
              <tr
                key={id}
                onClick={() => onRowClick?.(item)}
                className={`
                  ${onRowClick ? 'cursor-pointer hover:bg-accent/30' : ''}
                  ${isSelected ? 'bg-accent/50' : ''}
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className={col.className}>
                    {col.render 
                      ? col.render(item) 
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
