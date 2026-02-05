import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/FormField';
import type { SparePart } from '@/types/maintenance';
import { Plus, Pencil, Trash2, ExternalLink, Save, X } from 'lucide-react';
import { useMaintenance } from '@/context/MaintenanceContext';
import { toast } from 'sonner';

export default function SpareParts() {
  const { machines, spareParts, addSparePart, updateSparePart, deleteSparePart } = useMaintenance();

  const [selectedMachineId, setSelectedMachineId] = useState('');
  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines]);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [newPart, setNewPart] = useState({
    description: '',
    reference: '',
    quantity: 1,
    link: '',
  });

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const machineParts = spareParts.filter(p => p.machineId === selectedMachineId);

  const resetForm = () => {
    setMode('new');
    setSelectedRowId(null);
    setNewPart({
      description: '',
      reference: '',
      quantity: 1,
      link: '',
    });
  };

  const handleRowClick = (item: SparePart) => {
    if (selectedRowId === item.id) {
      resetForm();
    } else {
      setSelectedRowId(item.id);
      setMode('edit');
      setNewPart({
        description: item.description,
        reference: item.reference,
        quantity: item.quantity,
        link: item.link
      });
    }
  };

  const handleSave = () => {
    if (!newPart.description) {
      toast.error("Description is required");
      return;
    }

    if (mode === 'new') {
      if (!selectedMachineId) {
        toast.error("Select a machine first");
        return;
      }
      const part: SparePart = {
        id: crypto.randomUUID(),
        machineId: selectedMachineId,
        ...newPart
      };
      addSparePart(part);
      resetForm();
    } else if (mode === 'edit' && selectedRowId) {
      const existing = spareParts.find(p => p.id === selectedRowId);
      if (existing) {
        updateSparePart({ ...existing, ...newPart });
        resetForm();
      }
    }
  };

  const handleDelete = () => {
    if (selectedRowId) {
      if (confirm("Delete this spare part?")) {
        deleteSparePart(selectedRowId);
        resetForm();
      }
    }
  };

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
          className="text-info hover:underline flex items-center gap-1"
          onClick={(e) => e.stopPropagation()} // Prevent row selection when clicking link
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
        <div className="flex items-center gap-4 border border-primary rounded overflow-hidden shadow-sm">
          <div className="bg-muted px-4 py-2 font-medium border-r border-border">MACHINE CODE</div>
          <select
            value={selectedMachineId}
            onChange={(e) => {
              setSelectedMachineId(e.target.value);
              resetForm();
            }}
            className="flex-1 bg-card text-foreground px-4 py-2 font-bold max-w-xs focus:outline-none"
          >
            {machines.map(m => (
              <option key={m.id} value={m.id}>
                {m.finalCode}
              </option>
            ))}
          </select>
          <div className="bg-muted/50 px-4 py-2 italic flex-1 border-l border-border truncate">
            {selectedMachine?.description}
          </div>
        </div>

        {/* Spare Parts Table */}
        <DataTable
          columns={columns}
          data={machineParts}
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
            disabled={mode === 'new' && !selectedRowId}
          >
            <Plus className="h-4 w-4" />
            ADD LINE
          </ActionButton>
          <ActionButton
            variant="blue"
            className="flex items-center gap-2"
            disabled={!selectedRowId}
          >
            <Pencil className="h-4 w-4" />
            {selectedRowId ? 'EDIT SELECTED' : 'SELECT TO EDIT'}
          </ActionButton>
          <ActionButton
            variant="red"
            className="flex items-center gap-2"
            disabled={!selectedRowId}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            {selectedRowId ? 'DELETE SELECTED' : 'DELETE LINE'}
          </ActionButton>
        </div>

        {/* Add Part Form */}
        <div className={`border rounded-lg overflow-hidden shadow-sm transition-colors ${mode === 'edit' ? 'border-primary' : 'border-border'}`}>
          <div className={`section-header flex justify-between items-center ${mode === 'edit' ? 'bg-primary/10' : ''}`}>
            <span>{mode === 'edit' ? 'Edit Spare Part' : 'Add Spare Part'}</span>
            {mode === 'edit' && (
              <button onClick={resetForm}>
                <X className="h-4 w-4 text-foreground hover:text-red-500" />
              </button>
            )}
          </div>
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
                min="0"
              />
              <InputField
                label="LINK"
                value={newPart.link}
                onChange={(v) => setNewPart(prev => ({ ...prev, link: v }))}
                placeholder="www.example.com"
              />
            </div>

            <div className="pt-4">
              <ActionButton
                variant={mode === 'edit' ? 'blue' : 'green'}
                onClick={handleSave}
              >
                {mode === 'edit' ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {mode === 'edit' ? 'UPDATE LINE' : 'ADD LINE'}
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
