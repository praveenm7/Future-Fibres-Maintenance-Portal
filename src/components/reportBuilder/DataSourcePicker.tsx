import { Checkbox } from '@/components/ui/checkbox';
import { TABLES } from '@/lib/reportBuilder/metadataRegistry';

const TABLE_DESCRIPTIONS: Record<string, string> = {
  Machines: 'Equipment details, areas, manufacturers, costs',
  MaintenanceActions: 'Scheduled maintenance tasks and periodicities',
  MaintenanceExecutions: 'Completed/pending execution records',
  SpareParts: 'Spare part inventory and stock levels',
  Operators: 'Team members, departments, roles',
  SupportTickets: 'Support requests, priorities, statuses',
  Shifts: 'Shift schedules and timings',
  AuthorizationMatrix: 'Operator-machine authorization records',
};

interface DataSourcePickerProps {
  selected: string[];
  onChange: (dataSources: string[]) => void;
}

export function DataSourcePicker({ selected, onChange }: DataSourcePickerProps) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(s => s !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-1.5">
      {TABLES.map(table => (
        <label
          key={table.key}
          className="flex items-start gap-2.5 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
        >
          <Checkbox
            id={`ds-${table.key}`}
            checked={selected.includes(table.key)}
            onCheckedChange={() => toggle(table.key)}
            className="mt-0.5"
          />
          <div className="min-w-0">
            <span className="text-sm font-medium leading-none">{table.label}</span>
            {TABLE_DESCRIPTIONS[table.key] && (
              <p className="text-xs text-muted-foreground mt-0.5">{TABLE_DESCRIPTIONS[table.key]}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
