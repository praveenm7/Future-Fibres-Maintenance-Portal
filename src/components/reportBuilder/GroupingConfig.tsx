import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { getFieldsForTables } from '@/lib/reportBuilder/metadataRegistry';
import type { ReportAggregation, AggregationFunction } from '@/types/reportBuilder';

interface GroupingConfigProps {
  dataSources: string[];
  groupBy: string[];
  aggregations: ReportAggregation[];
  onGroupByChange: (groupBy: string[]) => void;
  onAggregationsChange: (aggregations: ReportAggregation[]) => void;
}

const AGG_FUNCTIONS: AggregationFunction[] = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

export function GroupingConfig({
  dataSources, groupBy, aggregations,
  onGroupByChange, onAggregationsChange,
}: GroupingConfigProps) {
  const allFields = getFieldsForTables(dataSources);
  const aggreableFields = allFields.filter(f => f.aggregatable);

  const toggleGroupBy = (key: string) => {
    if (groupBy.includes(key)) {
      onGroupByChange(groupBy.filter(g => g !== key));
    } else {
      onGroupByChange([...groupBy, key]);
    }
  };

  const addAggregation = () => {
    if (aggreableFields.length === 0) return;
    const field = aggreableFields[0];
    onAggregationsChange([...aggregations, {
      fieldKey: field.key,
      function: 'COUNT',
      alias: `COUNT_${field.dbColumn}`,
    }]);
  };

  const updateAgg = (index: number, patch: Partial<ReportAggregation>) => {
    onAggregationsChange(aggregations.map((a, i) => i === index ? { ...a, ...patch } : a));
  };

  const removeAgg = (index: number) => {
    onAggregationsChange(aggregations.filter((_, i) => i !== index));
  };

  if (dataSources.length === 0) {
    return <p className="text-sm text-muted-foreground">Choose data in Step 1 first</p>;
  }

  return (
    <div className="space-y-4">
      {/* Group By */}
      <div>
        <p className="text-xs font-medium mb-2 text-muted-foreground">Group By</p>
        <div className="space-y-1 max-h-[150px] overflow-y-auto">
          {allFields.filter(f => f.dataType === 'string' || f.dataType === 'boolean' || f.dataType === 'date').map(field => (
            <div key={field.key} className="flex items-center gap-2">
              <Checkbox
                id={`gb-${field.key}`}
                checked={groupBy.includes(field.key)}
                onCheckedChange={() => toggleGroupBy(field.key)}
              />
              <Label htmlFor={`gb-${field.key}`} className="text-xs cursor-pointer">{field.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Aggregations */}
      <div>
        <p className="text-xs font-medium mb-2 text-muted-foreground">Aggregations</p>
        <div className="space-y-2">
          {aggregations.map((agg, i) => (
            <div key={i} className="flex gap-2 items-center flex-wrap">
              <Select value={agg.function} onValueChange={v => updateAgg(i, { function: v as AggregationFunction })}>
                <SelectTrigger className="w-[90px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGG_FUNCTIONS.map(fn => (
                    <SelectItem key={fn} value={fn} className="text-xs">{fn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={agg.fieldKey} onValueChange={v => updateAgg(i, { fieldKey: v })}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aggreableFields.map(f => (
                    <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={agg.alias}
                onChange={e => updateAgg(i, { alias: e.target.value })}
                placeholder="Alias..."
                className="w-[120px] h-8 text-xs"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeAgg(i)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addAggregation} className="h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Aggregation
          </Button>
        </div>
      </div>
    </div>
  );
}
