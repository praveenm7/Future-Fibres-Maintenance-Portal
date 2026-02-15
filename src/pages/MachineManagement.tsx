import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { FormField, SelectField, InputField, CheckboxField } from '@/components/ui/FormField';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Machine } from '@/types/maintenance';
import { Eye, Upload, Printer, FileText, BookOpen, Save, Trash, Plus, RotateCcw, Loader2, X, ScanLine, ImageIcon } from 'lucide-react';
import { useMachines } from '@/hooks/useMachines';
import { useListOptions } from '@/hooks/useListOptions';
import { useMachineDocuments } from '@/hooks/useMachineDocuments';
import { FileUploadDialog } from '@/components/machines/FileUploadDialog';
import { PrintLabelDialog } from '@/components/machines/PrintLabelDialog';
import { DocumentsList } from '@/components/machines/DocumentsList';
import { QRScanner } from '@/components/machines/QRScanner';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { machineFormSchema, type MachineFormValues } from '@/lib/schemas/machineSchema';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SERVER_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api').replace('/api', '');

type Mode = 'new' | 'modify' | 'delete';

const defaultValues: MachineFormValues = {
  type: '',
  group: '',
  description: '',
  purchasingDate: '',
  purchasingCost: '',
  poNumber: '',
  area: '',
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
  const [imageUrl, setImageUrl] = useState<string>('');
  const [finalCode, setFinalCode] = useState<string>('');

  // Dialog state
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docCategory, setDocCategory] = useState<'DOCUMENT' | 'MANUAL'>('DOCUMENT');
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Pending files for New mode
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingDocs, setPendingDocs] = useState<{ file: File; category: 'DOCUMENT' | 'MANUAL' }[]>([]);

  // Document hooks
  const uploadPhotoMutation = useUploadPhoto();
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();
  const { data: documents = [] } = useGetDocuments(selectedMachineId);

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<MachineFormValues>({
    resolver: zodResolver(machineFormSchema),
    defaultValues,
  });

  const formValues = watch();

  // Unsaved changes warning
  useUnsavedChanges(isDirty);


  // When mode changes to modify or delete, auto-select first machine
  useEffect(() => {
    if ((mode === 'modify' || mode === 'delete') && machines.length > 0 && !selectedMachineId) {
      handleSelectMachine(machines[0].id);
    }
  }, [mode, machines]);

  const handleSelectMachine = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (machine) {
      setSelectedMachineId(machineId);
      setImageUrl(machine.imageUrl || '');
      setFinalCode(machine.finalCode);
      reset({
        type: machine.type || '',
        group: machine.group || '',
        description: machine.description || '',
        purchasingDate: String(machine.purchasingDate ?? ''),
        purchasingCost: String(machine.purchasingCost ?? ''),
        poNumber: String(machine.poNumber ?? ''),
        area: machine.area || '',
        manufacturer: String(machine.manufacturer ?? ''),
        model: String(machine.model ?? ''),
        serialNumber: String(machine.serialNumber ?? ''),
        manufacturerYear: String(machine.manufacturerYear ?? ''),
        power: String(machine.power ?? ''),
        permissionRequired: machine.permissionRequired ?? false,
        authorizationGroup: String(machine.authorizationGroup ?? ''),
        maintenanceNeeded: machine.maintenanceNeeded ?? false,
        maintenanceOnHold: machine.maintenanceOnHold ?? false,
        personInCharge: String(machine.personInCharge ?? ''),
      });
    }
  };

  const handleQRScan = (data: string) => {
    // Try to match by machine ID, finalCode, or URL containing machine ID
    let matchedMachine: Machine | undefined;

    // Check if it's a URL with a machine ID parameter
    try {
      const url = new URL(data);
      const machineId = url.searchParams.get('machineId') || url.searchParams.get('id');
      if (machineId) {
        matchedMachine = machines.find(m => m.id === machineId);
      }
    } catch {
      // Not a URL, try direct matching
    }

    // Try matching by finalCode or ID directly
    if (!matchedMachine) {
      matchedMachine = machines.find(
        m => m.finalCode === data || m.id === data || m.finalCode === data.trim()
      );
    }

    if (matchedMachine) {
      setMode('modify');
      handleSelectMachine(matchedMachine.id);
      toast.success(`Found: ${matchedMachine.finalCode} — ${matchedMachine.description}`);
    } else {
      toast.error(`No machine found for QR code: "${data}"`);
    }
  };

  const handleSetMode = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'new') {
      setSelectedMachineId('');
      setImageUrl('');
      setFinalCode('');
      reset(defaultValues);
      setPendingPhoto(null);
      setPendingDocs([]);
    }
  };

  // Show preview of the code pattern in new mode; actual code in modify/delete
  const getFinalCodePreview = (): string => {
    if (mode !== 'new') return finalCode;
    const typePrefix = formValues.type === 'MACHINE' ? 'M' : formValues.type === 'TOOLING' ? 'T' : '';
    const group = formValues.group;
    if (!typePrefix || !group) return '--';
    return `${typePrefix}-${group}-XXXX`;
  };

  const onSubmit = async (data: MachineFormValues) => {
    try {
      if (mode === 'new') {
        const newMachine = {
          imageUrl: '',
          ...data,
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
        reset(defaultValues);
        setImageUrl('');
      } else if (mode === 'modify') {
        const selectedMachine = machines.find(m => m.id === selectedMachineId);
        await updateMachineMutation.mutateAsync({
          id: selectedMachineId,
          data: {
            id: selectedMachineId,
            imageUrl,
            ...data,
            personInChargeID: selectedMachine?.personInChargeID ?? null,
          } as Machine,
        });
        // Reset form with current values to clear dirty state
        reset(data);
      }
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleDeleteAction = async () => {
    if (selectedMachineId) {
      if (confirm(`Are you sure you want to delete ${formValues.description}?`)) {
        try {
          await deleteMachineMutation.mutateAsync(selectedMachineId);
          setSelectedMachineId('');
          reset(defaultValues);
          setImageUrl('');

          if (machines.length <= 1) {
            handleSetMode('new');
          }
        } catch {
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

  const displayCode = getFinalCodePreview();

  return (
    <div>
      <PageHeader title="Machine Management" />

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => handleSetMode(v as Mode)} className="mb-6">
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

      <form onSubmit={handleSubmit(
        mode === 'delete' ? () => handleDeleteAction() : onSubmit,
        (errors) => {
          const firstError = Object.values(errors)[0];
          toast.error(firstError?.message || 'Please check the form for errors');
        }
      )}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Selection & Actions */}
          <div className="space-y-6">
            {/* Machine Selection Dropdown */}
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

            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                variant="blue"
                type="button"
                onClick={() => navigate('/reports/machinery-list')}
                className="justify-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Report
              </ActionButton>
              <ActionButton
                variant="blue"
                type="button"
                onClick={() => setQrScannerOpen(true)}
                className="justify-center"
              >
                <ScanLine className="h-4 w-4 mr-2" />
                Scan QR
              </ActionButton>
            </div>

            {/* Machine Image */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="section-header">Machine Image</div>
              <div className="p-4">
                {imageUrl ? (
                  <div className="relative aspect-video bg-muted/30 rounded-md flex items-center justify-center border border-border overflow-hidden">
                    <img
                      src={imageUrl.startsWith('http') || imageUrl.startsWith('blob:') ? imageUrl : `${SERVER_BASE}${imageUrl}`}
                      alt="Machine"
                      className="max-h-full max-w-full object-contain"
                    />
                    {mode !== 'delete' && (
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-white rounded-full p-1"
                        onClick={() => {
                          if (pendingPhoto) {
                            URL.revokeObjectURL(imageUrl);
                            setPendingPhoto(null);
                          }
                          setImageUrl('');
                        }}
                        title="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted/30 rounded-md flex flex-col items-center justify-center border border-dashed border-border">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/20 mb-2" />
                    <span className="text-muted-foreground text-sm">No image available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Utility Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                variant="blue"
                type="button"
                className="justify-center gap-2"
                onClick={() => setPhotoDialogOpen(true)}
                disabled={mode === 'delete'}
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </ActionButton>
              <ActionButton
                variant="blue"
                type="button"
                className="justify-center gap-2"
                onClick={() => setPrintDialogOpen(true)}
                disabled={mode === 'delete'}
              >
                <Printer className="h-4 w-4" />
                Print Label
              </ActionButton>
              <ActionButton
                variant="blue"
                type="button"
                className="justify-center gap-2"
                onClick={() => { setDocCategory('DOCUMENT'); setDocDialogOpen(true); }}
                disabled={mode === 'delete'}
              >
                <FileText className="h-4 w-4" />
                Upload Doc
              </ActionButton>
              <ActionButton
                variant="blue"
                type="button"
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
                        type="button"
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
                  setPendingPhoto(file);
                  const blobUrl = URL.createObjectURL(file);
                  setImageUrl(blobUrl);
                  setPhotoDialogOpen(false);
                  toast.success('Photo will be uploaded when machine is saved');
                } else {
                  uploadPhotoMutation.mutate(
                    { machineId: selectedMachineId, file },
                    {
                      onSuccess: (data) => {
                        setImageUrl(data.imageUrl);
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
              machine={{ id: selectedMachineId, finalCode: displayCode, ...formValues, imageUrl } as Machine}
            />

            <QRScanner
              open={qrScannerOpen}
              onOpenChange={setQrScannerOpen}
              onScan={handleQRScan}
            />
          </div>

          {/* Middle Column - Main Form */}
          <div className={cn("space-y-6 transition-opacity duration-200", mode === 'delete' && "opacity-60 pointer-events-none")}>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="section-header">Machine Information</div>
              <div className="p-4 space-y-4">
                <SelectField
                  label="Type"
                  value={formValues.type}
                  onChange={(v) => setValue('type', v, { shouldDirty: true })}
                  options={typeOptions.map(t => ({ value: t.value, label: t.value }))}
                  required error={errors.type?.message}
                  disabled={mode === 'modify'}
                />
                <SelectField
                  label="Group"
                  value={formValues.group}
                  onChange={(v) => setValue('group', v, { shouldDirty: true })}
                  options={groupOptions.map(g => ({ value: g.value, label: g.value }))}
                  required error={errors.group?.message}
                  disabled={mode === 'modify'}
                />
                <FormField label="Final Code">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-primary text-base">
                      {displayCode}
                    </span>
                    {mode === 'new' && formValues.type && formValues.group && (
                      <span className="text-xs text-muted-foreground">(assigned on save)</span>
                    )}
                  </div>
                </FormField>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="section-header">Details</div>
              <div className="p-4 space-y-4">
                <InputField
                  label="Description"
                  value={formValues.description}
                  onChange={(v) => setValue('description', v, { shouldValidate: true, shouldDirty: true })}
                  required error={errors.description?.message}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Purchasing Date"
                    value={formValues.purchasingDate}
                    onChange={(v) => setValue('purchasingDate', v, { shouldDirty: true })}
                    placeholder="DD/MM/YYYY"
                  />
                  <InputField
                    label="Purchasing Cost"
                    value={formValues.purchasingCost}
                    onChange={(v) => setValue('purchasingCost', v, { shouldDirty: true })}
                  />
                </div>
                <InputField
                  label="PO Number"
                  value={formValues.poNumber}
                  onChange={(v) => setValue('poNumber', v, { shouldDirty: true })}
                />
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="section-header">Technical Specs</div>
              <div className="p-4 space-y-4">
                <SelectField
                  label="Area"
                  value={formValues.area}
                  onChange={(v) => setValue('area', v, { shouldDirty: true })}
                  options={areaOptions.map(a => ({ value: a.value, label: a.value }))}
                  required error={errors.area?.message}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Manufacturer"
                    value={formValues.manufacturer}
                    onChange={(v) => setValue('manufacturer', v, { shouldDirty: true })}
                  />
                  <InputField
                    label="Model"
                    value={formValues.model}
                    onChange={(v) => setValue('model', v, { shouldDirty: true })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Serial Number"
                    value={formValues.serialNumber}
                    onChange={(v) => setValue('serialNumber', v, { shouldDirty: true })}
                  />
                  <InputField
                    label="Manufacturer Year"
                    value={formValues.manufacturerYear}
                    onChange={(v) => setValue('manufacturerYear', v, { shouldDirty: true })}
                  />
                </div>
                <InputField
                  label="Power"
                  value={formValues.power}
                  onChange={(v) => setValue('power', v, { shouldDirty: true })}
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
                  checked={formValues.permissionRequired}
                  onChange={(v) => setValue('permissionRequired', v, { shouldDirty: true })}
                />
                <InputField
                  label="Authorization Group"
                  value={formValues.authorizationGroup}
                  onChange={(v) => setValue('authorizationGroup', v, { shouldDirty: true })}
                />
                <CheckboxField
                  label="Maintenance Needed"
                  checked={formValues.maintenanceNeeded}
                  onChange={(v) => setValue('maintenanceNeeded', v, { shouldDirty: true })}
                />
                <CheckboxField
                  label="Maintenance On Hold"
                  checked={formValues.maintenanceOnHold}
                  onChange={(v) => setValue('maintenanceOnHold', v, { shouldDirty: true })}
                />
                <InputField
                  label="Person In Charge"
                  value={formValues.personInCharge}
                  onChange={(v) => setValue('personInCharge', v, { shouldDirty: true })}
                />
              </div>
            </div>

            {/* Save / Delete Actions */}
            <div className="flex gap-3 pt-4 border-t border-border pointer-events-auto">
              {mode === 'delete' ? (
                <ActionButton
                  variant="red"
                  className="flex-1"
                  type="button"
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
                  type="submit"
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
                type="button"
                onClick={() => handleSetMode('new')}
                disabled={createMachineMutation.isPending || updateMachineMutation.isPending || deleteMachineMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Cancel
              </ActionButton>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// Helper to wrap the component if error occurs
export function MachineManagementWithErrorBoundary() {
  return <MachineManagement />;
}
