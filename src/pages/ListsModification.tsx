import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/FormField';
import { authorizationGroups, areas, machineGroups, machineTypes } from '@/data/mockData';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useMaintenance } from '@/context/MaintenanceContext';
import { toast } from 'sonner';

// Define the available lists to modify
const LIST_TYPES = {
  'Authorization Groups': authorizationGroups,
  'Areas': areas,
  'Machine Groups': machineGroups,
  'Machine Types': machineTypes,
};

export default function ListsModification() {
  const { listOptions, addListOption, updateListOption, deleteListOption } = useMaintenance();

  const [selectedListType, setSelectedListType] = useState(Object.keys(LIST_TYPES)[0]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'new' | 'edit'>('view');
  const [newValue, setNewValue] = useState('');

  // Combine static mock data with dynamic context data
  // Note: For a real app, we'd probably migrate entirely to context, 
  // but here we mix them to show initial state + user changes.
  // We wrap static items in objects to match the shape.
  const staticItems = (LIST_TYPES[selectedListType as keyof typeof LIST_TYPES] || []).map(val => ({
    id: `static-${val}`,
    listType: selectedListType,
    value: val,
    isStatic: true
  }));

  const dynamicItems = listOptions.filter(opt => opt.listType === selectedListType);

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

  const handleSave = () => {
    if (!newValue.trim()) {
      toast.error("Value is required");
      return;
    }

    if (mode === 'new') {
      // Check for duplicates
      if (allItems.some(i => i.value.toLowerCase() === newValue.toLowerCase())) {
        toast.error("Item already exists in this list");
        return;
      }

      addListOption({
        id: crypto.randomUUID(),
        listType: selectedListType,
        value: newValue
      });
      resetForm();
    } else if (mode === 'edit' && selectedRowId) {
      if (selectedRowId.startsWith('static-')) {
        toast.error("Cannot modify default system items. Create a new one instead.");
        return;
      }

      const existing = listOptions.find(o => o.id === selectedRowId);
      if (existing) {
        updateListOption({ ...existing, value: newValue });
        resetForm();
      }
    }
  };

  const handleDelete = () => {
    if (selectedRowId) {
      if (selectedRowId.startsWith('static-')) {
        toast.error("Cannot delete default system items.");
        return;
      }
      if (confirm("Delete this item?")) {
        deleteListOption(selectedRowId);
        resetForm();
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
              {Object.keys(LIST_TYPES).map((type) => (
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

          <DataTable
            columns={columns}
            data={allItems}
            keyExtractor={(item) => item.id}
            onRowClick={handleRowClick}
            selectedId={selectedRowId || undefined}
          />

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
              disabled={!selectedRowId}
            >
              <Pencil className="h-4 w-4" />
              {selectedRowId ? 'EDIT ITEM' : 'SELECT TO EDIT'}
            </ActionButton>
            <ActionButton
              variant="red"
              className="flex items-center gap-2"
              disabled={!selectedRowId}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
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
                    />
                    {mode === 'edit' && selectedRowId?.startsWith('static-') && (
                      <p className="text-xs text-destructive mt-1">System items cannot be edited.</p>
                    )}
                  </div>
                  <ActionButton
                    variant={mode === 'edit' ? 'blue' : 'green'}
                    onClick={handleSave}
                    disabled={mode === 'edit' && selectedRowId?.startsWith('static-')}
                  >
                    {mode === 'edit' ? 'UPDATE' : 'ADD'}
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
