import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { InputField } from '@/components/ui/FormField';
import { machines, nonConformities, ncComments } from '@/data/mockData';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function NCComments() {
  const [selectedNCId, setSelectedNCId] = useState(nonConformities[0]?.id || '');
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [newComment, setNewComment] = useState({
    date: new Date().toLocaleDateString('en-GB'),
    comment: '',
  });

  const selectedNC = nonConformities.find(nc => nc.id === selectedNCId);
  const selectedMachine = machines.find(m => m.id === selectedNC?.machineId);
  const comments = ncComments.filter(c => c.ncId === selectedNCId);

  const columns = [
    { key: 'id', header: '#' },
    { key: 'date', header: 'DATE' },
    { key: 'comment', header: 'COMMENT', className: 'min-w-[300px]' },
  ];

  return (
    <div>
      <PageHeader title="04-NC'S COMMENTS" />

      <div className="space-y-6">
        {/* NC Selection */}
        <div className="flex items-center gap-4 border border-primary rounded overflow-hidden">
          <div className="bg-muted px-4 py-2 font-medium">NC CODE</div>
          <select
            value={selectedNCId}
            onChange={(e) => setSelectedNCId(e.target.value)}
            className="flex-1 bg-accent text-accent-foreground px-4 py-2 font-bold max-w-xs"
          >
            {nonConformities.map(nc => (
              <option key={nc.id} value={nc.id}>
                {nc.ncCode}
              </option>
            ))}
          </select>
          <div className="bg-card px-4 py-2 italic">
            {selectedMachine?.description}
          </div>
          <div className="bg-muted px-4 py-2">
            AREA: <span className="font-medium">{selectedNC?.area}</span>
          </div>
        </div>

        {/* Comments Table */}
        <DataTable
          columns={columns}
          data={comments}
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

        {/* Add Comment Form */}
        <div className="border border-primary rounded overflow-hidden">
          <div className="section-header">Add Comment</div>
          <div className="p-4 bg-card space-y-4">
            <p className="text-sm text-muted-foreground italic">
              Manage Comments for NC's. First, select the NC Code (it will show machine data). 
              Then, insert Comment Date and write the comment, then press ADD LINE
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="COMMENT DATE"
                value={newComment.date}
                onChange={(v) => setNewComment(prev => ({ ...prev, date: v }))}
                placeholder="DD/MM/YYYY"
              />
              <div className="md:col-span-2">
                <InputField
                  label="COMMENT"
                  value={newComment.comment}
                  onChange={(v) => setNewComment(prev => ({ ...prev, comment: v }))}
                  placeholder="Enter your comment..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
