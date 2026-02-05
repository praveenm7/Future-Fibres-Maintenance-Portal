import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/FormField';
import type { NCComment } from '@/types/maintenance';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useMaintenance } from '@/context/MaintenanceContext';
import { toast } from 'sonner';

export default function NCComments() {
  const { machines, nonConformities, ncComments, addNCComment, updateNCComment, deleteNCComment } = useMaintenance();

  const [selectedNCId, setSelectedNCId] = useState('');
  // Auto-select first NC
  useEffect(() => {
    if (nonConformities.length > 0 && !selectedNCId) {
      setSelectedNCId(nonConformities[0].id);
    }
  }, [nonConformities]);

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [mode, setMode] = useState<'new' | 'edit'>('new');

  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-GB'),
    comment: '',
    operator: 'FERNANDO' // Default user for now as auth usage wasn't specified
  });

  const selectedNC = nonConformities.find(nc => nc.id === selectedNCId);
  const selectedMachine = machines.find(m => m.id === selectedNC?.machineId);
  const comments = ncComments.filter(c => c.ncId === selectedNCId);

  const resetForm = () => {
    setMode('new');
    setSelectedRowId(null);
    setFormData({
      date: new Date().toLocaleDateString('en-GB'),
      comment: '',
      operator: 'FERNANDO'
    });
  };

  const handleRowClick = (item: NCComment) => {
    if (selectedRowId === item.id) {
      resetForm();
    } else {
      setSelectedRowId(item.id);
      setMode('edit');
      setFormData({
        date: item.date,
        comment: item.comment,
        operator: item.operator || 'FERNANDO'
      });
    }
  };

  const handleSave = () => {
    if (!formData.comment) {
      toast.error("Comment is required");
      return;
    }

    if (mode === 'new') {
      if (!selectedNCId) {
        toast.error("No NC Selected");
        return;
      }
      const newComment: NCComment = {
        id: crypto.randomUUID(),
        ncId: selectedNCId,
        ...formData
      };
      addNCComment(newComment);
      resetForm();
    } else if (mode === 'edit' && selectedRowId) {
      const existing = ncComments.find(c => c.id === selectedRowId);
      if (existing) {
        updateNCComment({ ...existing, ...formData });
        resetForm();
      }
    }
  };

  const handleDelete = () => {
    if (selectedRowId) {
      if (confirm("Delete this comment?")) {
        deleteNCComment(selectedRowId);
        resetForm();
      }
    }
  };

  const columns = [
    { key: 'date', header: 'DATE' },
    { key: 'comment', header: 'COMMENT', className: 'min-w-[300px]' },
    { key: 'operator', header: 'OPERATOR' },
  ];

  return (
    <div>
      <PageHeader title="04-NC'S COMMENTS" />

      <div className="space-y-6">
        {/* NC Selection */}
        <div className="flex items-center gap-4 border border-primary rounded overflow-hidden shadow-sm flex-wrap">
          <div className="bg-muted px-4 py-2 font-medium border-r border-border">NC CODE</div>
          <select
            value={selectedNCId}
            onChange={(e) => {
              setSelectedNCId(e.target.value);
              resetForm();
            }}
            className="flex-1 bg-card text-foreground px-4 py-2 font-bold max-w-xs focus:outline-none"
          >
            {nonConformities.map(nc => (
              <option key={nc.id} value={nc.id}>
                {nc.ncCode}
              </option>
            ))}
          </select>
          <div className="bg-muted/50 px-4 py-2 italic border-l border-border flex-1 truncate">
            {selectedMachine?.description || 'Unknown Machine'}
          </div>
          <div className="bg-card px-4 py-2 border-l border-border">
            AREA: <span className="font-medium">{selectedNC?.area || '-'}</span>
          </div>
        </div>

        {/* Comments Table */}
        <DataTable
          columns={columns}
          data={comments}
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

        {/* Add Comment Form */}
        <div className={`border rounded-lg overflow-hidden shadow-sm transition-colors ${mode === 'edit' ? 'border-primary' : 'border-border'}`}>
          <div className={`section-header flex justify-between items-center ${mode === 'edit' ? 'bg-primary/10' : ''}`}>
            <span>{mode === 'edit' ? 'Edit Comment' : 'Add Comment'}</span>
            {mode === 'edit' && (
              <button onClick={resetForm}>
                <X className="h-4 w-4 text-foreground hover:text-red-500" />
              </button>
            )}
          </div>
          <div className="p-4 bg-card space-y-4">
            <p className="text-sm text-muted-foreground italic">
              Manage Comments for NC's. First, select the NC Code (it will show machine data).
              Then, insert Comment Date and write the comment, then press ADD LINE
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="COMMENT DATE"
                value={formData.date}
                onChange={(v) => setFormData(prev => ({ ...prev, date: v }))}
                placeholder="DD/MM/YYYY"
              />
              <div className="md:col-span-2">
                <InputField
                  label="COMMENT"
                  value={formData.comment}
                  onChange={(v) => setFormData(prev => ({ ...prev, comment: v }))}
                  placeholder="Enter your comment..."
                />
              </div>
            </div>

            <div className="pt-2">
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
