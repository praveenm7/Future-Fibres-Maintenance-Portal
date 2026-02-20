import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import { InputField } from '@/components/ui/FormField';
import type { SparePart } from '@/types/maintenance';
import { Plus, Pencil, Trash2, ExternalLink, Save, X, Loader2, Upload, Package } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { DataImportDialog } from '@/components/ui/DataImportDialog';
import { useMachines } from '@/hooks/useMachines';
import { useSpareParts } from '@/hooks/useSpareParts';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { sparePartFormSchema, type SparePartFormValues } from '@/lib/schemas/sparePartSchema';
import { toast } from 'sonner';

const defaultValues: SparePartFormValues = {
  description: '',
  reference: '',
  quantity: 0,
  link: '',
};

export default function SpareParts() {
  const { useGetMachines } = useMachines();
  const {
    useGetParts,
    useCreatePart,
    useUpdatePart,
    useDeletePart
  } = useSpareParts();

  const { data: machines = [], isLoading: loadingMachines, isError: errorMachines, refetch: refetchMachines } = useGetMachines();
  const [selectedMachineId, setSelectedMachineId] = useState('');

  const { data: machineParts = [], isLoading: loadingParts, isError: errorParts, refetch: refetchParts } = useGetParts(selectedMachineId);
  const createMutation = useCreatePart();
  const updateMutation = useUpdatePart();
  const deleteMutation = useDeletePart();

  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines]);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SparePartFormValues>({
    resolver: zodResolver(sparePartFormSchema),
    defaultValues,
  });

  const formValues = watch();

  // Unsaved changes warning
  useUnsavedChanges(isDirty);


  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  const resetForm = () => {
    setMode('new');
    setSelectedRowId(null);
    reset(defaultValues);
  };

  const handleRowClick = (item: SparePart) => {
    if (selectedRowId === item.id) {
      resetForm();
    } else {
      setSelectedRowId(item.id);
      setMode('edit');
      reset({
        description: item.description,
        reference: item.reference,
        quantity: item.quantity,
        link: item.link,
      });
    }
  };

  const onSubmit = async (data: SparePartFormValues) => {
    try {
      if (mode === 'new') {
        if (!selectedMachineId) {
          toast.error("Select a machine first");
          return;
        }
        await createMutation.mutateAsync({ machineId: selectedMachineId, ...data });
        resetForm();
      } else if (mode === 'edit' && selectedRowId) {
        await updateMutation.mutateAsync({ id: selectedRowId, data });
        resetForm();
      }
    } catch {
      // Handled by mutation toast
    }
  };

  const handleDelete = async () => {
    if (selectedRowId) {
      if (confirm("Delete this spare part?")) {
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
    if (!confirm(`Delete ${bulkSelectedIds.length} spare part(s)?`)) return;
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
    { key: 'description', header: 'DESCRIPTION' },
    { key: 'reference', header: 'REFERENCE' },
    { key: 'quantity', header: 'QUANTITY' },
    {
      key: 'link',
      header: 'LINK',
      render: (item: SparePart) => (
        <a
          href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {item.link}
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Spare Parts" />

      <div className="space-y-6">
        {/* Machine Selection */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center">
            <div className="bg-muted/40 px-4 py-2.5 text-sm font-medium border-r border-border">Machine Code</div>
            <select
              value={selectedMachineId}
              onChange={(e) => { setSelectedMachineId(e.target.value); resetForm(); setBulkSelectedIds([]); }}
              className="flex-1 bg-transparent text-foreground text-sm px-4 py-2.5 font-medium max-w-xs focus:outline-none"
            >
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.finalCode}</option>
              ))}
            </select>
            <div className="px-4 py-2.5 text-sm text-muted-foreground flex-1 border-l border-border truncate">
              {selectedMachine?.description}
            </div>
          </div>
        </div>

        {/* Spare Parts Table */}
        {loadingParts ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading spare parts...</p>
          </div>
        ) : errorParts ? (
          <QueryError onRetry={refetchParts} />
        ) : machineParts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No spare parts"
            description="No spare parts have been registered for this machine yet."
          />
        ) : (
          <div>
            <DataTable
              columns={columns}
              data={machineParts}
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
        <div className="flex gap-2 flex-wrap">
          <ActionButton variant="green" className="gap-2" onClick={resetForm} disabled={mode === 'new' && !selectedRowId}>
            <Plus className="h-4 w-4" /> Add New
          </ActionButton>
          <ActionButton variant="blue" className="gap-2" disabled={!selectedRowId || updateMutation.isPending}
            onClick={() => { const input = document.getElementById('part-description'); if (input) input.focus(); }}>
            <Pencil className="h-4 w-4" /> {selectedRowId ? 'Edit Selected' : 'Select to Edit'}
          </ActionButton>
          <ActionButton variant="red" className="gap-2" disabled={!selectedRowId || deleteMutation.isPending} onClick={handleDelete}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {selectedRowId ? 'Delete Selected' : 'Delete'}
          </ActionButton>
          <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4" /> Import
          </Button>
        </div>

        {/* Add Part Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={`bg-card border rounded-lg overflow-hidden transition-colors duration-200 ${mode === 'edit' ? 'border-primary/50' : 'border-border'}`}>
          <div className={`section-header flex justify-between items-center ${mode === 'edit' ? 'bg-primary/5' : ''}`}>
            <span>{mode === 'edit' ? 'Edit Spare Part' : 'Add Spare Part'}</span>
            {mode === 'edit' && (
              <button type="button" onClick={resetForm} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-destructive px-2 py-1 rounded transition-colors">
                <X className="h-3 w-3" /> Cancel
              </button>
            )}
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputField id="part-description" label="Description" value={formValues.description}
                onChange={(v) => setValue('description', v, { shouldValidate: true, shouldDirty: true })}
                placeholder="Part name..." disabled={createMutation.isPending || updateMutation.isPending}
                required error={errors.description?.message} />
              <InputField label="Reference" value={formValues.reference}
                onChange={(v) => setValue('reference', v, { shouldDirty: true })}
                placeholder="REF0000" disabled={createMutation.isPending || updateMutation.isPending} />
              <InputField label="Quantity" value={String(formValues.quantity)}
                onChange={(v) => setValue('quantity', parseInt(v) || 0, { shouldValidate: true, shouldDirty: true })}
                type="number" min="0" disabled={createMutation.isPending || updateMutation.isPending}
                error={errors.quantity?.message} />
              <InputField label="Link" value={formValues.link}
                onChange={(v) => setValue('link', v, { shouldDirty: true })}
                placeholder="www.example.com" disabled={createMutation.isPending || updateMutation.isPending} />
            </div>
            <div className="pt-4">
              <ActionButton variant={mode === 'edit' ? 'blue' : 'green'} className="min-w-[140px]"
                type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  mode === 'edit' ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
                )}
                {mode === 'edit' ? 'Update' : 'Add Line'}
              </ActionButton>
            </div>
          </div>
        </form>

        <DataImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          title="Import Spare Parts"
          targetFields={[
            { key: 'description', label: 'Description', required: true },
            { key: 'reference', label: 'Reference' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'link', label: 'Link' },
          ]}
          onImport={async (rows) => {
            if (!selectedMachineId) {
              throw new Error('No machine selected');
            }
            for (const row of rows) {
              await createMutation.mutateAsync({
                machineId: selectedMachineId,
                description: row.description || '',
                reference: row.reference || '',
                quantity: parseInt(row.quantity) || 1,
                link: row.link || '',
              });
            }
          }}
        />
      </div>
    </div>
  );
}
