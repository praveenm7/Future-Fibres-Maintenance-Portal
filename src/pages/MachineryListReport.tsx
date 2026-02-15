import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { DataTable } from '@/components/ui/DataTable';
import { useMachines } from '@/hooks/useMachines';
import type { Machine } from '@/types/maintenance';
import { Eye, Loader2 } from 'lucide-react';

export default function MachineryListReport() {
  const { useGetMachines } = useMachines();
  const { data: machines = [], isLoading } = useGetMachines();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const columns = [
    {
      key: 'select',
      header: '',
      render: (item: Machine) => (
        <input
          type="checkbox"
          checked={selectedMachine?.id === item.id}
          onChange={() => setSelectedMachine(selectedMachine?.id === item.id ? null : item)}
          className="h-4 w-4 accent-primary cursor-pointer"
        />
      )
    },
    { key: 'finalCode', header: 'FINAL CODE' },
    { key: 'description', header: 'DESCRIPTION' },
    { key: 'area', header: 'AREA' },
    { key: 'manufacturer', header: 'MANUFACTURER' },
    { key: 'model', header: 'MODEL' },
    {
      key: 'permissionRequired',
      header: 'PERMISSION REQUIRED',
      render: (item: Machine) => item.permissionRequired ? 'Y' : 'N'
    },
    { key: 'authorizationGroup', header: 'AUTHORIZATION GROUP' },
    {
      key: 'maintenanceNeeded',
      header: 'MAINTENANCE NEEDED',
      render: (item: Machine) => item.maintenanceNeeded ? 'Y' : 'N'
    },
    { key: 'personInCharge', header: 'PERSON IN CHARGE' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading machinery list...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Tooling & Machinery List" />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Table */}
        <div className="xl:col-span-3">
          <DataTable
            columns={columns}
            data={machines}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => setSelectedMachine(item)}
            selectedId={selectedMachine?.id}
          />
        </div>

        {/* Machine Details Sidebar */}
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground italic p-3 bg-card border border-border rounded">
            Select machine and press button to see more details
          </div>

          <ActionButton
            variant="blue"
            className="w-full flex items-center justify-center gap-2"
            disabled={!selectedMachine}
          >
            <Eye className="h-4 w-4" />
            VIEW DETAILS
          </ActionButton>

          {selectedMachine && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="section-header">Machine Details</div>
              <div className="p-3 bg-card space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchasing Date:</span>
                  <span className="font-medium">{selectedMachine.purchasingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PO Cost:</span>
                  <span className="font-medium">{selectedMachine.purchasingCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PO Number:</span>
                  <span className="font-medium">{selectedMachine.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area:</span>
                  <span className="font-medium">{selectedMachine.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Manufacturer:</span>
                  <span className="font-medium">{selectedMachine.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{selectedMachine.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serial Number:</span>
                  <span className="font-medium">{selectedMachine.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year:</span>
                  <span className="font-medium">{selectedMachine.manufacturerYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Power:</span>
                  <span className="font-medium">{selectedMachine.power}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Authorization Group:</span>
                  <span className="font-medium">{selectedMachine.authorizationGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maintenance:</span>
                  <span className="font-medium">{selectedMachine.maintenanceNeeded ? 'YES' : 'NO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Person in Charge:</span>
                  <span className="font-medium">{selectedMachine.personInCharge}</span>
                </div>
              </div>
            </div>
          )}

          {selectedMachine && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="section-header">Machine Picture</div>
              <div className="p-3 bg-card">
                <div className="aspect-video bg-muted rounded flex items-center justify-center border border-border">
                  {selectedMachine.imageUrl ? (
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
          )}
        </div>
      </div>
    </div>
  );
}
