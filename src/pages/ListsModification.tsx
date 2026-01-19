import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/FormField';
import { authorizationGroups } from '@/data/mockData';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface ListItem {
  id: string;
  value: string;
}

export default function ListsModification() {
  const [selectedList, setSelectedList] = useState(authorizationGroups[0]);
  const [listItems, setListItems] = useState<ListItem[]>([
    { id: '1', value: 'Item 1' },
    { id: '2', value: 'Item 2' },
    { id: '3', value: 'Item 3' },
  ]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');

  const columns = [
    { key: 'id', header: '#' },
    { key: 'value', header: 'VALUE' },
  ];

  return (
    <div>
      <PageHeader title="07-LISTS MODIFICATION" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Selection */}
        <div className="space-y-4">
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Select the List</div>
            <div className="max-h-96 overflow-y-auto">
              {authorizationGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedList(group)}
                  className={`
                    w-full px-4 py-2 text-left text-sm border-b border-border transition-colors
                    ${selectedList === group 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card hover:bg-muted'}
                  `}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="section-header inline-block">
            {selectedList}
          </div>

          <DataTable
            columns={columns}
            data={listItems}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => setSelectedItem(item.id)}
            selectedId={selectedItem || undefined}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <ActionButton variant="green" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              ADD ITEM
            </ActionButton>
            <ActionButton variant="blue" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              EDIT ITEM
            </ActionButton>
            <ActionButton variant="red" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              DELETE ITEM
            </ActionButton>
          </div>

          {/* Add Item Form */}
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Add New Item</div>
            <div className="p-4 bg-card">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <InputField
                    label="VALUE"
                    value={newValue}
                    onChange={setNewValue}
                    placeholder="Enter new value..."
                  />
                </div>
                <ActionButton variant="green">ADD</ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
