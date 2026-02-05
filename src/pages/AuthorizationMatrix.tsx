import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { InputField } from '@/components/ui/FormField';
import type { AuthorizationMatrix as AuthMatrixType } from '@/types/maintenance';
import { Plus, Trash2, Pencil, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useAuthMatrix } from '@/hooks/useAuthMatrix';
import { useListOptions } from '@/hooks/useListOptions';
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

  const { data: authorizationMatrices = [], isLoading: loadingMatrices } = useGetMatrices();
  const { data: groupOptions = [] } = useGetListOptions('Authorization Groups');
  const createMutation = useCreateMatrix();
  const updateMutation = useUpdateMatrix();
  const deleteMutation = useDeleteMatrix();

  const [mode, setMode] = useState<'new' | 'modify' | 'delete'>('new');
  const [selectedUserId, setSelectedUserId] = useState('');

  const [formData, setFormData] = useState<AuthMatrixType>({
    id: '',
    operatorName: '',
    email: '',
    department: '',
    updatedDate: new Date().toLocaleDateString('en-GB'),
    authorizations: {}
  });

  // Reset form when entering new mode
  useEffect(() => {
    if (mode === 'new') {
      setSelectedUserId('');
      setFormData({
        id: '',
        operatorName: '',
        email: '',
        department: '',
        updatedDate: new Date().toLocaleDateString('en-GB'),
        authorizations: groupOptions.reduce((acc, group) => {
          acc[group.value] = false;
          return acc;
        }, {} as Record<string, boolean>)
      });
    }
  }, [mode, groupOptions]);

  const handleSelectUser = (id: string) => {
    const user = authorizationMatrices.find(u => u.id === id);
    if (user) {
      setSelectedUserId(id);
      setFormData({ ...user });
    }
  };

  const handleToggle = (group: string) => {
    if (mode === 'delete') return;

    setFormData(prev => ({
      ...prev,
      authorizations: {
        ...prev.authorizations,
        [group]: !prev.authorizations?.[group]
      }
    }));
  };

  const handleSave = async () => {
    if (!formData.operatorName) {
      toast.error("Operator Name is required");
      return;
    }

    try {
      if (mode === 'new') {
        const result = await createMutation.mutateAsync(formData);
        toast.success("User added. You can now modify permissions.");
        setMode('modify');
        if (result?.id) {
          setSelectedUserId(result.id);
        }
      } else if (mode === 'modify' && selectedUserId) {
        await updateMutation.mutateAsync({
          id: selectedUserId,
          data: formData
        });
      }
    } catch (error) {
      // Handled by mutation toast
    }
  };

  const handleDelete = async () => {
    if (selectedUserId) {
      if (confirm(`Delete authorizations for ${formData.operatorName}?`)) {
        try {
          await deleteMutation.mutateAsync(selectedUserId);
          setMode('new');
        } catch (error) {
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

  return (
    <div>
      <PageHeader title="06-AUTHORIZATION MATRIX" />

      <div className="space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap gap-4 items-center">
          <ActionButton
            variant="green"
            className={cn("flex items-center gap-2", mode === 'new' && "ring-2 ring-offset-2 ring-primary")}
            onClick={() => setMode('new')}
          >
            <Plus className="h-4 w-4" />
            NEW USER
          </ActionButton>

          <ActionButton
            variant="blue"
            className={cn("flex items-center gap-2", mode === 'modify' && "ring-2 ring-offset-2 ring-primary")}
            onClick={() => setMode('modify')}
          >
            <Pencil className="h-4 w-4" />
            MODIFY USER
          </ActionButton>

          <ActionButton
            variant="red"
            className={cn("flex items-center gap-2", mode === 'delete' && "ring-2 ring-offset-2 ring-destructive")}
            onClick={() => setMode('delete')}
          >
            <Trash2 className="h-4 w-4" />
            DELETE USER
          </ActionButton>
        </div>

        {/* User Selection Dropdown (Modify/Delete) */}
        {mode !== 'new' && (
          <div className="border border-input rounded p-4 bg-muted/20 animate-in fade-in slide-in-from-top-1">
            <label className="block text-sm font-medium mb-2">Select Operator:</label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => handleSelectUser(e.target.value)}
                className="w-full max-w-md p-2 rounded border border-input pr-10"
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

        {/* Operator Info form - Hidden if modify/delete selected but no user picked */}
        <div className={cn("transition-opacity",
          (mode !== 'new' && !selectedUserId) ? "opacity-50 pointer-events-none" : "opacity-100"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <InputField
              label="OPERATOR"
              value={formData.operatorName}
              onChange={(v) => setFormData(prev => ({ ...prev, operatorName: v }))}
              readOnly={mode !== 'new'}
              disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
            />
            <InputField
              label="EMAIL"
              value={formData.email || ''}
              onChange={(v) => setFormData(prev => ({ ...prev, email: v }))}
              type="email"
              disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
            />
            <InputField
              label="DEPARTMENT"
              value={formData.department || ''}
              onChange={(v) => setFormData(prev => ({ ...prev, department: v }))}
              disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
            />
            <InputField
              label="UPDATED DATE"
              value={formData.updatedDate}
              onChange={(v) => setFormData(prev => ({ ...prev, updatedDate: v }))}
              disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
            />
          </div>

          {/* Authorization Grid */}
          <div className="border border-primary rounded overflow-hidden shadow-sm">
            <div className="section-header">
              Mark with "Y" the tooling area you want to approve for the user
            </div>

            <div className="p-4 bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {groupOptions.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between border border-border rounded px-3 py-2 bg-muted/30 hover:bg-muted transition-colors"
                  >
                    <span className="text-xs font-medium truncate mr-2" title={group.value}>{group.value}</span>
                    <button
                      onClick={() => handleToggle(group.value)}
                      disabled={mode === 'delete' || createMutation.isPending || updateMutation.isPending}
                      className={cn(
                        "px-2 py-1 text-xs font-bold rounded transition-colors w-8",
                        formData.authorizations?.[group.value]
                          ? 'bg-success text-success-foreground hover:bg-success/90'
                          : 'bg-destructive/50 text-destructive-foreground hover:bg-destructive/60'
                      )}
                    >
                      {formData.authorizations?.[group.value] ? 'Y' : 'N'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4 mt-6">
            {mode === 'delete' ? (
              <ActionButton
                variant="red"
                onClick={handleDelete}
                disabled={!selectedUserId || deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                CONFIRM DELETE
              </ActionButton>
            ) : (
              <ActionButton
                variant="green"
                onClick={handleSave}
                disabled={(mode === 'modify' && !selectedUserId) || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                SAVE CHANGES
              </ActionButton>
            )}

            <ActionButton
              variant="red"
              onClick={() => {
                setMode('new');
                setSelectedUserId('');
              }}
              disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" /> RESET / CANCEL
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
