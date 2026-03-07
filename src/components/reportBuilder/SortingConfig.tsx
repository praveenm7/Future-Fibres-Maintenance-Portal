import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { getFieldsForTables } from '@/lib/reportBuilder/metadataRegistry';
import type { ReportSort } from '@/types/reportBuilder';

interface SortingConfigProps {
  dataSources: string[];
  sorting: ReportSort[];
  onChange: (sorting: ReportSort[]) => void;
}

export function SortingConfig({ dataSources, sorting, onChange }: SortingConfigProps) {
  const sortableFields = getFieldsForTables(dataSources).filter(f => f.sortable);

  const addSort = () => {
    if (sortableFields.length === 0) return;
    onChange([...sorting, { fieldKey: sortableFields[0].key, direction: 'asc' }]);
  };

  const updateSort = (index: number, patch: Partial<ReportSort>) => {
    onChange(sorting.map((s, i) => i === index ? { ...s, ...patch } : s));
  };

  const removeSort = (index: number) => {
    onChange(sorting.filter((_, i) => i !== index));
  };

  if (dataSources.length === 0) {
    return <p className="text-sm text-muted-foreground">Choose data in Step 1 first</p>;
  }

  return (
    <div className="space-y-2">
      {sorting.map((sort, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Select value={sort.fieldKey} onValueChange={v => updateSort(i, { fieldKey: v })}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortableFields.map(f => (
                <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort.direction} onValueChange={v => updateSort(i, { direction: v as 'asc' | 'desc' })}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc" className="text-xs">Ascending</SelectItem>
              <SelectItem value="desc" className="text-xs">Descending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSort(i)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addSort} className="h-8 text-xs">
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Sort
      </Button>
    </div>
  );
}
