import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getFieldsForTables } from '@/lib/reportBuilder/metadataRegistry';
import type { ReportColumn, FieldMeta } from '@/types/reportBuilder';

interface ColumnPickerProps {
  dataSources: string[];
  columns: ReportColumn[];
  onChange: (columns: ReportColumn[]) => void;
}

export function ColumnPicker({ dataSources, columns, onChange }: ColumnPickerProps) {
  const availableFields = getFieldsForTables(dataSources);

  const isSelected = (key: string) => columns.some(c => c.fieldKey === key && c.visible);

  const toggle = (field: FieldMeta) => {
    const existing = columns.find(c => c.fieldKey === field.key);
    if (existing) {
      if (existing.visible) {
        onChange(columns.filter(c => c.fieldKey !== field.key));
      } else {
        onChange(columns.map(c => c.fieldKey === field.key ? { ...c, visible: true } : c));
      }
    } else {
      onChange([...columns, { fieldKey: field.key, alias: field.label, visible: true }]);
    }
  };

  const selectedCount = columns.filter(c => c.visible).length;

  if (dataSources.length === 0) {
    return <p className="text-sm text-muted-foreground">Choose data in Step 1 first</p>;
  }

  // Group fields by table
  const grouped = new Map<string, FieldMeta[]>();
  for (const f of availableFields) {
    const table = f.key.split('.')[0];
    if (!grouped.has(table)) grouped.set(table, []);
    grouped.get(table)!.push(f);
  }

  const selectAllForTable = (fields: FieldMeta[]) => {
    const allSelected = fields.every(f => isSelected(f.key));
    if (allSelected) {
      // Deselect all from this table
      const keys = new Set(fields.map(f => f.key));
      onChange(columns.filter(c => !keys.has(c.fieldKey)));
    } else {
      // Select all missing from this table
      const existing = new Set(columns.map(c => c.fieldKey));
      const newCols = fields
        .filter(f => !existing.has(f.key))
        .map(f => ({ fieldKey: f.key, alias: f.label, visible: true }));
      const updated = columns.map(c =>
        fields.some(f => f.key === c.fieldKey) ? { ...c, visible: true } : c
      );
      onChange([...updated, ...newCols]);
    }
  };

  return (
    <div className="space-y-3">
      {selectedCount > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedCount} column{selectedCount !== 1 ? 's' : ''} selected
        </div>
      )}
      <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
        {[...grouped.entries()].map(([table, fields]) => {
          const allSelected = fields.every(f => isSelected(f.key));
          return (
            <div key={table}>
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="outline" className="text-xs">{table}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-1.5 text-muted-foreground"
                  onClick={() => selectAllForTable(fields)}
                >
                  {allSelected ? 'Deselect all' : 'Select all'}
                </Button>
              </div>
              <div className="space-y-1 ml-1">
                {fields.map(field => (
                  <div key={field.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`col-${field.key}`}
                      checked={isSelected(field.key)}
                      onCheckedChange={() => toggle(field)}
                    />
                    <Label htmlFor={`col-${field.key}`} className="text-sm cursor-pointer">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
