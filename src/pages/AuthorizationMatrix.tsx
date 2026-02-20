import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { InputField, SelectField } from '@/components/ui/FormField';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import type { AuthorizationMatrix as AuthMatrixType } from '@/types/maintenance';
import { Plus, Trash2, Pencil, Save, RotateCcw, Loader2 } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthMatrix } from '@/hooks/useAuthMatrix';
import { useListOptions } from '@/hooks/useListOptions';
import { useShifts } from '@/hooks/useShifts';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { authMatrixFormSchema, type AuthMatrixFormValues } from '@/lib/schemas/authMatrixSchema';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AuthorizationMatrix() {
  const {
    useGetMatrices,
    useCreateMatrix,
    useUpdateMatrix,
    useDeleteMatrix
  } = useAuthMatrix();
  const { useGetListOptions } = useListOptions();

  const { data: authorizationMatrices = [], isLoading: loadingMatrices, isError: errorMatrices, refetch: refetchMatrices } = useGetMatrices();
  const { data: groupOptions = [] } = useGetListOptions('AUTHORIZATION_GROUP');
  const { data: shifts = [] } = useShifts();
  const createMutation = useCreateMatrix();
  const updateMutation = useUpdateMatrix();
  const deleteMutation = useDeleteMatrix();

  const [mode, setMode] = useState<'new' | 'modify' | 'delete'>('new');
  const [selectedUserId, setSelectedUserId] = useState('');

  const getDefaultValues = (): AuthMatrixFormValues => ({
    operatorName: '',
    email: '',
    department: '',
    defaultShiftId: '',
    updatedDate: new Date().toLocaleDateString('en-GB'),
    authorizations: groupOptions.reduce((acc, group) => {
      acc[group.value] = false;
      return acc;
    }, {} as Record<string, boolean>),
  });

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AuthMatrixFormValues>({
    resolver: zodResolver(authMatrixFormSchema),
    defaultValues: getDefaultValues(),
  });

  const formValues = watch();

  // Unsaved changes warning
  useUnsavedChanges(isDirty);

  useEffect(() => {
    if (mode === 'new') {
      setSelectedUserId('');
      reset(getDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, groupOptions]);

  const handleSelectUser = (id: string) => {
    const user = authorizationMatrices.find(u => u.id === id);
    if (user) {
      setSelectedUserId(id);
      reset({
        operatorName: user.operatorName,
        email: user.email || '',
        department: user.department || '',
        defaultShiftId: user.defaultShiftId || '',
        updatedDate: user.updatedDate,
        authorizations: user.authorizations || {},
      });
    }
  };

  const handleToggle = (group: string) => {
    if (mode === 'delete') return;
    const current = formValues.authorizations?.[group] || false;
    setValue(`authorizations.${group}`, !current, { shouldDirty: true });
  };

  const onSubmit = async (data: AuthMatrixFormValues) => {
    try {
      if (mode === 'new') {
        const result = await createMutation.mutateAsync({
          id: '',
          operatorName: data.operatorName,
          email: data.email,
          department: data.department,
          defaultShiftId: data.defaultShiftId || null,
          updatedDate: data.updatedDate,
          authorizations: data.authorizations,
        } as AuthMatrixType);
        toast.success("User added. You can now modify permissions.");
        setMode('modify');
        if (result?.id) {
          setSelectedUserId(result.id);
        }
      } else if (mode === 'modify' && selectedUserId) {
        await updateMutation.mutateAsync({
          id: selectedUserId,
          data: {
            id: selectedUserId,
            operatorName: data.operatorName,
            email: data.email,
            department: data.department,
            defaultShiftId: data.defaultShiftId || null,
            updatedDate: data.updatedDate,
            authorizations: data.authorizations,
          } as AuthMatrixType,
        });
      }
    } catch {
      // Handled by mutation toast
    }
  };

  const handleDelete = async () => {
    if (selectedUserId) {
      if (confirm(`Delete authorizations for ${formValues.operatorName}?`)) {
        try {
          await deleteMutation.mutateAsync(selectedUserId);
          setMode('new');
        } catch {
          // Handled by mutation toast
        }
      }
    }
  };

  if (loadingMatrices) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading authorization data...</p>
      </div>
    );
  }

  if (errorMatrices) return <QueryError onRetry={refetchMatrices} />;

  if (authorizationMatrices.length === 0 && mode !== 'new') {
    return (
      <div>
        <PageHeader title="Authorization Matrix" />
        <EmptyState
          title="No authorization entries"
          description="No operators have been added to the authorization matrix yet."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Authorization Matrix" />

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'new' | 'modify' | 'delete')} className="mb-6">
        <TabsList>
          <TabsTrigger value="new" className="gap-1.5">
            <Plus className="h-4 w-4" /> New User
          </TabsTrigger>
          <TabsTrigger value="modify" className="gap-1.5">
            <Pencil className="h-4 w-4" /> Modify
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-1.5">
            <Trash2 className="h-4 w-4" /> Delete
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form onSubmit={handleSubmit(mode === 'delete' ? () => handleDelete() : onSubmit)} className="space-y-6">
        {/* User Selection Dropdown (Modify/Delete) */}
        {mode !== 'new' && (
          <div className="border border-border rounded-lg p-4 bg-muted/10">
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Select Operator</label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => handleSelectUser(e.target.value)}
                className="w-full max-w-md h-9 rounded-md border border-input bg-background text-sm px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={loadingMatrices}
              >
                <option value="" disabled>Select an operator...</option>
                {authorizationMatrices.length === 0 && !loadingMatrices && <option disabled>No operators found.</option>}
                {authorizationMatrices.map(user => (
                  <option key={user.id} value={user.id}>{user.operatorName}</option>
                ))}
              </select>
              {loadingMatrices && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Operator Info form */}
        <div className={cn("transition-opacity",
          (mode !== 'new' && !selectedUserId) ? "opacity-50 pointer-events-none" : "opacity-100"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <InputField label="Operator" value={formValues.operatorName}
              onChange={(v) => setValue('operatorName', v, { shouldValidate: true, shouldDirty: true })}
              readOnly={mode !== 'new'}
              disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
              required error={errors.operatorName?.message} />
            <InputField label="Email" value={formValues.email || ''}
              onChange={(v) => setValue('email', v, { shouldValidate: true, shouldDirty: true })}
              type="email" disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
              error={errors.email?.message} />
            <InputField label="Department" value={formValues.department || ''}
              onChange={(v) => setValue('department', v, { shouldDirty: true })}
              disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending} />
            <SelectField label="Default Shift" value={formValues.defaultShiftId || 'none'}
              onChange={(v) => setValue('defaultShiftId', v === 'none' ? '' : v, { shouldDirty: true })}
              options={[
                { value: 'none', label: 'No Shift' },
                ...shifts.map((s: { shiftId: string; shiftName: string; startTime: string; endTime: string }) => ({
                  value: s.shiftId,
                  label: `${s.shiftName} (${s.startTime}–${s.endTime})`,
                })),
              ]}
              disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending} />
            <InputField label="Updated Date" value={formValues.updatedDate}
              onChange={(v) => setValue('updatedDate', v, { shouldDirty: true })}
              disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending} />
          </div>

          {/* Authorization Grid */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="section-header">
              Authorize tooling areas for this user
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {groupOptions.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between border border-border rounded-md px-3 py-2.5 bg-background hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-sm font-medium truncate mr-3" title={group.value}>{group.value}</span>
                    <Switch
                      checked={!!formValues.authorizations?.[group.value]}
                      onCheckedChange={() => handleToggle(group.value)}
                      disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            {mode === 'delete' ? (
              <ActionButton variant="red" type="button" onClick={handleDelete}
                disabled={!selectedUserId || deleteMutation.isPending}>
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Confirm Delete
              </ActionButton>
            ) : (
              <ActionButton variant="green" type="submit"
                disabled={(mode === 'modify' && !selectedUserId) || createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </ActionButton>
            )}

            <ActionButton variant="red" type="button" onClick={() => { setMode('new'); setSelectedUserId(''); }}
              disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );
}
