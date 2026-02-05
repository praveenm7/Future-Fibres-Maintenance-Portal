import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { SelectField, InputField, CheckboxField } from '@/components/ui/FormField';
import { periodicities } from '@/data/mockData';
import type { MaintenanceAction } from '@/types/maintenance';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useMaintenance } from '@/context/MaintenanceContext'; // Use context
import { toast } from 'sonner';

const months = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const emptyAction: MaintenanceAction = {
  id: '',
  machineId: '',
  action: '',
  periodicity: 'BEFORE EACH USE',
  timeNeeded: 5,
  maintenanceInCharge: false,
  status: 'IDEAL', // Default status
  month: 'JANUARY'
};

export default function MaintenancePlan() {
  const { machines, maintenanceActions, addMaintenanceAction, updateMaintenanceAction, deleteMaintenanceAction } = useMaintenance();

  // Default to first machine if available
  const [selectedMachineId, setSelectedMachineId] = useState('');

  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines]);

  // Use string ID for row selection
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [mode, setMode] = useState<'new' | 'edit'>('new');

  // Form State
  const [formData, setFormData] = useState(emptyAction);

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  // Filter actions by selected machine
  const machineActions = maintenanceActions.filter(a => a.machineId === selectedMachineId);

  // When row selected, populate form
  const handleRowClick = (item: MaintenanceAction) => {
    if (selectedRowId === item.id) {
      // Deselect
      resetForm();
    } else {
      setSelectedRowId(item.id);
      setMode('edit');
      setFormData({
        action: item.action,
        periodicity: item.periodicity,
        timeNeeded: item.timeNeeded,
        maintenanceInCharge: item.maintenanceInCharge,
        month: item.month || 'JANUARY'
      });
    }
  };

  const resetForm = () => {
    setSelectedRowId(null);
    setMode('new');
    setFormData(emptyAction);
  };

  const handleSave = () => {
    if (!formData.action) {
      toast.error("Action description is required");
      return;
    }

    if (mode === 'new') {
      if (!selectedMachineId) {
        toast.error("No machine selected");
        return;
      }
      const newActionItem: MaintenanceAction = {
        id: crypto.randomUUID(),
        machineId: selectedMachineId,
        ...formData,
        status: 'PENDING' // Default/Mock status
      };
      addMaintenanceAction(newActionItem);
      // Don't fully reset, user might want to add another similar one, but specific request usually implies reset
      setFormData(prev => ({ ...prev, action: '' }));
      toast.success("Added new action");
    } else if (mode === 'edit' && selectedRowId) {
      // Find existing to preserve ID and MachineID
      const existing = maintenanceActions.find(a => a.id === selectedRowId);
      if (existing) {
        const updated: MaintenanceAction = {
          ...existing,
          ...formData
        };
        updateMaintenanceAction(updated);
        resetForm();
      }
    }
  };

  const handleDelete = () => {
    if (selectedRowId) {
      if (confirm("Are you sure you want to delete this line?")) {
        deleteMaintenanceAction(selectedRowId);
        resetForm();
      }
    }
  };

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
    { key: 'month', header: 'MONTH', render: (item: MaintenanceAction) => item.month || '-' },
  ];

  return (
    <div>
      <PageHeader title="02-MAINTENANCE PLAN" />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Machine Selection */}
          <div className="flex items-center gap-4 border border-primary rounded overflow-hidden shadow-sm">
            <div className="bg-muted px-4 py-2 font-medium border-r border-border">MACHINE CODE</div>
            <select
              value={selectedMachineId}
              onChange={(e) => {
                setSelectedMachineId(e.target.value);
                resetForm();
              }}
              className="flex-1 bg-card text-foreground px-4 py-2 font-bold focus:outline-none"
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.finalCode}
                </option>
              ))}
            </select>
            <div className="bg-accent/50 px-4 py-2 italic border-l border-border truncate max-w-[200px]">
              {selectedMachine?.description}
            </div>
          </div>

          {/* Actions Table */}
          <DataTable
            columns={columns}
            data={machineActions}
            keyExtractor={(item) => item.id}
            onRowClick={handleRowClick}
            selectedId={selectedRowId || undefined}
          />

          {/* Table Actions */}
          <div className="flex gap-2">
            <ActionButton
              variant="green"
              className="flex items-center gap-2"
              onClick={resetForm}
              disabled={mode === 'new' && !selectedRowId} // "Add Mode" is default logic
            >
              <Plus className="h-4 w-4" />
              ADD NEW LINE
            </ActionButton>

            <ActionButton
              variant="blue"
              className="flex items-center gap-2"
              disabled={!selectedRowId}
              onClick={() => {
                // Focus logic
                const input = document.getElementById('action-input');
                if (input) input.focus();
              }}
            >
              <Pencil className="h-4 w-4" />
              {selectedRowId ? 'EDIT SELECTED' : 'SELECT A LINE TO EDIT'}
            </ActionButton>

            <ActionButton
              variant="red"
              className="flex-1 flex items-center justify-center gap-2 max-w-[200px]"
              disabled={!selectedRowId}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              {selectedRowId ? 'DELETE SELECTED' : 'DELETE LINE'}
            </ActionButton>
          </div>

          {/* Action Form */}
          <div className={`border rounded-lg overflow-hidden shadow-sm transition-colors duration-300 ${mode === 'edit' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-primary'}`}>
            <div className={`section-header flex justify-between items-center ${mode === 'edit' ? 'bg-blue-100 dark:bg-blue-900/20' : ''}`}>
              <span>{mode === 'edit' ? 'Edit Action' : 'Add New Action'}</span>
              {mode === 'edit' && (
                <button onClick={resetForm} className="text-xs flex items-center gap-1 hover:text-red-500 px-2 py-1 rounded">
                  <X className="h-3 w-3" /> Cancel Edit
                </button>
              )}
            </div>

            <div className="p-4 bg-card space-y-4">
              <p className="text-sm text-muted-foreground italic">
                {mode === 'edit'
                  ? 'Modify the details below and click UPDATE LINE.'
                  : 'Write the action description, and fulfill the rest of options. Then, click on ADD LINE.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  id="action-input"
                  label="ACTION"
                  value={formData.action}
                  onChange={(v) => setFormData(prev => ({ ...prev, action: v }))}
                  placeholder="Enter action description..."
                />
                <SelectField
                  label="PERIODICITY"
                  value={formData.periodicity}
                  onChange={(v) => setFormData(prev => ({ ...prev, periodicity: v as any }))}
                  options={periodicities.map(p => ({ value: p, label: p }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="TIME NEEDED (MIN)"
                  value={String(formData.timeNeeded)}
                  onChange={(v) => setFormData(prev => ({ ...prev, timeNeeded: parseInt(v) || 0 }))}
                  type="number"
                  min="0"
                />
                <CheckboxField
                  label="MAINT. IN CHARGE"
                  checked={formData.maintenanceInCharge}
                  onChange={(v) => setFormData(prev => ({ ...prev, maintenanceInCharge: v }))}
                />
                <SelectField
                  label="MONTH"
                  value={formData.month}
                  onChange={(v) => setFormData(prev => ({ ...prev, month: v }))}
                  options={months.map(m => ({ value: m, label: m }))}
                />
              </div>

              <div className="pt-2">
                <ActionButton
                  variant={mode === 'edit' ? 'blue' : 'green'}
                  className="w-full md:w-auto min-w-[150px]"
                  onClick={handleSave}
                >
                  {mode === 'edit' ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {mode === 'edit' ? 'UPDATE LINE' : 'ADD LINE'}
                </ActionButton>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Machine Info */}
        <div className="space-y-4">
          <div className="border border-primary rounded overflow-hidden shadow-sm bg-card">
            <div className="section-header">Machine Picture</div>
            <div className="p-4">
              <div className="aspect-square bg-muted/50 rounded flex items-center justify-center border-2 border-dashed border-border">
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

          <div className="text-sm text-muted-foreground italic p-3 bg-card border border-border rounded shadow-sm">
            <p className="font-medium mb-2 text-primary">Instructions:</p>
            <p>Manage maintenance actions. Create, edit or delete them.</p>
            <p className="mt-2">Select a row in the table to <strong>Edit</strong> or <strong>Delete</strong> it.</p>
          </div>

          <div className="border border-primary rounded overflow-hidden shadow-sm bg-card">
            <div className="section-header">Machine Info</div>
            <div className="p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Code:</span>
                <span className="font-medium">{selectedMachine?.finalCode || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area:</span>
                <span className="font-medium">{selectedMachine?.area || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Charge:</span>
                <span className="font-medium">{selectedMachine?.personInCharge || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
