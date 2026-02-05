import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormField, SelectField, InputField, CheckboxField } from '@/components/ui/FormField';
import type { Machine } from '@/types/maintenance';
import { Eye, Upload, Printer, FileText, BookOpen, Save, Trash, Plus, RotateCcw, Loader2 } from 'lucide-react';
import { useMachines } from '@/hooks/useMachines';
import { useListOptions } from '@/hooks/useListOptions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

type Mode = 'new' | 'modify' | 'delete';

export default function MachineManagement() {
  const navigate = useNavigate();
  const {
    useGetMachines,
    useCreateMachine,
    useUpdateMachine,
    useDeleteMachine
  } = useMachines();
  const { useGetListOptions } = useListOptions();

  const { data: machines = [], isLoading: loadingMachines, isError } = useGetMachines();
  const { data: typeOptions = [] } = useGetListOptions('Machine Types');
  const { data: groupOptions = [] } = useGetListOptions('Machine Groups');
  const { data: areaOptions = [] } = useGetListOptions('Areas');
  const createMachineMutation = useCreateMachine();
  const updateMachineMutation = useUpdateMachine();
  const deleteMachineMutation = useDeleteMachine();

  const [mode, setMode] = useState<Mode>('new');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [formData, setFormData] = useState<Machine>(emptyMachine);

  // When mode changes to modify or delete, auto-select first machine if available
  useEffect(() => {
    if ((mode === 'modify' || mode === 'delete') && machines.length > 0 && !selectedMachineId) {
      handleSelectMachine(machines[0].id);
    }
  }, [mode, machines]);

  const handleSelectMachine = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (machine) {
      setSelectedMachineId(machineId);
      setFormData({ ...machine });
    }
  };

  const handleInputChange = (field: keyof Machine, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSetMode = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'new') {
      setSelectedMachineId('');
      setFormData({ ...emptyMachine });
    }
  };

  // Generate final code based on type and group
  const generateFinalCode = () => {
    // Only generate new code in 'new' mode
    if (mode !== 'new') return formData.finalCode;

    const typeNum = formData.type === 'MACHINE' ? '01' : '02';
    const groupNum = formData.group.replace('EC', '0');
    // Simple sequence generation based on total count
    const seq = String(machines.length + 1).padStart(4, '0');
    return `${typeNum}-${groupNum}-${seq}`;
  };

  const handleSave = async () => {
    if (!formData.description) {
      toast.error("Description is required");
      return;
    }

    try {
      if (mode === 'new') {
        const newMachine = {
          ...formData,
          finalCode: generateFinalCode(),
        };
        await createMachineMutation.mutateAsync(newMachine);
        setFormData({ ...emptyMachine }); // Reset after add
      } else if (mode === 'modify') {
        await updateMachineMutation.mutateAsync({
          id: selectedMachineId,
          data: formData
        });
      }
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  const handleDeleteAction = async () => {
    if (selectedMachineId) {
      if (confirm(`Are you sure you want to delete ${formData.description}?`)) {
        try {
          await deleteMachineMutation.mutateAsync(selectedMachineId);
          // Reset selection
          setSelectedMachineId('');
          setFormData({ ...emptyMachine });

          // If no machines left, switch to new mode
          if (machines.length <= 1) {
            handleSetMode('new');
          }
        } catch (error) {
          // Error handled by mutation toast
        }
      }
    }
  };

  if (loadingMachines) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading machines from database...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <RotateCcw className="h-8 w-8 text-destructive mb-4" />
        <p className="text-destructive font-medium">Failed to load machines</p>
        <ActionButton variant="blue" onClick={() => window.location.reload()} className="mt-4">
          RETRY
        </ActionButton>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="01-MACHINE MANAGEMENT" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Actions & Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <ActionButton
              variant="green"
              onClick={() => handleSetMode('new')}
              className={cn("w-full justify-start pl-4", mode === 'new' && "ring-2 ring-offset-2 ring-primary")}
            >
              <Plus className="mr-2 h-4 w-4" />
              NEW MACHINE
            </ActionButton>

            <ActionButton
              variant="red"
              onClick={() => handleSetMode('delete')}
              className={cn("w-full justify-start pl-4", mode === 'delete' && "ring-2 ring-offset-2 ring-destructive")}
            >
              <Trash className="mr-2 h-4 w-4" />
              DELETE MACHINE
            </ActionButton>

            <ActionButton
              variant="blue"
              onClick={() => handleSetMode('modify')}
              className={cn("w-full justify-start pl-4", mode === 'modify' && "ring-2 ring-offset-2 ring-primary")}
            >
              <Save className="mr-2 h-4 w-4" />
              MODIFY MACHINE
            </ActionButton>
          </div>

          <ActionButton
            variant="blue"
            onClick={() => navigate('/reports/machinery-list')}
            className="w-full justify-start pl-4"
          >
            <Eye className="h-4 w-4 inline mr-2" />
            SHOW REPORT
          </ActionButton>

          <div className="text-sm text-muted-foreground italic mt-4 pl-1">
            Show the complete list of Machinery
          </div>

          {/* Machine Selection Dropdown - Visible for Modify and Delete modes */}
          {(mode === 'modify' || mode === 'delete') && (
            <div className={cn(
              "border rounded-lg p-4 shadow-sm mt-4 animate-in fade-in slide-in-from-top-2",
              mode === 'delete' ? "bg-destructive/10 border-destructive/20" : "bg-card border-border"
            )}>
              <label className="block text-sm font-medium mb-2 text-foreground">
                {mode === 'delete' ? 'Select Machine to Delete:' : 'Select Machine to Modify:'}
              </label>
              <select
                value={selectedMachineId}
                onChange={(e) => handleSelectMachine(e.target.value)}
                className="w-full bg-background border border-input text-foreground px-3 py-2 rounded-md focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="" disabled>Select a machine...</option>
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
        <div className={cn("space-y-6 transition-opacity duration-200", mode === 'delete' && "opacity-80 pointer-events-none")}>
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="section-header">Machine Information</div>
            <div className="p-4 space-y-4">
              <SelectField
                label="SELECT TYPE"
                value={formData.type}
                onChange={(v) => handleInputChange('type', v)}
                options={typeOptions.map(t => ({ value: t.value, label: t.value }))}
              />
              <SelectField
                label="SELECT GROUP"
                value={formData.group}
                onChange={(v) => handleInputChange('group', v)}
                options={groupOptions.map(g => ({ value: g.value, label: g.value }))}
              />
              <FormField label="FINAL CODE">
                <span className="font-mono font-bold text-primary text-lg">
                  {generateFinalCode()}
                </span>
              </FormField>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="section-header">Details</div>
            <div className="p-4 space-y-4">
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
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="section-header">Technical Specs</div>
            <div className="p-4 space-y-4">
              <SelectField
                label="AREA"
                value={formData.area}
                onChange={(v) => handleInputChange('area', v)}
                options={areaOptions.map(a => ({ value: a.value, label: a.value }))}
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
        </div>

        {/* Right Column - Settings & Image */}
        <div className={cn("space-y-6 transition-opacity duration-200", mode === 'delete' && "opacity-80 pointer-events-none")}>
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="section-header">Settings</div>
            <div className="p-4 space-y-4">
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
          </div>

          {/* Machine Picture */}
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="section-header">Machine Picture</div>
            <div className="p-4">
              <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-border/50">
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Machine"
                    className="max-w-full max-h-full object-contain rounded-md"
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">No image available</span>
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

          {/* Dynamic Bottom Actions */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-border pointer-events-auto">
            {mode === 'delete' ? (
              <ActionButton
                variant="red"
                className="flex-1 shadow-md hover:shadow-lg transition-all animate-in zoom-in duration-300"
                onClick={handleDeleteAction}
                disabled={!selectedMachineId || deleteMachineMutation.isPending}
              >
                {deleteMachineMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4 mr-2" />
                )}
                DELETE
              </ActionButton>
            ) : (
              <ActionButton
                variant="green"
                className="flex-1 shadow-md hover:shadow-lg transition-all"
                onClick={handleSave}
                disabled={createMachineMutation.isPending || updateMachineMutation.isPending}
              >
                {createMachineMutation.isPending || updateMachineMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                SAVE
              </ActionButton>
            )}

            <ActionButton
              variant="red"
              className="flex-1 shadow-md hover:shadow-lg transition-all"
              onClick={() => handleSetMode('new')}
              disabled={createMachineMutation.isPending || updateMachineMutation.isPending || deleteMachineMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              CANCEL
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to wrap the component if error occurs
export function MachineManagementWithErrorBoundary() {
  return <MachineManagement />;
}
