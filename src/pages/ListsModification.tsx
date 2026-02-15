import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/FormField';
import { Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import { useListOptions } from '@/hooks/useListOptions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LIST_TYPES = [
  { value: 'MACHINE_TYPE', label: 'Machine Types' },
  { value: 'MACHINE_GROUP', label: 'Machine Groups' },
  { value: 'AREA', label: 'Areas' },
  { value: 'PERIODICITY', label: 'Periodicities' },
  { value: 'NC_STATUS', label: 'NC Statuses' },
  { value: 'NC_CATEGORY', label: 'NC Categories' },
  { value: 'NC_PRIORITY', label: 'NC Priorities' },
  { value: 'AUTHORIZATION_GROUP', label: 'Authorization Groups' },
];

export default function ListsModification() {
  const {
    useGetListOptions,
    useCreateListOption,
    useUpdateListOption,
    useDeleteListOption
  } = useListOptions();

  const [selectedListType, setSelectedListType] = useState(LIST_TYPES[0].value);
  const { data: dynamicListOptions = [], isLoading: loadingOptions } = useGetListOptions(selectedListType);
  const createMutation = useCreateListOption();
  const updateMutation = useUpdateListOption();
  const deleteMutation = useDeleteListOption();

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'new' | 'edit'>('view');
  const [newValue, setNewValue] = useState('');

  const staticItems: any[] = [];

  const dynamicItems = dynamicListOptions.map(opt => ({
    ...opt,
    isStatic: false
  }));

  const allItems = [...staticItems, ...dynamicItems];

  const resetForm = () => {
    setMode('view');
    setSelectedRowId(null);
    setNewValue('');
  };

  const handleRowClick = (item: any) => {
    setSelectedRowId(item.id);
    setMode('edit');
    setNewValue(item.value);
  };

  const handleSave = async () => {
    if (!newValue.trim()) {
      toast.error("Value is required");
      return;
    }

    try {
      if (mode === 'new') {
        if (allItems.some(i => i.value.toLowerCase() === newValue.trim().toLowerCase())) {
          toast.error("Item already exists in this list");
          return;
        }

        await createMutation.mutateAsync({
          listType: selectedListType,
          value: newValue.trim()
        });
        resetForm();
      } else if (mode === 'edit' && selectedRowId) {
        if (selectedRowId.startsWith('static-')) {
          toast.error("Cannot modify system items.");
          return;
        }

        await updateMutation.mutateAsync({
          id: selectedRowId,
          data: { value: newValue.trim() }
        });
        resetForm();
      }
    } catch (error) {
      // Handled by mutation toast
    }
  };

  const handleDelete = async () => {
    if (selectedRowId) {
      if (selectedRowId.startsWith('static-')) {
        toast.error("Cannot delete system items.");
        return;
      }
      if (confirm("Delete this item?")) {
        try {
          await deleteMutation.mutateAsync(selectedRowId);
          resetForm();
        } catch (error) {
          // Handled by mutation toast
        }
      }
    }
  };

  const columns = [
    { key: 'value', header: 'VALUE' },
    { key: 'isStatic', header: 'SOURCE', render: (item: any) => item.isStatic ? <span className="text-muted-foreground">System</span> : <span className="text-primary font-medium">User</span> }
  ];

  return (
    <div>
      <PageHeader title="Lists Management" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Selection */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="section-header">Select List</div>
            <div className="max-h-96 overflow-y-auto">
              {LIST_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => { setSelectedListType(type.value); resetForm(); }}
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm border-b border-border transition-colors font-medium',
                    selectedListType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted/50'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-foreground">Editing: {LIST_TYPES.find(t => t.value === selectedListType)?.label ?? selectedListType}</h2>
          </div>

          {loadingOptions ? (
            <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading list items...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={allItems}
              keyExtractor={(item) => item.id}
              onRowClick={handleRowClick}
              selectedId={selectedRowId || undefined}
            />
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <ActionButton variant="green" className="gap-2" onClick={() => { resetForm(); setMode('new'); }}>
              <Plus className="h-4 w-4" /> Add Item
            </ActionButton>
            <ActionButton variant="blue" className="gap-2" disabled={!selectedRowId || updateMutation.isPending}>
              <Pencil className="h-4 w-4" /> {selectedRowId ? 'Edit Item' : 'Select to Edit'}
            </ActionButton>
            <ActionButton variant="red" className="gap-2" disabled={!selectedRowId || deleteMutation.isPending} onClick={handleDelete}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {selectedRowId ? 'Delete Item' : 'Select to Delete'}
            </ActionButton>
          </div>

          {/* Add/Edit Item Form */}
          {(mode === 'new' || mode === 'edit') && (
            <div className={`bg-card border rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 transition-colors duration-200 ${mode === 'edit' ? 'border-primary/50' : 'border-border'}`}>
              <div className={`section-header flex justify-between items-center ${mode === 'edit' ? 'bg-primary/5' : ''}`}>
                <span>{mode === 'edit' ? 'Edit Item' : 'Add New Item'}</span>
                <button onClick={resetForm} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <InputField
                      label="Value"
                      value={newValue}
                      onChange={setNewValue}
                      placeholder="Enter value..."
                      disabled={createMutation.isPending || updateMutation.isPending}
                    />
                    {mode === 'edit' && selectedRowId?.startsWith('static-') && (
                      <p className="text-xs text-destructive mt-1">System items cannot be edited.</p>
                    )}
                  </div>
                  <ActionButton
                    variant={mode === 'edit' ? 'blue' : 'green'}
                    onClick={handleSave}
                    disabled={(mode === 'edit' && selectedRowId?.startsWith('static-')) || createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      mode === 'edit' ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
                    )}
                    {mode === 'edit' ? 'Update' : 'Add'}
                  </ActionButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
