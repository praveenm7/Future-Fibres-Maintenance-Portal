import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormField, SelectField, InputField } from '@/components/ui/FormField';
import type { NonConformity } from '@/types/maintenance';
import { Plus, Save, Trash, RotateCcw, Loader2 } from 'lucide-react';
import { useMachines } from '@/hooks/useMachines';
import { useNonConformities } from '@/hooks/useNonConformities';
import { useListOptions } from '@/hooks/useListOptions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const emptyNC: NonConformity = {
  id: '',
  ncCode: '',
  machineId: '',
  area: '',
  maintenanceOperator: '',
  creationDate: new Date().toLocaleDateString('en-GB'),
  initiationDate: '',
  status: 'PENDING',
  priority: 1,
  category: 'FAILURE'
};

type Mode = 'new' | 'modify' | 'delete';

export default function NonConformities() {
  const { useGetMachines } = useMachines();
  const {
    useGetNCs,
    useCreateNC,
    useUpdateNC,
    useDeleteNC
  } = useNonConformities();
  const { useGetListOptions } = useListOptions();

  const { data: machines = [], isLoading: loadingMachines } = useGetMachines();

  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [mode, setMode] = useState<Mode>('new');
  const [selectedNCId, setSelectedNCId] = useState('');

  const { data: nonConformities = [], isLoading: loadingNCs } = useGetNCs(selectedMachineId);
  const { data: statusOptions = [] } = useGetListOptions('Statuses');
  const { data: priorityOptions = [] } = useGetListOptions('Priorities');
  const createMutation = useCreateNC();
  const updateMutation = useUpdateNC();
  const deleteMutation = useDeleteNC();

  // Initialize machine selection
  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines]);

  const [formData, setFormData] = useState<NonConformity>(emptyNC);

  // Generate new code on machine change or mode change
  useEffect(() => {
    if (mode === 'new') {
      const nextNum = nonConformities.length + 1;
      const newCode = `NC${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
      setFormData(prev => ({
        ...emptyNC,
        ncCode: newCode,
        machineId: selectedMachineId,
        creationDate: new Date().toLocaleDateString('en-GB')
      }));
    }
  }, [mode, nonConformities, selectedMachineId]);

  // Handle machine selection change
  const handleMachineChange = (machineId: string) => {
    setSelectedMachineId(machineId);
    if (mode !== 'new') {
      setSelectedNCId('');
      setFormData({ ...emptyNC, machineId });
    }
  };

  const handleSelectNC = (ncId: string) => {
    const nc = nonConformities.find(n => n.id === ncId);
    if (nc) {
      setSelectedNCId(ncId);
      setFormData({ ...nc });
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'new') {
      setSelectedNCId('');
    } else {
      const machineNCs = nonConformities.filter(nc => nc.machineId === selectedMachineId);
      if (machineNCs.length > 0) {
        handleSelectNC(machineNCs[0].id);
      } else {
        setSelectedNCId('');
        setFormData({ ...emptyNC, machineId: selectedMachineId });
      }
    }
  };

  const handleSave = async () => {
    if (!formData.maintenanceOperator) {
      toast.error("Operator name is required");
      return;
    }

    try {
      if (mode === 'new') {
        const newNC = {
          ...formData,
          machineId: selectedMachineId,
          area: selectedMachine?.area || ''
        };
        await createMutation.mutateAsync(newNC);
        // Reset will be handled by useEffect after re-fetch
      } else if (mode === 'modify' && selectedNCId) {
        await updateMutation.mutateAsync({
          id: selectedNCId,
          data: formData
        });
      }
    } catch (error) {
      // Handled by mutation toast
    }
  };

  const handleDelete = async () => {
    if (selectedNCId) {
      if (confirm(`Delete Non-Conformity ${formData.ncCode}?`)) {
        try {
          await deleteMutation.mutateAsync(selectedNCId);
          setSelectedNCId('');
          setFormData({ ...emptyNC, machineId: selectedMachineId });

          if (nonConformities.length <= 1) {
            handleModeChange('new');
          }
        } catch (error) {
          // Handled by mutation toast
        }
      }
    }
  };

  const handleInputChange = (field: keyof NonConformity, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const filteredNCs = nonConformities.filter(nc => nc.machineId === selectedMachineId);

  if (loadingMachines) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading machines...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="03-MAINTENANCE NO CONFORMITIES" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-4">
            <ActionButton
              variant="green"
              onClick={() => handleModeChange('new')}
              className={cn("flex-1", mode === 'new' && "ring-2 ring-offset-2 ring-primary")}
            >
              <Plus className="h-4 w-4 mr-2" /> NEW NC
            </ActionButton>
            <ActionButton
              variant="blue"
              onClick={() => handleModeChange('modify')}
              className={cn("flex-1", mode === 'modify' && "ring-2 ring-offset-2 ring-primary")}
            >
              <Save className="h-4 w-4 mr-2" /> MODIFY NC
            </ActionButton>
            <ActionButton
              variant="red"
              onClick={() => handleModeChange('delete')}
              className={cn("flex-1", mode === 'delete' && "ring-2 ring-offset-2 ring-destructive")}
            >
              <Trash className="h-4 w-4 mr-2" /> DELETE NC
            </ActionButton>
          </div>

          {/* Machine Selection */}
          <div className="border border-primary rounded overflow-hidden shadow-sm">
            <div className="section-header">Select Machine</div>

            <div className="flex border-b border-border">
              <div className="form-label min-w-[180px] bg-muted/50">MACHINE CODE</div>
              <select
                value={selectedMachineId}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="flex-1 bg-card text-foreground px-4 py-2 font-bold focus:outline-none"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.finalCode}
                  </option>
                ))}
              </select>
              <div className="bg-muted px-4 py-2 italic border-l border-border flex-1 truncate">
                {selectedMachine?.description}
              </div>
            </div>

            <FormField label="AREA">
              <span className="font-medium">{selectedMachine?.area}</span>
            </FormField>
          </div>

          {/* Modifications - NC Selection Dropdown */}
          {(mode !== 'new') && (
            <div className={cn(
              "border rounded-lg p-4 shadow-sm animate-in fade-in slide-in-from-top-2",
              mode === 'delete' ? "bg-destructive/10 border-destructive" : "bg-blue-50/50 border-blue-200"
            )}>
              <label className="block text-sm font-medium mb-2">
                {mode === 'delete' ? 'Select NC to Delete:' : 'Select NC to Modify:'}
              </label>
              <div className="relative">
                <select
                  value={selectedNCId}
                  onChange={(e) => handleSelectNC(e.target.value)}
                  className="w-full p-2 rounded border border-input bg-background pr-10"
                  disabled={loadingNCs}
                >
                  <option value="" disabled>Select an NC...</option>
                  {filteredNCs.length === 0 && !loadingNCs && <option disabled>No NCs found for this machine</option>}
                  {filteredNCs.map(nc => (
                    <option key={nc.id} value={nc.id}>
                      {nc.ncCode} - {nc.status} ({nc.creationDate})
                    </option>
                  ))}
                </select>
                {loadingNCs && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NC Details */}
          <div className={cn("border border-primary rounded overflow-hidden transition-opacity",
            (mode === 'delete' && !selectedNCId) || (mode === 'modify' && !selectedNCId) ? "opacity-50 pointer-events-none" : ""
          )}>
            <div className="section-header">NC Details</div>

            <div className="flex border-b border-border items-center p-2 bg-muted/30">
              <div className="form-label flex-shrink-0 mr-4">NC CODE</div>
              <div className="font-mono text-xl font-bold text-primary">
                {formData.ncCode}
              </div>
            </div>

            <div className="p-4 space-y-4 bg-card">
              <InputField
                label="MAINTENANCE OPERATOR"
                value={formData.maintenanceOperator}
                onChange={(v) => handleInputChange('maintenanceOperator', v)}
                placeholder="Enter operator name..."
                readOnly={mode === 'delete'}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="CREATION DATE"
                  value={formData.creationDate}
                  onChange={(v) => handleInputChange('creationDate', v)}
                  placeholder="DD/MM/YYYY"
                  readOnly={mode === 'delete'}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                <InputField
                  label="INITIATION DATE"
                  value={formData.initiationDate || ''}
                  onChange={(v) => handleInputChange('initiationDate', v)}
                  placeholder="DD/MM/YYYY"
                  readOnly={mode === 'delete'}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="STATUS"
                  value={formData.status}
                  onChange={(v) => handleInputChange('status', v)}
                  options={statusOptions.map(s => ({ value: s.value, label: s.value }))}
                  disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
                />
                <SelectField
                  label="PRIORITY"
                  value={String(formData.priority)}
                  onChange={(v) => handleInputChange('priority', parseInt(v))}
                  options={priorityOptions.map(p => ({ value: p.value, label: p.value }))}
                  disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-muted/20 border-t border-border flex gap-4">
              {mode === 'delete' ? (
                <ActionButton
                  variant="red"
                  className="w-full"
                  onClick={handleDelete}
                  disabled={!selectedNCId || deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4 mr-2" />
                  )}
                  DELETE NC
                </ActionButton>
              ) : (
                <ActionButton
                  variant={mode === 'new' ? 'green' : 'blue'}
                  className="w-full"
                  onClick={handleSave}
                  disabled={(mode === 'modify' && !selectedNCId) || createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    mode === 'new' ? <Plus className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />
                  )}
                  {mode === 'new' ? 'ADD NC' : 'UPDATE NC'}
                </ActionButton>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-card border border-border rounded p-4 shadow-sm">
            <p className="text-sm text-muted-foreground italic">
              <span className="font-medium text-primary">Instructions:</span><br />
              {mode === 'new' && "Select machine, input details, and click ADD NC."}
              {mode === 'modify' && "Select the NC to modify from the dropdown, edit details, and click UPDATE NC."}
              {mode === 'delete' && "Select the NC to delete and click DELETE NC."}
            </p>
          </div>
        </div>

        {/* Right Column - Machine Picture */}
        <div className="space-y-4">
          <div className="border border-primary rounded overflow-hidden shadow-sm bg-card">
            <div className="section-header">Machine Picture</div>
            <div className="p-4">
              <div className="aspect-square bg-muted/50 rounded flex items-center justify-center border-2 border-dashed border-border">
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

          <div className="border border-primary rounded overflow-hidden shadow-sm bg-card">
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
