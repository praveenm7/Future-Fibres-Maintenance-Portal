import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/FormField';
import { Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import { useListOptions } from '@/hooks/useListOptions';
import { toast } from 'sonner';

// Define the available list types
const LIST_TYPES = [
  'Authorization Groups',
  'Areas',
  'Machine Groups',
  'Machine Types',
];

export default function ListsModification() {
  const {
    useGetListOptions,
    useCreateListOption,
    useUpdateListOption,
    useDeleteListOption
  } = useListOptions();

  const [selectedListType, setSelectedListType] = useState(LIST_TYPES[0]);
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
    { key: 'isStatic', header: 'SOURCE', render: (item: any) => item.isStatic ? <span className="opacity-50">System</span> : <span className="text-primary font-bold">User</span> }
  ];

  return (
    <div>
      <PageHeader title="07-LISTS MODIFICATION" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Selection */}
        <div className="space-y-4">
          <div className="border border-primary rounded overflow-hidden shadow-sm">
            <div className="section-header">Select the List</div>
            <div className="max-h-96 overflow-y-auto bg-card">
              {LIST_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedListType(type);
                    resetForm();
                  }}
                  className={`
                    w-full px-4 py-3 text-left text-sm border-b border-border transition-colors font-medium
                    ${selectedListType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'}
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="section-header inline-block px-6 py-2 rounded-full mb-2">
            Editing: {selectedListType}
          </div>

          {loadingOptions ? (
            <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded">
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
            <ActionButton
              variant="green"
              className="flex items-center gap-2"
              onClick={() => {
                resetForm();
                setMode('new');
              }}
            >
              <Plus className="h-4 w-4" />
              ADD ITEM
            </ActionButton>
            <ActionButton
              variant="blue"
              className="flex items-center gap-2"
              disabled={!selectedRowId || updateMutation.isPending}
            >
              <Pencil className="h-4 w-4" />
              {selectedRowId ? 'EDIT ITEM' : 'SELECT TO EDIT'}
            </ActionButton>
            <ActionButton
              variant="red"
              className="flex items-center gap-2"
              disabled={!selectedRowId || deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {selectedRowId ? 'DELETE ITEM' : 'SELECT TO DELETE'}
            </ActionButton>
          </div>

          {/* Add/Edit Item Form */}
          {(mode === 'new' || mode === 'edit') && (
            <div className={`border rounded-lg overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 ${mode === 'edit' ? 'border-blue-200' : 'border-green-200'}`}>
              <div className={`section-header flex justify-between items-center ${mode === 'edit' ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                <span>{mode === 'edit' ? 'Edit Item' : 'Add New Item'}</span>
                <button onClick={resetForm}>
                  <X className="h-4 w-4 hover:text-red-500" />
                </button>
              </div>
              <div className="p-4 bg-card">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <InputField
                      label="VALUE"
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
                      mode === 'edit' ? 'UPDATE' : 'ADD'
                    )}
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
