import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { getFieldsForTables, getField } from '@/lib/reportBuilder/metadataRegistry';
import { FILTER_OPERATORS, FILTER_OPERATORS_BY_TYPE } from '@/types/reportBuilder';
import type { ReportFilter, FilterOperator } from '@/types/reportBuilder';

interface FilterBuilderProps {
  dataSources: string[];
  filters: ReportFilter[];
  onChange: (filters: ReportFilter[]) => void;
}

const NO_VALUE_OPS: FilterOperator[] = ['isNull', 'isNotNull'];

export function FilterBuilder({ dataSources, filters, onChange }: FilterBuilderProps) {
  const availableFields = getFieldsForTables(dataSources);

  const addFilter = () => {
    if (availableFields.length === 0) return;
    const first = availableFields.find(f => f.filterable) || availableFields[0];
    const ops = FILTER_OPERATORS_BY_TYPE[first.dataType];
    onChange([...filters, { fieldKey: first.key, operator: ops[0], value: '' }]);
  };

  const updateFilter = (index: number, patch: Partial<ReportFilter>) => {
    onChange(filters.map((f, i) => i === index ? { ...f, ...patch } : f));
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, fieldKey: string) => {
    const fieldInfo = getField(fieldKey);
    if (!fieldInfo) return;
    const ops = FILTER_OPERATORS_BY_TYPE[fieldInfo.field.dataType];
    updateFilter(index, { fieldKey, operator: ops[0], value: '' });
  };

  if (dataSources.length === 0) {
    return <p className="text-sm text-muted-foreground">Choose data in Step 1 first</p>;
  }

  return (
    <div className="space-y-2">
      {filters.map((filter, i) => {
        const fieldInfo = getField(filter.fieldKey);
        const dataType = fieldInfo?.field.dataType || 'string';
        const validOps = FILTER_OPERATORS_BY_TYPE[dataType];
        const filterOptions = fieldInfo?.field.filterOptions;
        const showValue = !NO_VALUE_OPS.includes(filter.operator);

        return (
          <div key={i} className="flex gap-2 items-start flex-wrap">
            {/* Field selector */}
            <Select value={filter.fieldKey} onValueChange={v => handleFieldChange(i, v)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableFields.filter(f => f.filterable).map(f => (
                  <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator */}
            <Select value={filter.operator} onValueChange={v => updateFilter(i, { operator: v as FilterOperator })}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {validOps.map(op => (
                  <SelectItem key={op} value={op} className="text-xs">{FILTER_OPERATORS[op]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value input */}
            {showValue && (
              filterOptions ? (
                <Select value={String(filter.value)} onValueChange={v => updateFilter(i, { value: v })}>
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map(opt => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={String(filter.value ?? '')}
                  onChange={e => updateFilter(i, { value: e.target.value })}
                  placeholder="Value..."
                  className="w-[150px] h-8 text-xs"
                  type={dataType === 'number' || dataType === 'decimal' ? 'number' : dataType === 'date' ? 'date' : 'text'}
                />
              )
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeFilter(i)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}

      <Button variant="outline" size="sm" onClick={addFilter} className="h-8 text-xs">
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Filter
      </Button>
    </div>
  );
}
