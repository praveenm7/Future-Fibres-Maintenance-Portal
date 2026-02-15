import type { DashboardFilters as FilterType } from '@/types/dashboards';

interface DashboardFiltersProps {
    filters: FilterType;
    onFiltersChange: (filters: FilterType) => void;
    showAreaFilter?: boolean;
    showTypeFilter?: boolean;
    areas?: string[];
}

const DEFAULT_AREAS = ['IHM', 'PRODUCTION', 'ASSEMBLY', 'TESTING'];
const MACHINE_TYPES = ['MACHINE', 'TOOLING'];

export function DashboardFiltersBar({
    filters,
    onFiltersChange,
    showAreaFilter = true,
    showTypeFilter = false,
    areas = DEFAULT_AREAS,
}: DashboardFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {showAreaFilter && (
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Area</label>
                    <select
                        value={filters.area || ''}
                        onChange={(e) => onFiltersChange({ ...filters, area: e.target.value || undefined })}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <option value="">All Areas</option>
                        {areas.map(area => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>
                </div>
            )}
            {showTypeFilter && (
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Type</label>
                    <select
                        value={filters.machineType || ''}
                        onChange={(e) => onFiltersChange({ ...filters, machineType: e.target.value || undefined })}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <option value="">All Types</option>
                        {MACHINE_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            )}
            {(filters.area || filters.machineType) && (
                <button
                    onClick={() => onFiltersChange({})}
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}
