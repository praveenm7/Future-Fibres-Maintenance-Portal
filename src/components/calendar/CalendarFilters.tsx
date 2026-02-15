import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Machine } from '@/types/maintenance';
import {
  ALL_PERIODICITIES,
  PERIODICITY_COLORS,
  Periodicity,
} from './calendarUtils';
import { CalendarFilterState } from './useCalendarFilters';

interface CalendarFiltersProps {
  filters: CalendarFilterState;
  onFilterChange: <K extends keyof CalendarFilterState>(
    key: K,
    value: CalendarFilterState[K]
  ) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  areas: string[];
  machines: Machine[];
}

export function CalendarFilters({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
  areas,
  machines,
}: CalendarFiltersProps) {
  const togglePeriodicity = (p: Periodicity) => {
    const current = filters.periodicities;
    const next = current.includes(p)
      ? current.filter((x) => x !== p)
      : [...current, p];
    onFilterChange('periodicities', next);
  };

  return (
    <div className="p-3 space-y-4">
      {/* Active filters header */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClearFilters}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        </div>
      )}

      {/* Area */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Area
        </label>
        <Select
          value={filters.area || '__all__'}
          onValueChange={(v) =>
            onFilterChange('area', v === '__all__' ? null : v)
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Areas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Machine */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Machine
        </label>
        <Select
          value={filters.machineIds[0] || '__all__'}
          onValueChange={(v) =>
            onFilterChange('machineIds', v === '__all__' ? [] : [v])
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Machines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Machines</SelectItem>
            {machines.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.finalCode} — {m.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Periodicity */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Periodicity
        </label>
        <div className="flex flex-wrap gap-1">
          {ALL_PERIODICITIES.map((p) => {
            const isSelected = filters.periodicities.includes(p);
            const colors = PERIODICITY_COLORS[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePeriodicity(p)}
                className={cn(
                  'text-[10px] px-2 py-1 rounded-full border transition-colors font-medium',
                  isSelected
                    ? cn(colors.bg, colors.text, colors.border)
                    : 'border-border text-muted-foreground hover:border-foreground/30'
                )}
              >
                {colors.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Status
        </label>
        <div className="flex gap-1">
          {(['ALL', 'IDEAL', 'MANDATORY'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onFilterChange('status', s)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md border transition-colors flex-1',
                filters.status === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Maintenance In Charge */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Maintenance In Charge
        </label>
        <div className="flex gap-1">
          {(['all', 'yes', 'no'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onFilterChange('maintenanceInCharge', v)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md border transition-colors flex-1',
                filters.maintenanceInCharge === v
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
