import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { machines, nonConformities, ncComments } from '@/data/mockData';
import type { NonConformity } from '@/types/maintenance';

export default function NCMaintenanceReport() {
  const [selectedNC, setSelectedNC] = useState<NonConformity | null>(null);

  const selectedMachine = machines.find(m => m.id === selectedNC?.machineId);
  const comments = ncComments.filter(c => c.ncId === selectedNC?.id);

  const columns = [
    { key: 'ncCode', header: 'NC CODE' },
    { 
      key: 'machineCode', 
      header: 'MACHINE CODE',
      render: (item: NonConformity) => machines.find(m => m.id === item.machineId)?.finalCode
    },
    { 
      key: 'description', 
      header: 'DESCRIPTION',
      render: (item: NonConformity) => machines.find(m => m.id === item.machineId)?.description
    },
    { key: 'area', header: 'AREA' },
    { key: 'maintenanceOperator', header: 'OPERATORS' },
    { key: 'creationDate', header: 'CREATION DATE' },
    { key: 'initiationDate', header: 'INIT DATE' },
    { key: 'status', header: 'STATUS' },
    { key: 'priority', header: 'PRIORITY' },
  ];

  const commentColumns = [
    { key: 'operator', header: 'OPERATOR' },
    { key: 'date', header: 'DATE' },
    { key: 'comment', header: 'COMMENT' },
  ];

  return (
    <div>
      <PageHeader title="02-NC'S MAINTENANCE" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Table */}
        <div className="xl:col-span-2">
          <DataTable
            columns={columns}
            data={nonConformities}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => setSelectedNC(item)}
            selectedId={selectedNC?.id}
          />
        </div>

        {/* NC Details Sidebar */}
        <div className="space-y-4">
          {selectedNC && (
            <>
              <div className="border border-primary rounded overflow-hidden">
                <div className="section-header">NC Details</div>
                <div className="p-3 bg-card space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Machine Code:</span>
                    <span className="font-medium">{selectedMachine?.finalCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span className="font-medium">{selectedMachine?.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-bold text-warning">{selectedNC.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <span className="font-bold">{selectedNC.priority}</span>
                  </div>
                </div>
              </div>

              <div className="border border-primary rounded overflow-hidden">
                <div className="section-header">Maintenance Comments</div>
                <div className="p-2 bg-card">
                  {comments.length > 0 ? (
                    <DataTable
                      columns={commentColumns}
                      data={comments}
                      keyExtractor={(item) => item.id}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground p-2">No comments yet</p>
                  )}
                </div>
              </div>
            </>
          )}

          {!selectedNC && (
            <div className="text-sm text-muted-foreground italic p-3 bg-card border border-border rounded">
              Select an NC from the table to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
