import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { COMPUTED_FIELDS } from '@/lib/reportBuilder/metadataRegistry';

interface ComputedFieldPickerProps {
  dataSources: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ComputedFieldPicker({ dataSources, selected, onChange }: ComputedFieldPickerProps) {
  // Only show computed fields whose required tables are all in the selected data sources
  const available = COMPUTED_FIELDS.filter(cf =>
    cf.requiredTables.every(t => dataSources.includes(t))
  );

  if (available.length === 0) {
    return <p className="text-xs text-muted-foreground">No computed fields available for selected data sources</p>;
  }

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(s => s !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-2">
      {available.map(cf => (
        <div key={cf.key} className="flex items-center gap-2">
          <Checkbox
            id={`cf-${cf.key}`}
            checked={selected.includes(cf.key)}
            onCheckedChange={() => toggle(cf.key)}
          />
          <Label htmlFor={`cf-${cf.key}`} className="text-sm cursor-pointer">
            {cf.label}
            {cf.requiresGroupBy && (
              <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">requires grouping</Badge>
            )}
          </Label>
        </div>
      ))}
    </div>
  );
}
