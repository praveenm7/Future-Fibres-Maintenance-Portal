import { ReactNode, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';

// --- Types ---

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select';
  filterOptions?: string[];
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedId?: string;
  keyExtractor: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  stickyHeader?: boolean;
  rowActions?: (item: T) => ReactNode;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

type SortDirection = 'asc' | 'desc' | null;

// --- Helpers ---

function getValue<T>(item: T, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

function compareValues(a: unknown, b: unknown, dir: 'asc' | 'desc'): number {
  const aVal = a ?? '';
  const bVal = b ?? '';

  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return dir === 'asc' ? aVal - bVal : bVal - aVal;
  }

  const aStr = String(aVal).toLowerCase();
  const bStr = String(bVal).toLowerCase();
  const cmp = aStr.localeCompare(bStr);
  return dir === 'asc' ? cmp : -cmp;
}

// --- Component ---

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  selectedId,
  keyExtractor,
  emptyTitle,
  emptyDescription,
  sortable = false,
  filterable = false,
  paginated = false,
  pageSize: defaultPageSize = 20,
  stickyHeader = false,
  rowActions,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Filtering state
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Handle sort toggle
  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortColumn(null); setSortDirection(null); }
      else setSortDirection('asc');
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (colKey: string, value: string) => {
    setFilters((prev) => ({ ...prev, [colKey]: value }));
    setCurrentPage(1);
  };

  // Process data: filter → sort → paginate
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    if (filterable) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          result = result.filter((item) => {
            const cellValue = String(getValue(item, key) ?? '').toLowerCase();
            return cellValue.includes(value.toLowerCase());
          });
        }
      });
    }

    // Apply sorting
    if (sortable && sortColumn && sortDirection) {
      result.sort((a, b) =>
        compareValues(getValue(a, sortColumn), getValue(b, sortColumn), sortDirection)
      );
    }

    return result;
  }, [data, filters, sortColumn, sortDirection, filterable, sortable]);

  // Pagination calculations
  const totalRows = processedData.length;
  const totalPages = paginated ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;
  const paginatedData = paginated
    ? processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : processedData;
  const startRow = paginated ? (currentPage - 1) * pageSize + 1 : 1;
  const endRow = paginated ? Math.min(currentPage * pageSize, totalRows) : totalRows;

  // Selection helpers
  const toggleSelect = useCallback((id: string) => {
    if (!onSelectionChange) return;
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(sid => sid !== id)
      : [...selectedIds, id];
    onSelectionChange(newIds);
  }, [selectedIds, onSelectionChange]);

  const toggleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    const allIds = processedData.map(item => keyExtractor(item));
    const allSelected = allIds.every(id => selectedIds.includes(id));
    onSelectionChange(allSelected ? [] : allIds);
  }, [processedData, selectedIds, onSelectionChange, keyExtractor]);

  const allSelected = processedData.length > 0 && processedData.every(item => selectedIds.includes(keyExtractor(item)));
  const someSelected = processedData.some(item => selectedIds.includes(keyExtractor(item)));

  // Determine if any column has filters enabled
  const hasActiveFilters = Object.values(filters).some(Boolean);

  // All columns including checkbox and actions columns
  const visibleColumns = rowActions
    ? [...columns, { key: '__actions', header: '', className: 'w-10' } as Column<T>]
    : columns;
  const totalColCount = visibleColumns.length + (selectable ? 1 : 0);

  return (
    <div className="relative isolate border border-border rounded-lg">
      {/* Mobile scroll hint */}
      <div className="md:hidden text-xs text-muted-foreground/60 px-3 py-1.5 border-b border-border bg-muted/30 text-center">
        Swipe to see more &rarr;
      </div>
      {/* Note: When stickyHeader is enabled, this creates a nested scroll container.
         If the page is already scrollable via MainLayout, consider using a dynamic
         max-height or removing the constraint to avoid double scrollbars. */}
      <div className={cn(
        "overflow-x-auto -webkit-overflow-scrolling-touch",
        stickyHeader && "max-h-[600px] overflow-y-auto"
      )}>
        <table className="w-full caption-bottom text-sm">
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            {/* Header Row */}
            <tr className="bg-muted border-b border-border">
              {selectable && (
                <th className={cn('h-10 w-10 px-3 align-middle', stickyHeader && 'bg-muted')}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSelectAll(); }}
                    className={cn(
                      'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                      allSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : someSelected
                          ? 'bg-primary/50 border-primary text-primary-foreground'
                          : 'border-muted-foreground/30 hover:border-muted-foreground/60'
                    )}
                  >
                    {(allSelected || someSelected) && <Check className="h-3 w-3" />}
                  </button>
                </th>
              )}
              {visibleColumns.map((col) => {
                const isSortableCol = sortable && col.key !== '__actions' && (col.sortable !== false);
                const isSorted = sortColumn === col.key;

                return (
                  <th
                    key={col.key}
                    className={cn(
                      'h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground',
                      isSortableCol && 'cursor-pointer select-none hover:text-foreground transition-colors',
                      stickyHeader && 'bg-muted',
                      col.className
                    )}
                    onClick={isSortableCol ? () => handleSort(col.key) : undefined}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      {isSortableCol && (
                        <span className="inline-flex flex-col ml-0.5">
                          {isSorted ? (
                            sortDirection === 'asc'
                              ? <ChevronUp className="h-3.5 w-3.5" />
                              : <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>

            {/* Filter Row */}
            {filterable && (
              <tr className="bg-muted/50 border-b border-border">
                {selectable && <th className="px-3 py-1.5" />}
                {visibleColumns.map((col) => {
                  if (col.key === '__actions') {
                    return <th key={col.key} className="px-2 py-1.5" />;
                  }

                  const isFilterable = col.filterable !== false;

                  if (!isFilterable) {
                    return <th key={col.key} className="px-4 py-1.5" />;
                  }

                  if (col.filterType === 'select' && col.filterOptions) {
                    return (
                      <th key={col.key} className="px-2 py-1.5">
                        <select
                          value={filters[col.key] || ''}
                          onChange={(e) => handleFilterChange(col.key, e.target.value)}
                          className="w-full h-7 text-xs rounded border border-border bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">All</option>
                          {col.filterOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </th>
                    );
                  }

                  return (
                    <th key={col.key} className="px-2 py-1.5">
                      <input
                        type="text"
                        value={filters[col.key] || ''}
                        onChange={(e) => handleFilterChange(col.key, e.target.value)}
                        placeholder="Filter..."
                        className="w-full h-7 text-xs rounded border border-border bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                      />
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={totalColCount}>
                  <EmptyState
                    title={hasActiveFilters ? 'No matching results' : emptyTitle}
                    description={hasActiveFilters ? 'Try adjusting your filters' : emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
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
                    {selectable && (
                      <td className="w-10 px-3 py-3 align-middle">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}
                          className={cn(
                            'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                            selectedIds.includes(id)
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/30 hover:border-muted-foreground/60'
                          )}
                        >
                          {selectedIds.includes(id) && <Check className="h-3 w-3" />}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                        {col.render
                          ? col.render(item)
                          : String(getValue(item, col.key) ?? '')}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-2 py-3 align-middle">
                        {rowActions(item)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {paginated && totalRows > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="h-7 rounded border border-border bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <span>
            {startRow}-{endRow} of {totalRows}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium text-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-7 w-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
