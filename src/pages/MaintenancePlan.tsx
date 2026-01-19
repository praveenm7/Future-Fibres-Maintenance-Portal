import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { SelectField, InputField, CheckboxField } from '@/components/ui/FormField';
import { machines, maintenanceActions, periodicities } from '@/data/mockData';
import type { MaintenanceAction } from '@/types/maintenance';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const months = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export default function MaintenancePlan() {
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || '');
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [newAction, setNewAction] = useState({
    action: '',
    periodicity: 'BEFORE EACH USE',
    timeNeeded: 5,
    maintenanceInCharge: false,
    month: 'JANUARY',
  });

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const machineActions = maintenanceActions.filter(a => a.machineId === selectedMachineId);

  const columns = [
    { 
      key: 'action', 
      header: 'ACTION',
      className: 'max-w-[300px]'
    },
    { key: 'periodicity', header: 'PERIODICITY' },
    { 
      key: 'timeNeeded', 
      header: 'TIME',
      render: (item: MaintenanceAction) => `${item.timeNeeded} min`
    },
    { 
      key: 'maintenanceInCharge', 
      header: 'MAINT. NEEDED',
      render: (item: MaintenanceAction) => item.maintenanceInCharge ? 'Y' : 'N'
    },
    { key: 'status', header: 'STATUS' },
    { key: 'month', header: 'MONTH', render: () => '-' },
  ];

  return (
    <div>
      <PageHeader title="02-MAINTENANCE PLAN" subtitle="CREATION/MODIFICATION" />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Machine Selection */}
          <div className="flex items-center gap-4 border border-primary rounded overflow-hidden">
            <div className="bg-muted px-4 py-2 font-medium">MACHINE CODE</div>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="flex-1 bg-accent text-accent-foreground px-4 py-2 font-bold"
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.finalCode}
                </option>
              ))}
            </select>
            <div className="bg-card px-4 py-2 italic">
              {selectedMachine?.description}
            </div>
          </div>

          {/* Actions Table */}
          <DataTable
            columns={columns}
            data={machineActions}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => setSelectedRow(item.id)}
            selectedId={selectedRow || undefined}
          />

          {/* Table Actions */}
          <div className="flex gap-2">
            <ActionButton variant="green" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              ADD LINE
            </ActionButton>
            <ActionButton variant="blue" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              EDIT LINE {selectedRow ? selectedRow : ''}
            </ActionButton>
            <ActionButton variant="red" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              DELETE LINE {selectedRow ? selectedRow : ''}
            </ActionButton>
          </div>

          {/* New Action Form */}
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Add New Action</div>
            <div className="p-4 bg-card space-y-4">
              <p className="text-sm text-muted-foreground italic">
                Write the action description, and fulfill the rest of options. Then, click on ADD LINE
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="ACTION"
                  value={newAction.action}
                  onChange={(v) => setNewAction(prev => ({ ...prev, action: v }))}
                  placeholder="Enter action description..."
                />
                <SelectField
                  label="PERIODICITY"
                  value={newAction.periodicity}
                  onChange={(v) => setNewAction(prev => ({ ...prev, periodicity: v }))}
                  options={periodicities.map(p => ({ value: p, label: p }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="TIME NEEDED"
                  value={String(newAction.timeNeeded)}
                  onChange={(v) => setNewAction(prev => ({ ...prev, timeNeeded: parseInt(v) || 0 }))}
                  type="number"
                />
                <CheckboxField
                  label="MAINT. IN CHARGE"
                  checked={newAction.maintenanceInCharge}
                  onChange={(v) => setNewAction(prev => ({ ...prev, maintenanceInCharge: v }))}
                />
                <SelectField
                  label="MONTH"
                  value={newAction.month}
                  onChange={(v) => setNewAction(prev => ({ ...prev, month: v }))}
                  options={months.map(m => ({ value: m, label: m }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Machine Info */}
        <div className="space-y-4">
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Machine Picture</div>
            <div className="p-4 bg-card">
              <div className="aspect-square bg-muted rounded flex items-center justify-center border-2 border-dashed border-border">
                {selectedMachine?.imageUrl ? (
                  <img 
                    src={selectedMachine.imageUrl} 
                    alt="Machine" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">No image</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground italic p-3 bg-card border border-border rounded">
            <p className="font-medium mb-2">Instructions:</p>
            <p>Manage maintenance actions. Create, edit or delete them.</p>
            <p className="mt-2">We should be able to select an existing line on the table and DELETE or EDIT</p>
          </div>

          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Machine Info</div>
            <div className="p-3 bg-card space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Code:</span>
                <span className="font-medium">{selectedMachine?.finalCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area:</span>
                <span className="font-medium">{selectedMachine?.area}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Charge:</span>
                <span className="font-medium">{selectedMachine?.personInCharge}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
