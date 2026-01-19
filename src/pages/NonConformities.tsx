import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormField, SelectField, InputField } from '@/components/ui/FormField';
import { machines, nonConformities, statuses, priorities } from '@/data/mockData';
import { Plus } from 'lucide-react';

export default function NonConformities() {
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || '');
  const [formData, setFormData] = useState({
    ncCode: `NC${new Date().getFullYear()}-${String(nonConformities.length + 1).padStart(4, '0')}`,
    maintenanceOperator: '',
    creationDate: new Date().toLocaleDateString('en-GB'),
    initiationDate: '',
    status: 'PENDING',
    priority: '1',
  });

  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <PageHeader title="03-MAINTENANCE NO CONFORMITIES" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Machine Selection */}
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Select Machine</div>
            
            <div className="flex border-b border-border">
              <div className="form-label min-w-[180px]">MACHINE CODE</div>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="flex-1 bg-accent text-accent-foreground px-4 py-2 font-bold"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.finalCode}
                  </option>
                ))}
              </select>
              <div className="bg-card px-4 py-2 italic border-l border-border flex-1">
                {selectedMachine?.description}
              </div>
            </div>

            <FormField label="AREA">
              <span>{selectedMachine?.area}</span>
            </FormField>
          </div>

          {/* NC Details */}
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">NC Details</div>
            
            <div className="flex border-b border-border">
              <ActionButton variant="green" className="m-2">
                <Plus className="h-4 w-4 inline mr-2" />
                ADD NC
              </ActionButton>
              <div className="form-label flex-shrink-0">NC CODE</div>
              <div className="form-input font-bold text-success">
                {formData.ncCode}
              </div>
            </div>

            <InputField
              label="MAINTENANCE OPERATOR"
              value={formData.maintenanceOperator}
              onChange={(v) => handleInputChange('maintenanceOperator', v)}
              placeholder="Enter operator name..."
            />
            <InputField
              label="CREATION DATE"
              value={formData.creationDate}
              onChange={(v) => handleInputChange('creationDate', v)}
              placeholder="DD/MM/YYYY"
            />
            <InputField
              label="INITIATION DATE"
              value={formData.initiationDate}
              onChange={(v) => handleInputChange('initiationDate', v)}
              placeholder="DD/MM/YYYY"
            />
            <SelectField
              label="STATUS"
              value={formData.status}
              onChange={(v) => handleInputChange('status', v)}
              options={statuses.map(s => ({ value: s, label: s }))}
            />
            <SelectField
              label="PRIORITY"
              value={formData.priority}
              onChange={(v) => handleInputChange('priority', v)}
              options={priorities.map(p => ({ value: String(p), label: String(p) }))}
            />
          </div>

          {/* Instructions */}
          <div className="bg-card border border-border rounded p-4">
            <p className="text-sm text-muted-foreground italic">
              <span className="font-medium">Create a new NC:</span><br/>
              Select the machine (all data will show) and input maintenance operator, 
              and creation / initiation date, and select status and priority. 
              Then click ADD NC
            </p>
          </div>
        </div>

        {/* Right Column - Machine Picture */}
        <div className="space-y-4">
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Machine Picture</div>
            <div className="p-4 bg-card">
              <div className="aspect-square bg-muted rounded flex items-center justify-center border-2 border-dashed border-border">
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
                <span className="text-muted-foreground">Code:</span>
                <span className="font-medium">{selectedMachine?.finalCode}</span>
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
  );
}
