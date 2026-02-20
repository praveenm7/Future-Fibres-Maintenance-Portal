import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import { SelectField, InputField, CheckboxField } from '@/components/ui/FormField';
import type { MaintenanceAction } from '@/types/maintenance';
import { Plus, Pencil, Trash2, Save, X, Loader2, Wrench } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMachines } from '@/hooks/useMachines';
import { useMaintenanceActions } from '@/hooks/useMaintenanceActions';
import { useMaintenanceExecutions } from '@/hooks/useMaintenanceExecutions';
import { useListOptions } from '@/hooks/useListOptions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { maintenanceActionFormSchema, type MaintenanceActionFormValues } from '@/lib/schemas/maintenanceActionSchema';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';
const SERVER_BASE = API_BASE_URL.replace('/api', '');

const months = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const defaultValues: MaintenanceActionFormValues = {
  action: '',
  periodicity: '',
  timeNeeded: '' as unknown as number,
  maintenanceInCharge: false,
  status: '',
  month: '',
};

export default function MaintenancePlan() {
  const { useGetMachines } = useMachines();
  const {
    useGetActions,
    useCreateAction,
    useUpdateAction,
    useDeleteAction
  } = useMaintenanceActions();
  const { useGetListOptions } = useListOptions();
  const { useGetExecutionStats } = useMaintenanceExecutions();

  const { data: machines = [], isLoading: loadingMachines, isError: errorMachines, refetch: refetchMachines } = useGetMachines();
  const [selectedMachineId, setSelectedMachineId] = useState('');

  const { data: machineActions = [], isLoading: loadingActions, isError: errorActions, refetch: refetchActions } = useGetActions(selectedMachineId);
  const { data: executionStats = [] } = useGetExecutionStats(selectedMachineId);
  const { data: periodicityOptions = [] } = useGetListOptions('PERIODICITY');

  // Build a lookup map for execution stats by actionId
  const statsMap = new Map(executionStats.map(s => [s.actionId, s]));
  const createMutation = useCreateAction();
  const updateMutation = useUpdateAction();
  const deleteMutation = useDeleteAction();

  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines]);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<MaintenanceActionFormValues>({
    resolver: zodResolver(maintenanceActionFormSchema),
    defaultValues,
  });

  const formValues = watch();

  // Unsaved changes warning
  useUnsavedChanges(isDirty);


  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  const handleRowClick = (item: MaintenanceAction) => {
    if (selectedRowId === item.id) {
      resetForm();
    } else {
      setSelectedRowId(item.id);
      setMode('edit');
      reset({
        action: item.action,
        periodicity: item.periodicity,
        timeNeeded: item.timeNeeded,
        maintenanceInCharge: item.maintenanceInCharge,
        status: item.status,
        month: item.month || 'JANUARY',
      });
    }
  };

  const resetForm = () => {
    setSelectedRowId(null);
    setMode('new');
    reset(defaultValues);
  };

  const onSubmit = async (data: MaintenanceActionFormValues) => {
    try {
      if (mode === 'new') {
        if (!selectedMachineId) {
          toast.error("No machine selected");
          return;
        }
        await createMutation.mutateAsync({
          id: '',
          machineId: selectedMachineId,
          ...data,
          status: 'IDEAL' as const,
        });
        reset({ ...defaultValues, periodicity: data.periodicity, month: data.month });
      } else if (mode === 'edit' && selectedRowId) {
        await updateMutation.mutateAsync({
          id: selectedRowId,
          data: {
            id: selectedRowId,
            machineId: selectedMachineId,
            ...data,
          } as MaintenanceAction,
        });
        resetForm();
      }
    } catch {
      // Handled by mutation toast
    }
  };

  const handleDelete = async () => {
    if (selectedRowId) {
      if (confirm("Are you sure you want to delete this line?")) {
        try {
          await deleteMutation.mutateAsync(selectedRowId);
          resetForm();
        } catch {
          // Handled by mutation toast
        }
      }
    }
  };

  const handleBulkDelete = async () => {
    if (bulkSelectedIds.length === 0) return;
    if (!confirm(`Delete ${bulkSelectedIds.length} maintenance action(s)?`)) return;
    try {
      for (const id of bulkSelectedIds) {
        await deleteMutation.mutateAsync(id);
      }
      setBulkSelectedIds([]);
      resetForm();
    } catch {
      // Handled by mutation toast
    }
  };

  if (loadingMachines) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading machines...</p>
      </div>
    );
  }

  if (errorMachines) return <QueryError onRetry={refetchMachines} />;

  const columns = [
    { key: 'action', header: 'ACTION', className: 'max-w-[300px]' },
    { key: 'periodicity', header: 'PERIODICITY' },
    { key: 'timeNeeded', header: 'TIME', render: (item: MaintenanceAction) => `${item.timeNeeded} min` },
    { key: 'maintenanceInCharge', header: 'MAINT. NEEDED', render: (item: MaintenanceAction) => item.maintenanceInCharge ? 'Y' : 'N' },
    { key: 'status', header: 'STATUS' },
    { key: 'month', header: 'MONTH', render: (item: MaintenanceAction) => item.month || '-' },
    { key: 'completion', header: 'COMPLETION', render: (item: MaintenanceAction) => {
      const stats = statsMap.get(item.id);
      if (!stats || stats.totalRecords === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <span className={stats.completionRate >= 75 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : stats.completionRate >= 50 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}>
          {stats.totalCompleted}/{stats.totalRecords}
        </span>
      );
    }},
    { key: 'lastDone', header: 'LAST DONE', render: (item: MaintenanceAction) => {
      const stats = statsMap.get(item.id);
      if (!stats?.lastCompletedDate) return <span className="text-muted-foreground">—</span>;
      return new Date(stats.lastCompletedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }},
  ];

  return (
    <div>
      <PageHeader title="Maintenance Plan" />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          {/* Machine Selection */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center">
              <div className="bg-muted/40 px-4 py-2.5 text-sm font-medium border-r border-border">Machine Code</div>
              <select
                value={selectedMachineId}
                onChange={(e) => { setSelectedMachineId(e.target.value); resetForm(); setBulkSelectedIds([]); }}
                className="flex-1 bg-transparent text-foreground text-sm px-4 py-2.5 font-medium focus:outline-none"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.finalCode}</option>
                ))}
              </select>
              <div className="px-4 py-2.5 text-sm text-muted-foreground border-l border-border truncate max-w-[200px]">
                {selectedMachine?.description}
              </div>
            </div>
          </div>

          {/* Actions Table */}
          {loadingActions ? (
            <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading maintenance actions...</p>
            </div>
          ) : errorActions ? (
            <QueryError onRetry={refetchActions} />
          ) : machineActions.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No maintenance actions"
              description="No maintenance actions have been defined for this machine yet."
            />
          ) : (
            <div>
              <DataTable
                columns={columns}
                data={machineActions}
                keyExtractor={(item) => item.id}
                onRowClick={handleRowClick}
                selectedId={selectedRowId || undefined}
                selectable
                selectedIds={bulkSelectedIds}
                onSelectionChange={setBulkSelectedIds}
              />
              <BulkActionsBar
                selectedCount={bulkSelectedIds.length}
                onClear={() => setBulkSelectedIds([])}
                actions={[
                  {
                    label: 'Delete Selected',
                    icon: <Trash2 className="h-3.5 w-3.5" />,
                    onClick: handleBulkDelete,
                    variant: 'destructive',
                  },
                ]}
              />
            </div>
          )}

          {/* Table Actions */}
          <div className="flex gap-2">
            <ActionButton variant="green" className="gap-2" onClick={resetForm} disabled={mode === 'new' && !selectedRowId}>
              <Plus className="h-4 w-4" /> Add New
            </ActionButton>
            <ActionButton variant="blue" className="gap-2" disabled={!selectedRowId || updateMutation.isPending}
              onClick={() => { const input = document.getElementById('action-input'); if (input) input.focus(); }}>
              <Pencil className="h-4 w-4" /> {selectedRowId ? 'Edit Selected' : 'Select to Edit'}
            </ActionButton>
            <ActionButton variant="red" className="gap-2" disabled={!selectedRowId || deleteMutation.isPending} onClick={handleDelete}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {selectedRowId ? 'Delete Selected' : 'Delete'}
            </ActionButton>
          </div>

          {/* Action Form */}
          <form onSubmit={handleSubmit(onSubmit)} className={`bg-card border rounded-lg overflow-hidden transition-colors duration-200 ${mode === 'edit' ? 'border-primary/50' : 'border-border'}`}>
            <div className={`section-header flex justify-between items-center ${mode === 'edit' ? 'bg-primary/5' : ''}`}>
              <span>{mode === 'edit' ? 'Edit Action' : 'Add New Action'}</span>
              {mode === 'edit' && (
                <button type="button" onClick={resetForm} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-destructive px-2 py-1 rounded transition-colors">
                  <X className="h-3 w-3" /> Cancel
                </button>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField id="action-input" label="Action" value={formValues.action}
                  onChange={(v) => setValue('action', v, { shouldValidate: true, shouldDirty: true })}
                  placeholder="Enter action description..." disabled={createMutation.isPending || updateMutation.isPending}
                  required error={errors.action?.message} />
                <SelectField label="Periodicity" value={formValues.periodicity}
                  onChange={(v) => setValue('periodicity', v, { shouldDirty: true })}
                  options={periodicityOptions.map(p => ({ value: p.value, label: p.value }))}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  required error={errors.periodicity?.message} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Time Needed (min)" value={String(formValues.timeNeeded)}
                  onChange={(v) => setValue('timeNeeded', parseInt(v) || 0, { shouldValidate: true, shouldDirty: true })}
                  type="number" min="0" disabled={createMutation.isPending || updateMutation.isPending}
                  error={errors.timeNeeded?.message} />
                <CheckboxField label="Maintenance In Charge" checked={formValues.maintenanceInCharge}
                  onChange={(v) => setValue('maintenanceInCharge', v, { shouldDirty: true })}
                  disabled={createMutation.isPending || updateMutation.isPending} />
                <SelectField label="Month" value={formValues.month}
                  onChange={(v) => setValue('month', v, { shouldDirty: true })}
                  options={months.map(m => ({ value: m, label: m }))}
                  disabled={createMutation.isPending || updateMutation.isPending} />
              </div>
              <div className="pt-2">
                <ActionButton variant={mode === 'edit' ? 'blue' : 'green'} className="min-w-[140px]"
                  type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : ( mode === 'edit' ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" /> )}
                  {mode === 'edit' ? 'Update' : 'Add Line'}
                </ActionButton>
              </div>
            </div>
          </form>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="section-header">Machine Picture</div>
            <div className="p-4">
              <div className="aspect-square bg-muted/30 rounded-md flex items-center justify-center border border-dashed border-border">
                {selectedMachine?.imageUrl ? (
                  <img src={selectedMachine.imageUrl.startsWith('http') ? selectedMachine.imageUrl : `${SERVER_BASE}${selectedMachine.imageUrl}`} alt="Machine" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-muted-foreground text-sm">No image</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="section-header">Machine Info</div>
            <div className="p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Code</span>
                <span className="font-medium">{selectedMachine?.finalCode || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area</span>
                <span className="font-medium">{selectedMachine?.area || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Charge</span>
                <span className="font-medium">{selectedMachine?.personInCharge || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
