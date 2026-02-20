import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { BulkActionsBar } from '@/components/ui/BulkActionsBar';
import { InputField } from '@/components/ui/FormField';
import type { NCComment } from '@/types/maintenance';
import { Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { useMachines } from '@/hooks/useMachines';
import { useNonConformities } from '@/hooks/useNonConformities';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { ncCommentFormSchema, type NCCommentFormValues } from '@/lib/schemas/ncCommentSchema';
import { toast } from 'sonner';

const getDefaultValues = (): NCCommentFormValues => ({
  date: new Date().toLocaleDateString('en-GB'),
  comment: '',
  operator: '',
});

export default function NCComments() {
  const { useGetMachines } = useMachines();
  const {
    useGetNCs,
    useGetNCComments,
    useAddComment,
    useUpdateComment,
    useDeleteComment
  } = useNonConformities();

  const { data: machines = [], isLoading: loadingMachines, isError: errorMachines, refetch: refetchMachines } = useGetMachines();
  const { data: nonConformities = [], isLoading: loadingNCs, isError: errorNCs, refetch: refetchNCs } = useGetNCs();

  const [selectedNCId, setSelectedNCId] = useState('');

  useEffect(() => {
    if (nonConformities.length > 0 && !selectedNCId) {
      setSelectedNCId(nonConformities[0].id);
    }
  }, [nonConformities, selectedNCId]);

  const { data: comments = [], isLoading: loadingComments, isError: errorComments, refetch: refetchComments } = useGetNCComments(selectedNCId);
  const addMutation = useAddComment();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<NCCommentFormValues>({
    resolver: zodResolver(ncCommentFormSchema),
    defaultValues: getDefaultValues(),
  });

  const formValues = watch();

  // Unsaved changes warning
  useUnsavedChanges(isDirty);


  const selectedNC = nonConformities.find(nc => nc.id === selectedNCId);
  const selectedMachine = machines.find(m => m.id === selectedNC?.machineId);

  const resetForm = () => {
    setMode('new');
    setSelectedRowId(null);
    reset(getDefaultValues());
  };

  const handleRowClick = (item: NCComment) => {
    if (selectedRowId === item.id) {
      resetForm();
    } else {
      setSelectedRowId(item.id);
      setMode('edit');
      reset({
        date: item.date,
        comment: item.comment,
        operator: item.operator || 'FERNANDO',
      });
    }
  };

  const onSubmit = async (data: NCCommentFormValues) => {
    try {
      if (mode === 'new') {
        if (!selectedNCId) {
          toast.error("No NC Selected");
          return;
        }
        await addMutation.mutateAsync({
          ncId: selectedNCId,
          ...data
        });
        resetForm();
      } else if (mode === 'edit' && selectedRowId) {
        await updateMutation.mutateAsync({
          id: selectedRowId,
          data
        });
        resetForm();
      }
    } catch {
      // Handled by mutation toast
    }
  };

  const handleDelete = async () => {
    if (selectedRowId) {
      if (confirm("Delete this comment?")) {
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
    if (!confirm(`Delete ${bulkSelectedIds.length} comment(s)?`)) return;
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

  if (loadingMachines || loadingNCs) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading NC data...</p>
      </div>
    );
  }

  if (errorMachines) return <QueryError onRetry={refetchMachines} />;
  if (errorNCs) return <QueryError onRetry={refetchNCs} />;

  const columns = [
    { key: 'date', header: 'DATE' },
    { key: 'comment', header: 'COMMENT', className: 'min-w-[300px]' },
    { key: 'operator', header: 'OPERATOR' },
  ];

  return (
    <div>
      <PageHeader title="NC Comments" />

      <div className="space-y-6">
        {/* NC Selection */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center flex-wrap">
            <div className="bg-muted/40 px-4 py-2.5 text-sm font-medium border-r border-border">NC Code</div>
            <select
              value={selectedNCId}
              onChange={(e) => { setSelectedNCId(e.target.value); resetForm(); setBulkSelectedIds([]); }}
              className="flex-1 bg-transparent text-foreground text-sm px-4 py-2.5 font-medium max-w-xs focus:outline-none"
            >
              {nonConformities.map(nc => (
                <option key={nc.id} value={nc.id}>{nc.ncCode}</option>
              ))}
            </select>
            <div className="px-4 py-2.5 text-sm text-muted-foreground border-l border-border flex-1 truncate">
              {selectedMachine?.description || 'Unknown Machine'}
            </div>
            <div className="px-4 py-2.5 text-sm border-l border-border">
              <span className="text-muted-foreground">Area:</span> <span className="font-medium">{selectedNC?.area || '-'}</span>
            </div>
          </div>
        </div>

        {/* Comments Table */}
        {loadingComments ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading comments...</p>
          </div>
        ) : errorComments ? (
          <QueryError onRetry={refetchComments} />
        ) : (
          <div>
            <DataTable
              columns={columns}
              data={comments}
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
            onClick={() => { const input = document.getElementById('comment-input'); if (input) input.focus(); }}>
            <Pencil className="h-4 w-4" /> {selectedRowId ? 'Edit Selected' : 'Select to Edit'}
          </ActionButton>
          <ActionButton variant="red" className="gap-2" disabled={!selectedRowId || deleteMutation.isPending} onClick={handleDelete}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {selectedRowId ? 'Delete Selected' : 'Delete'}
          </ActionButton>
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit(onSubmit)} className={`bg-card border rounded-lg overflow-hidden transition-colors duration-200 ${mode === 'edit' ? 'border-primary/50' : 'border-border'}`}>
          <div className={`section-header flex justify-between items-center ${mode === 'edit' ? 'bg-primary/5' : ''}`}>
            <span>{mode === 'edit' ? 'Edit Comment' : 'Add Comment'}</span>
            {mode === 'edit' && (
              <button type="button" onClick={resetForm} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-destructive px-2 py-1 rounded transition-colors">
                <X className="h-3 w-3" /> Cancel
              </button>
            )}
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Comment Date"
                value={formValues.date}
                onChange={(v) => setValue('date', v, { shouldDirty: true })}
                placeholder="DD/MM/YYYY"
                disabled={addMutation.isPending || updateMutation.isPending}
                error={errors.date?.message}
              />
              <div className="md:col-span-2">
                <InputField
                  id="comment-input"
                  label="Comment"
                  value={formValues.comment}
                  onChange={(v) => setValue('comment', v, { shouldValidate: true, shouldDirty: true })}
                  placeholder="Enter your comment..."
                  disabled={addMutation.isPending || updateMutation.isPending}
                  required
                  error={errors.comment?.message}
                />
              </div>
            </div>
            <div className="pt-2">
              <ActionButton variant={mode === 'edit' ? 'blue' : 'green'} className="min-w-[140px]"
                type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
                {addMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  mode === 'edit' ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
                )}
                {mode === 'edit' ? 'Update' : 'Add Line'}
              </ActionButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
