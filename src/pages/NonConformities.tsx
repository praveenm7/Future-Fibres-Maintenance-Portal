import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormField, SelectField, InputField } from '@/components/ui/FormField';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines]);

  const [formData, setFormData] = useState<NonConformity>(emptyNC);

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
      <PageHeader title="Non-Conformities" />

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => handleModeChange(v as Mode)} className="mb-6">
        <TabsList>
          <TabsTrigger value="new" className="gap-1.5">
            <Plus className="h-4 w-4" /> New
          </TabsTrigger>
          <TabsTrigger value="modify" className="gap-1.5">
            <Save className="h-4 w-4" /> Modify
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-1.5">
            <Trash className="h-4 w-4" /> Delete
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Machine Selection */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="section-header">Select Machine</div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Machine Code</label>
                  <select
                    value={selectedMachineId}
                    onChange={(e) => handleMachineChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.finalCode}</option>
                    ))}
                  </select>
                </div>
                <FormField label="Area">
                  <span className="font-medium text-sm">{selectedMachine?.area}</span>
                </FormField>
              </div>
              <p className="text-sm text-muted-foreground">{selectedMachine?.description}</p>
            </div>
          </div>

          {/* NC Selection Dropdown */}
          {(mode !== 'new') && (
            <div className={cn(
              "border rounded-lg p-4 animate-in fade-in slide-in-from-top-2",
              mode === 'delete' ? "bg-destructive/5 border-destructive/20" : "bg-muted/20 border-border"
            )}>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                {mode === 'delete' ? 'Select NC to delete' : 'Select NC to modify'}
              </label>
              <div className="relative">
                <select
                  value={selectedNCId}
                  onChange={(e) => handleSelectNC(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background text-sm px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ring"
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
          <div className={cn("bg-card border border-border rounded-lg overflow-hidden transition-opacity",
            (mode === 'delete' && !selectedNCId) || (mode === 'modify' && !selectedNCId) ? "opacity-50 pointer-events-none" : ""
          )}>
            <div className="section-header">NC Details</div>

            <div className="flex items-center p-4 border-b border-border bg-muted/20">
              <span className="text-sm font-medium text-muted-foreground mr-4">NC Code</span>
              <span className="font-mono text-lg font-semibold text-primary">
                {formData.ncCode}
              </span>
            </div>

            <div className="p-4 space-y-4">
              <InputField
                label="Maintenance Operator"
                value={formData.maintenanceOperator}
                onChange={(v) => handleInputChange('maintenanceOperator', v)}
                placeholder="Enter operator name..."
                readOnly={mode === 'delete'}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Creation Date"
                  value={formData.creationDate}
                  onChange={(v) => handleInputChange('creationDate', v)}
                  placeholder="DD/MM/YYYY"
                  readOnly={mode === 'delete'}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                <InputField
                  label="Initiation Date"
                  value={formData.initiationDate || ''}
                  onChange={(v) => handleInputChange('initiationDate', v)}
                  placeholder="DD/MM/YYYY"
                  readOnly={mode === 'delete'}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Status"
                  value={formData.status}
                  onChange={(v) => handleInputChange('status', v)}
                  options={statusOptions.map(s => ({ value: s.value, label: s.value }))}
                  disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
                />
                <SelectField
                  label="Priority"
                  value={String(formData.priority)}
                  onChange={(v) => handleInputChange('priority', parseInt(v))}
                  options={priorityOptions.map(p => ({ value: p.value, label: p.value }))}
                  disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border flex gap-4">
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
                  Delete NC
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
                  {mode === 'new' ? 'Add NC' : 'Update NC'}
                </ActionButton>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Machine Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="section-header">Machine Picture</div>
            <div className="p-4">
              <div className="aspect-square bg-muted/30 rounded-md flex items-center justify-center border border-dashed border-border">
                {selectedMachine?.imageUrl ? (
                  <img src={selectedMachine.imageUrl} alt="Machine" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-muted-foreground text-sm">No image</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="section-header">Machine Info</div>
            <div className="p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Code</span>
                <span className="font-medium">{selectedMachine?.finalCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manufacturer</span>
                <span className="font-medium">{selectedMachine?.manufacturer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium">{selectedMachine?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Person in Charge</span>
                <span className="font-medium">{selectedMachine?.personInCharge}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
