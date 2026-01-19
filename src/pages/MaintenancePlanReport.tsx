import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { machines, maintenanceActions, spareParts, nonConformities } from '@/data/mockData';
import type { MaintenanceAction, SparePart, NonConformity } from '@/types/maintenance';

export default function MaintenancePlanReport() {
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || '');

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const machineActions = maintenanceActions.filter(a => a.machineId === selectedMachineId);
  const machineParts = spareParts.filter(p => p.machineId === selectedMachineId);
  const machineNCs = nonConformities.filter(nc => nc.machineId === selectedMachineId);

  const actionColumns = [
    { key: 'action', header: 'ACTION', className: 'max-w-[300px]' },
    { key: 'periodicity', header: 'PERIODICITY' },
    { 
      key: 'timeNeeded', 
      header: 'TIME NEEDED',
      render: (item: MaintenanceAction) => `${item.timeNeeded} min`
    },
    { 
      key: 'maintenanceInCharge', 
      header: 'MAINTENANCE IN CHARGE',
      render: (item: MaintenanceAction) => item.maintenanceInCharge ? 'Y' : 'N'
    },
  ];

  const partColumns = [
    { key: 'description', header: 'DESCRIPTION' },
    { key: 'reference', header: 'REFERENCE' },
    { key: 'quantity', header: 'QUANTITY' },
    { 
      key: 'link', 
      header: 'LINK',
      render: (item: SparePart) => (
        <a href={`https://${item.link}`} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">
          {item.link}
        </a>
      )
    },
  ];

  const ncColumns = [
    { key: 'ncCode', header: 'NC CODE' },
    { key: 'maintenanceOperator', header: 'OPERATORS' },
    { key: 'creationDate', header: 'CREATION DATE' },
    { key: 'initiationDate', header: 'INIT DATE' },
    { key: 'finishDate', header: 'FINISH DATE', render: (item: NonConformity) => item.finishDate || '-' },
    { key: 'status', header: 'STATUS' },
    { key: 'category', header: 'CATEGORY', render: (item: NonConformity) => item.category || '-' },
    { key: 'priority', header: 'PRIORITY' },
  ];

  return (
    <div>
      <PageHeader title="04-MAINTENANCE PLAN" />

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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Maintenance Actions */}
            <div className="border border-primary rounded overflow-hidden">
              <div className="section-header">MAINTENANCE ACTIONS</div>
              <DataTable
                columns={actionColumns}
                data={machineActions}
                keyExtractor={(item) => item.id}
              />
            </div>

            {/* Spare Parts */}
            <div className="border border-primary rounded overflow-hidden">
              <div className="section-header">SPARE PARTS</div>
              <DataTable
                columns={partColumns}
                data={machineParts}
                keyExtractor={(item) => item.id}
              />
            </div>

            {/* Non-Conformities */}
            <div className="border border-primary rounded overflow-hidden">
              <div className="section-header">MAINTENANCE NC's</div>
              <DataTable
                columns={ncColumns}
                data={machineNCs}
                keyExtractor={(item) => item.id}
              />
            </div>
          </div>

          {/* Machine Info Sidebar */}
          <div className="space-y-4">
            <div className="border border-primary rounded overflow-hidden">
              <div className="section-header">Machine Picture</div>
              <div className="p-4 bg-card">
                <div className="aspect-square bg-muted rounded flex items-center justify-center border border-border">
                  {selectedMachine?.imageUrl ? (
                    <img 
                      src={selectedMachine.imageUrl} 
                      alt="Machine" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">No image</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-primary rounded overflow-hidden">
              <div className="section-header">Machine Info</div>
              <div className="p-3 bg-card space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area:</span>
                  <span className="font-medium">{selectedMachine?.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Manufacturer:</span>
                  <span className="font-medium">{selectedMachine?.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{selectedMachine?.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Person in Charge:</span>
                  <span className="font-medium">{selectedMachine?.personInCharge}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
