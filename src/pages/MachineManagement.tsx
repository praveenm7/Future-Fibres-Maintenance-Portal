import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormField, SelectField, InputField, CheckboxField } from '@/components/ui/FormField';
import { machines, machineTypes, machineGroups, areas } from '@/data/mockData';
import type { Machine } from '@/types/maintenance';
import { Eye, Upload, Printer, FileText, BookOpen } from 'lucide-react';

const emptyMachine: Machine = {
  id: '',
  finalCode: '',
  type: 'MACHINE',
  group: 'EC6',
  description: '',
  purchasingDate: '',
  purchasingCost: '',
  poNumber: '',
  area: 'IHM',
  manufacturer: '',
  model: '',
  serialNumber: '',
  manufacturerYear: '',
  power: '',
  permissionRequired: false,
  authorizationGroup: '',
  maintenanceNeeded: false,
  maintenanceOnHold: false,
  personInCharge: '',
};

export default function MachineManagement() {
  const [mode, setMode] = useState<'new' | 'modify'>('new');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState<Machine>(emptyMachine);

  const handleSelectMachine = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (machine) {
      setSelectedMachine(machine);
      setFormData(machine);
    }
  };

  const handleInputChange = (field: keyof Machine, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewMachine = () => {
    setMode('new');
    setSelectedMachine(null);
    setFormData(emptyMachine);
  };

  const handleModifyMachine = () => {
    setMode('modify');
    if (machines.length > 0) {
      handleSelectMachine(machines[0].id);
    }
  };

  // Generate final code based on type and group
  const generateFinalCode = () => {
    const typeNum = formData.type === 'MACHINE' ? '01' : '02';
    const groupNum = formData.group.replace('EC', '0');
    const seq = String(machines.length + 1).padStart(4, '0');
    return `${typeNum}-${groupNum}-${seq}`;
  };

  return (
    <div>
      <PageHeader title="01-MACHINE MANAGEMENT" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Actions & Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <ActionButton 
              variant="red" 
              onClick={handleNewMachine}
              className="w-full"
            >
              NEW MACHINE
            </ActionButton>
            <ActionButton 
              variant="red" 
              onClick={() => {}}
              className="w-full"
            >
              DELETE MACHINE
            </ActionButton>
            <ActionButton 
              variant="green" 
              onClick={handleModifyMachine}
              className="w-full"
            >
              MODIFY MACHINE
            </ActionButton>
          </div>

          <ActionButton 
            variant="red" 
            onClick={() => window.location.href = '/reports/machinery-list'}
            className="w-full"
          >
            <Eye className="h-4 w-4 inline mr-2" />
            SHOW REPORT
          </ActionButton>

          <div className="text-sm text-muted-foreground italic mt-4">
            Show the complete list of Machinery
          </div>

          {mode === 'modify' && (
            <div className="border border-border rounded p-3 mt-4">
              <label className="block text-sm font-medium mb-2">Select Machine:</label>
              <select
                value={selectedMachine?.id || ''}
                onChange={(e) => handleSelectMachine(e.target.value)}
                className="w-full bg-accent text-accent-foreground px-3 py-2 rounded"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.finalCode} - {m.description}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Middle Column - Main Form */}
        <div className="space-y-4">
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Machine Information</div>
            
            <SelectField
              label="SELECT TYPE"
              value={formData.type}
              onChange={(v) => handleInputChange('type', v)}
              options={machineTypes.map(t => ({ value: t, label: t }))}
            />
            <SelectField
              label="SELECT GROUP"
              value={formData.group}
              onChange={(v) => handleInputChange('group', v)}
              options={machineGroups.map(g => ({ value: g, label: g }))}
            />
            <FormField label="FINAL CODE">
              <span className="font-bold text-success">
                {mode === 'modify' ? formData.finalCode : generateFinalCode()}
              </span>
            </FormField>
          </div>

          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Details</div>
            
            <InputField
              label="DESCRIPTION"
              value={formData.description}
              onChange={(v) => handleInputChange('description', v)}
            />
            <InputField
              label="PURCHASING DATE"
              value={formData.purchasingDate}
              onChange={(v) => handleInputChange('purchasingDate', v)}
              placeholder="DD/MM/YYYY"
            />
            <InputField
              label="PURCHASING COST"
              value={formData.purchasingCost}
              onChange={(v) => handleInputChange('purchasingCost', v)}
            />
            <InputField
              label="PO NUMBER"
              value={formData.poNumber}
              onChange={(v) => handleInputChange('poNumber', v)}
            />
          </div>

          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Technical Specs</div>
            
            <SelectField
              label="AREA"
              value={formData.area}
              onChange={(v) => handleInputChange('area', v)}
              options={areas.map(a => ({ value: a, label: a }))}
            />
            <InputField
              label="MANUFACTURER"
              value={formData.manufacturer}
              onChange={(v) => handleInputChange('manufacturer', v)}
            />
            <InputField
              label="MODEL"
              value={formData.model}
              onChange={(v) => handleInputChange('model', v)}
            />
            <InputField
              label="SERIAL NUMBER"
              value={formData.serialNumber}
              onChange={(v) => handleInputChange('serialNumber', v)}
            />
            <InputField
              label="MANUFACTURER YEAR"
              value={formData.manufacturerYear}
              onChange={(v) => handleInputChange('manufacturerYear', v)}
            />
            <InputField
              label="POWER"
              value={formData.power}
              onChange={(v) => handleInputChange('power', v)}
            />
          </div>
        </div>

        {/* Right Column - Settings & Image */}
        <div className="space-y-4">
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Settings</div>
            
            <CheckboxField
              label="PERMISSION REQUIRED"
              checked={formData.permissionRequired}
              onChange={(v) => handleInputChange('permissionRequired', v)}
            />
            <InputField
              label="AUTHORIZATION GROUP"
              value={formData.authorizationGroup}
              onChange={(v) => handleInputChange('authorizationGroup', v)}
            />
            <CheckboxField
              label="MAINTENANCE NEEDED"
              checked={formData.maintenanceNeeded}
              onChange={(v) => handleInputChange('maintenanceNeeded', v)}
            />
            <CheckboxField
              label="MAINTENANCE ON HOLD"
              checked={formData.maintenanceOnHold}
              onChange={(v) => handleInputChange('maintenanceOnHold', v)}
            />
            <InputField
              label="PERSON IN CHARGE"
              value={formData.personInCharge}
              onChange={(v) => handleInputChange('personInCharge', v)}
            />
          </div>

          {/* Machine Picture */}
          <div className="border border-primary rounded overflow-hidden">
            <div className="section-header">Machine Picture</div>
            <div className="p-4 bg-card">
              <div className="aspect-video bg-muted rounded flex items-center justify-center border-2 border-dashed border-border">
                {formData.imageUrl ? (
                  <img 
                    src={formData.imageUrl} 
                    alt="Machine" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-muted-foreground">No image</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <ActionButton variant="blue" className="w-full flex items-center justify-center gap-2">
              <Upload className="h-4 w-4" />
              UPLOAD PHOTO
            </ActionButton>
            <ActionButton variant="blue" className="w-full flex items-center justify-center gap-2">
              <Printer className="h-4 w-4" />
              PRINT LABEL
            </ActionButton>
            <ActionButton variant="blue" className="w-full flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              UPLOAD DOC.
            </ActionButton>
            <ActionButton variant="blue" className="w-full flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              UPLOAD MANUAL
            </ActionButton>
          </div>

          <div className="flex gap-2 mt-6">
            <ActionButton variant="green" className="flex-1">
              SAVE
            </ActionButton>
            <ActionButton variant="red" className="flex-1">
              CANCEL
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
