import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/FormField';
import { machines, spareParts } from '@/data/mockData';
import type { SparePart } from '@/types/maintenance';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';

export default function SpareParts() {
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || '');
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [newPart, setNewPart] = useState({
    description: '',
    reference: '',
    quantity: 1,
    link: '',
  });

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const machineParts = spareParts.filter(p => p.machineId === selectedMachineId);

  const columns = [
    { key: 'description', header: 'DESCRIPTION' },
    { key: 'reference', header: 'REFERENCE' },
    { key: 'quantity', header: 'QUANTITY' },
    { 
      key: 'link', 
      header: 'LINK',
      render: (item: SparePart) => (
        <a 
          href={`https://${item.link}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-info hover:underline flex items-center gap-1"
        >
          {item.link}
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="05-SPARE PARTS" />

      <div className="space-y-6">
        {/* Machine Selection */}
        <div className="flex items-center gap-4 border border-primary rounded overflow-hidden">
          <div className="bg-muted px-4 py-2 font-medium">MACHINE CODE</div>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="flex-1 bg-accent text-accent-foreground px-4 py-2 font-bold max-w-xs"
          >
            {machines.map(m => (
              <option key={m.id} value={m.id}>
                {m.finalCode}
              </option>
            ))}
          </select>
          <div className="bg-card px-4 py-2 italic flex-1">
            {selectedMachine?.description}
          </div>
        </div>

        {/* Spare Parts Table */}
        <DataTable
          columns={columns}
          data={machineParts}
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
            EDIT LINE {selectedRow || ''}
          </ActionButton>
          <ActionButton variant="red" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            DELETE LINE {selectedRow || ''}
          </ActionButton>
        </div>

        {/* Add Part Form */}
        <div className="border border-primary rounded overflow-hidden">
          <div className="section-header">Add Spare Part</div>
          <div className="p-4 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputField
                label="DESCRIPTION"
                value={newPart.description}
                onChange={(v) => setNewPart(prev => ({ ...prev, description: v }))}
                placeholder="Part name..."
              />
              <InputField
                label="REFERENCE"
                value={newPart.reference}
                onChange={(v) => setNewPart(prev => ({ ...prev, reference: v }))}
                placeholder="REF0000"
              />
              <InputField
                label="QUANTITY"
                value={String(newPart.quantity)}
                onChange={(v) => setNewPart(prev => ({ ...prev, quantity: parseInt(v) || 0 }))}
                type="number"
              />
              <InputField
                label="LINK"
                value={newPart.link}
                onChange={(v) => setNewPart(prev => ({ ...prev, link: v }))}
                placeholder="www.example.com"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
