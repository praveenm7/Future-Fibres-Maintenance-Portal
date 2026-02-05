import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { InputField } from '@/components/ui/FormField';
import { authorizationGroups } from '@/data/mockData';
import type { AuthorizationMatrix as AuthMatrixType } from '@/types/maintenance';
import { Plus, Trash2, Pencil, Save, RotateCcw } from 'lucide-react';
import { useMaintenance } from '@/context/MaintenanceContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AuthorizationMatrix() {
  const { authorizationMatrices, addAuthorizationMatrix, updateAuthorizationMatrix, deleteAuthorizationMatrix } = useMaintenance();

  const [mode, setMode] = useState<'new' | 'modify' | 'delete'>('new');
  const [selectedUserId, setSelectedUserId] = useState('');

  const [formData, setFormData] = useState<AuthMatrixType>({
    id: '',
    operatorName: '',
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
        updatedDate: new Date().toLocaleDateString('en-GB'),
        authorizations: authorizationGroups.reduce((acc, group) => {
          acc[group] = false;
          return acc;
        }, {} as Record<string, boolean>)
      });
    }
  }, [mode]);

  const handleSelectUser = (id: string) => {
    const user = authorizationMatrices.find(u => u.id === id);
    if (user) {
      setSelectedUserId(id);
      setFormData({ ...user });
    }
  };

  const handleToggle = (group: string) => {
    if (mode === 'delete') return; // Read only in delete mode

    setFormData(prev => ({
      ...prev,
      authorizations: {
        ...prev.authorizations,
        [group]: !prev.authorizations[group]
      }
    }));
  };

  const handleSave = () => {
    if (!formData.operatorName) {
      toast.error("Operator Name is required");
      return;
    }

    if (mode === 'new') {
      const newUser: AuthMatrixType = {
        ...formData,
        id: crypto.randomUUID(),
      };
      addAuthorizationMatrix(newUser);
      // Optional: switch to modify mode for this user or reset
      toast.success("User added. You can now modify permissions.");
      setMode('modify');
      // We need to wait for state update to select it, but we can stick with local data for now
      // Actually context update is sync enough usually, but let's just reset
      // Or better:
      setTimeout(() => handleSelectUser(newUser.id), 100);
    } else if (mode === 'modify' && selectedUserId) {
      updateAuthorizationMatrix(formData);
    }
  };

  const handleDelete = () => {
    if (selectedUserId) {
      if (confirm(`Delete authorizations for ${formData.operatorName}?`)) {
        deleteAuthorizationMatrix(selectedUserId);
        setMode('new');
      }
    }
  };

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
            <select
              value={selectedUserId}
              onChange={(e) => handleSelectUser(e.target.value)}
              className="w-full max-w-md p-2 rounded border border-input"
            >
              <option value="" disabled>Select an operator...</option>
              {authorizationMatrices.length === 0 && <option disabled>No operators found.</option>}
              {authorizationMatrices.map(user => (
                <option key={user.id} value={user.id}>{user.operatorName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Operator Info form - Hidden if modify/delete selected but no user picked */}
        <div className={cn("transition-opacity",
          (mode !== 'new' && !selectedUserId) ? "opacity-50 pointer-events-none" : "opacity-100"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mb-6">
            <InputField
              label="OPERATOR"
              value={formData.operatorName}
              onChange={(v) => setFormData(prev => ({ ...prev, operatorName: v }))}
              readOnly={mode !== 'new'} // Only editable on creation? Or allow rename? Allow rename on modify.
              disabled={mode === 'delete'}
            />
            <InputField
              label="UPDATED DATE"
              value={formData.updatedDate}
              onChange={(v) => setFormData(prev => ({ ...prev, updatedDate: v }))}
              disabled={mode === 'delete'}
            />
          </div>

          {/* Authorization Grid */}
          <div className="border border-primary rounded overflow-hidden shadow-sm">
            <div className="section-header">
              Mark with "Y" the tooling area you want to approve for the user
            </div>

            <div className="p-4 bg-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {authorizationGroups.map((group) => (
                  <div
                    key={group}
                    className="flex items-center justify-between border border-border rounded px-3 py-2 bg-muted/30 hover:bg-muted transition-colors"
                  >
                    <span className="text-xs font-medium truncate mr-2" title={group}>{group}</span>
                    <button
                      onClick={() => handleToggle(group)}
                      disabled={mode === 'delete'}
                      className={cn(
                        "px-2 py-1 text-xs font-bold rounded transition-colors w-8",
                        formData.authorizations?.[group]
                          ? 'bg-success text-success-foreground hover:bg-success/90'
                          : 'bg-destructive/50 text-destructive-foreground hover:bg-destructive/60'
                      )}
                    >
                      {formData.authorizations?.[group] ? 'Y' : 'N'}
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
                disabled={!selectedUserId}
              >
                <Trash2 className="h-4 w-4 mr-2" /> CONFIRM DELETE
              </ActionButton>
            ) : (
              <ActionButton
                variant="green"
                onClick={handleSave}
                disabled={mode === 'modify' && !selectedUserId}
              >
                <Save className="h-4 w-4 mr-2" /> SAVE CHANGES
              </ActionButton>
            )}

            <ActionButton
              variant="red"
              onClick={() => {
                setMode('new');
                setSelectedUserId('');
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" /> RESET / CANCEL
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
