import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormField, SelectField, InputField, CheckboxField } from '@/components/ui/FormField';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Machine } from '@/types/maintenance';
import { Eye, Upload, Printer, FileText, BookOpen, Save, Trash, Plus, RotateCcw, Loader2, X } from 'lucide-react';
import { useMachines } from '@/hooks/useMachines';
import { useListOptions } from '@/hooks/useListOptions';
import { useMachineDocuments } from '@/hooks/useMachineDocuments';
import { FileUploadDialog } from '@/components/machines/FileUploadDialog';
import { PrintLabelDialog } from '@/components/machines/PrintLabelDialog';
import { DocumentsList } from '@/components/machines/DocumentsList';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SERVER_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api').replace('/api', '');

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
  const { data: typeOptions = [] } = useGetListOptions('MACHINE_TYPE');
  const { data: groupOptions = [] } = useGetListOptions('MACHINE_GROUP');
  const { data: areaOptions = [] } = useGetListOptions('AREA');
  const createMachineMutation = useCreateMachine();
  const updateMachineMutation = useUpdateMachine();
  const deleteMachineMutation = useDeleteMachine();

  const { useGetDocuments, useUploadPhoto, useUploadDocument, useDeleteDocument } = useMachineDocuments();

  const [mode, setMode] = useState<Mode>('new');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [formData, setFormData] = useState<Machine>(emptyMachine);

  // Dialog state
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docCategory, setDocCategory] = useState<'DOCUMENT' | 'MANUAL'>('DOCUMENT');

  // Pending files for New mode (uploaded before machine is saved)
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingDocs, setPendingDocs] = useState<{ file: File; category: 'DOCUMENT' | 'MANUAL' }[]>([]);

  // Document hooks
  const uploadPhotoMutation = useUploadPhoto();
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();
  const { data: documents = [] } = useGetDocuments(selectedMachineId);

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
      setPendingPhoto(null);
      setPendingDocs([]);
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
        const created = await createMachineMutation.mutateAsync(newMachine);

        // Upload pending photo if any
        if (pendingPhoto && created && (created as Machine).id) {
          try {
            await uploadPhotoMutation.mutateAsync({ machineId: (created as Machine).id, file: pendingPhoto });
          } catch { /* photo upload failure is non-critical */ }
        }

        // Upload pending documents if any
        for (const doc of pendingDocs) {
          try {
            const fd = new FormData();
            fd.append('file', doc.file);
            fd.append('machineId', (created as Machine).id);
            fd.append('category', doc.category);
            await uploadDocMutation.mutateAsync(fd);
          } catch { /* doc upload failure is non-critical */ }
        }

        setPendingPhoto(null);
        setPendingDocs([]);
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
        <p className="text-muted-foreground">Loading machines...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <RotateCcw className="h-8 w-8 text-destructive mb-4" />
        <p className="text-destructive font-medium">Failed to load machines</p>
        <ActionButton variant="blue" onClick={() => window.location.reload()} className="mt-4">
          Retry
        </ActionButton>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Machine Management" />

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => handleSetMode(v as Mode)} className="mb-6">
        <TabsList>
          <TabsTrigger value="new" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New
          </TabsTrigger>
          <TabsTrigger value="modify" className="gap-1.5">
            <Save className="h-4 w-4" />
            Modify
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-1.5">
            <Trash className="h-4 w-4" />
            Delete
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Selection & Actions */}
        <div className="space-y-6">
          {/* Machine Selection Dropdown - Visible for Modify and Delete modes */}
          {(mode === 'modify' || mode === 'delete') && (
            <div className={cn(
              "border rounded-lg p-4 animate-in fade-in slide-in-from-top-2",
              mode === 'delete' ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
            )}>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                {mode === 'delete' ? 'Select machine to delete' : 'Select machine to modify'}
              </label>
              <select
                value={selectedMachineId}
                onChange={(e) => handleSelectMachine(e.target.value)}
                className="w-full h-9 bg-background border border-input text-foreground text-sm px-3 rounded-md focus:ring-2 focus:ring-ring focus:outline-none"
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

          <ActionButton
            variant="blue"
            onClick={() => navigate('/reports/machinery-list')}
            className="w-full justify-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Machinery Report
          </ActionButton>

          {/* Machine Picture */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="section-header">Machine Picture</div>
            <div className="p-4">
              <div className="relative aspect-video bg-muted/30 rounded-md flex items-center justify-center border border-dashed border-border">
                {formData.imageUrl ? (
                  <>
                    <img
                      src={formData.imageUrl.startsWith('http') || formData.imageUrl.startsWith('blob:') ? formData.imageUrl : `${SERVER_BASE}${formData.imageUrl}`}
                      alt="Machine"
                      className="max-w-full max-h-full object-contain rounded-md"
                    />
                    {mode !== 'delete' && (
                      <button
                        onClick={() => {
                          if (confirm('Remove this photo?')) {
                            if (pendingPhoto) {
                              URL.revokeObjectURL(formData.imageUrl!);
                              setPendingPhoto(null);
                            }
                            setFormData(prev => ({ ...prev, imageUrl: '' }));
                          }
                        }}
                        className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white rounded-full p-0.5"
                        title="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">No image available</span>
                )}
              </div>
            </div>
          </div>

          {/* Utility Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              variant="blue"
              className="justify-center gap-2"
              onClick={() => setPhotoDialogOpen(true)}
              disabled={mode === 'delete'}
            >
              <Upload className="h-4 w-4" />
              Upload Photo
            </ActionButton>
            <ActionButton
              variant="blue"
              className="justify-center gap-2"
              onClick={() => setPrintDialogOpen(true)}
              disabled={mode === 'delete'}
            >
              <Printer className="h-4 w-4" />
              Print Label
            </ActionButton>
            <ActionButton
              variant="blue"
              className="justify-center gap-2"
              onClick={() => { setDocCategory('DOCUMENT'); setDocDialogOpen(true); }}
              disabled={mode === 'delete'}
            >
              <FileText className="h-4 w-4" />
              Upload Doc
            </ActionButton>
            <ActionButton
              variant="blue"
              className="justify-center gap-2"
              onClick={() => { setDocCategory('MANUAL'); setDocDialogOpen(true); }}
              disabled={mode === 'delete'}
            >
              <BookOpen className="h-4 w-4" />
              Upload Manual
            </ActionButton>
          </div>

          {/* Pending docs in New mode */}
          {mode === 'new' && pendingDocs.length > 0 && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="section-header">Pending Uploads</div>
              <div className="p-2 space-y-1 text-sm">
                {pendingDocs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 group">
                    {doc.category === 'MANUAL'
                      ? <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="truncate flex-1">{doc.file.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 uppercase">
                      {doc.category === 'MANUAL' ? 'Manual' : 'Doc'}
                    </span>
                    <button
                      onClick={() => setPendingDocs(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-destructive/60 hover:text-destructive shrink-0"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic px-1.5 pt-1">
                  These will be uploaded when you save the machine.
                </p>
              </div>
            </div>
          )}

          {/* Documents List */}
          {selectedMachineId && mode !== 'new' && (
            <DocumentsList
              documents={documents}
              onDelete={(id) => deleteDocMutation.mutate(id)}
            />
          )}

          {/* Dialogs */}
          <FileUploadDialog
            open={photoDialogOpen}
            onOpenChange={setPhotoDialogOpen}
            title="Upload Machine Photo"
            accept="image/jpeg,image/png,image/gif,image/webp"
            isUploading={uploadPhotoMutation.isPending}
            onUpload={(file) => {
              if (mode === 'new') {
                // Store locally — will be uploaded when machine is saved
                setPendingPhoto(file);
                const blobUrl = URL.createObjectURL(file);
                setFormData(prev => ({ ...prev, imageUrl: blobUrl }));
                setPhotoDialogOpen(false);
                toast.success('Photo will be uploaded when machine is saved');
              } else {
                uploadPhotoMutation.mutate(
                  { machineId: selectedMachineId, file },
                  {
                    onSuccess: (data) => {
                      setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
                      setPhotoDialogOpen(false);
                    },
                  }
                );
              }
            }}
          />

          <FileUploadDialog
            open={docDialogOpen}
            onOpenChange={setDocDialogOpen}
            title={docCategory === 'MANUAL' ? 'Upload Manual' : 'Upload Document'}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
            isUploading={uploadDocMutation.isPending}
            onUpload={(file) => {
              if (mode === 'new') {
                // Store locally — will be uploaded when machine is saved
                setPendingDocs(prev => [...prev, { file, category: docCategory }]);
                setDocDialogOpen(false);
                toast.success(`${docCategory === 'MANUAL' ? 'Manual' : 'Document'} will be uploaded when machine is saved`);
              } else {
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);
                formDataUpload.append('machineId', selectedMachineId);
                formDataUpload.append('category', docCategory);
                uploadDocMutation.mutate(formDataUpload, {
                  onSuccess: () => setDocDialogOpen(false),
                });
              }
            }}
          />

          <PrintLabelDialog
            open={printDialogOpen}
            onOpenChange={setPrintDialogOpen}
            machine={{ ...formData, finalCode: formData.finalCode || generateFinalCode() }}
          />
        </div>

        {/* Middle Column - Main Form */}
        <div className={cn("space-y-6 transition-opacity duration-200", mode === 'delete' && "opacity-60 pointer-events-none")}>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="section-header">Machine Information</div>
            <div className="p-4 space-y-4">
              <SelectField
                label="Type"
                value={formData.type}
                onChange={(v) => handleInputChange('type', v)}
                options={typeOptions.map(t => ({ value: t.value, label: t.value }))}
              />
              <SelectField
                label="Group"
                value={formData.group}
                onChange={(v) => handleInputChange('group', v)}
                options={groupOptions.map(g => ({ value: g.value, label: g.value }))}
              />
              <FormField label="Final Code">
                <span className="font-mono font-semibold text-primary text-base">
                  {generateFinalCode()}
                </span>
              </FormField>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="section-header">Details</div>
            <div className="p-4 space-y-4">
              <InputField
                label="Description"
                value={formData.description}
                onChange={(v) => handleInputChange('description', v)}
              />
              <InputField
                label="Purchasing Date"
                value={formData.purchasingDate}
                onChange={(v) => handleInputChange('purchasingDate', v)}
                placeholder="DD/MM/YYYY"
              />
              <InputField
                label="Purchasing Cost"
                value={formData.purchasingCost}
                onChange={(v) => handleInputChange('purchasingCost', v)}
              />
              <InputField
                label="PO Number"
                value={formData.poNumber}
                onChange={(v) => handleInputChange('poNumber', v)}
              />
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="section-header">Technical Specs</div>
            <div className="p-4 space-y-4">
              <SelectField
                label="Area"
                value={formData.area}
                onChange={(v) => handleInputChange('area', v)}
                options={areaOptions.map(a => ({ value: a.value, label: a.value }))}
              />
              <InputField
                label="Manufacturer"
                value={formData.manufacturer}
                onChange={(v) => handleInputChange('manufacturer', v)}
              />
              <InputField
                label="Model"
                value={formData.model}
                onChange={(v) => handleInputChange('model', v)}
              />
              <InputField
                label="Serial Number"
                value={formData.serialNumber}
                onChange={(v) => handleInputChange('serialNumber', v)}
              />
              <InputField
                label="Manufacturer Year"
                value={formData.manufacturerYear}
                onChange={(v) => handleInputChange('manufacturerYear', v)}
              />
              <InputField
                label="Power"
                value={formData.power}
                onChange={(v) => handleInputChange('power', v)}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className={cn("space-y-6 transition-opacity duration-200", mode === 'delete' && "opacity-60 pointer-events-none")}>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="section-header">Settings</div>
            <div className="p-4 space-y-4">
              <CheckboxField
                label="Permission Required"
                checked={formData.permissionRequired}
                onChange={(v) => handleInputChange('permissionRequired', v)}
              />
              <InputField
                label="Authorization Group"
                value={formData.authorizationGroup}
                onChange={(v) => handleInputChange('authorizationGroup', v)}
              />
              <CheckboxField
                label="Maintenance Needed"
                checked={formData.maintenanceNeeded}
                onChange={(v) => handleInputChange('maintenanceNeeded', v)}
              />
              <CheckboxField
                label="Maintenance On Hold"
                checked={formData.maintenanceOnHold}
                onChange={(v) => handleInputChange('maintenanceOnHold', v)}
              />
              <InputField
                label="Person In Charge"
                value={formData.personInCharge}
                onChange={(v) => handleInputChange('personInCharge', v)}
              />
            </div>
          </div>

          {/* Save / Delete Actions */}
          <div className="flex gap-3 pt-4 border-t border-border pointer-events-auto">
            {mode === 'delete' ? (
              <ActionButton
                variant="red"
                className="flex-1"
                onClick={handleDeleteAction}
                disabled={!selectedMachineId || deleteMachineMutation.isPending}
              >
                {deleteMachineMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4 mr-2" />
                )}
                Delete
              </ActionButton>
            ) : (
              <ActionButton
                variant="green"
                className="flex-1"
                onClick={handleSave}
                disabled={createMachineMutation.isPending || updateMachineMutation.isPending}
              >
                {createMachineMutation.isPending || updateMachineMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </ActionButton>
            )}

            <ActionButton
              variant="red"
              className="flex-1"
              onClick={() => handleSetMode('new')}
              disabled={createMachineMutation.isPending || updateMachineMutation.isPending || deleteMachineMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Cancel
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
