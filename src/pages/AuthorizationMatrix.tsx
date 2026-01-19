import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { InputField, CheckboxField } from '@/components/ui/FormField';
import { authorizationGroups } from '@/data/mockData';
import { Plus, Trash2, Pencil } from 'lucide-react';

export default function AuthorizationMatrix() {
  const [operatorName, setOperatorName] = useState('FERNANDO');
  const [updatedDate, setUpdatedDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [authorizations, setAuthorizations] = useState<Record<string, boolean>>(
    authorizationGroups.reduce((acc, group) => {
      acc[group] = Math.random() > 0.5; // Random for demo
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleToggle = (group: string) => {
    setAuthorizations(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  return (
    <div>
      <PageHeader title="06-AUTHORIZATION MATRIX" />

      <div className="space-y-6">
        {/* User Selection */}
        <div className="flex flex-wrap gap-4 items-center">
          <ActionButton variant="red" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            NEW USER
          </ActionButton>
          <ActionButton variant="red" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            DELETE USER
          </ActionButton>
          <ActionButton variant="green" className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            MODIFY USER
          </ActionButton>
        </div>

        {/* Operator Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <InputField
            label="OPERATOR"
            value={operatorName}
            onChange={setOperatorName}
          />
          <InputField
            label="UPDATED DATE"
            value={updatedDate}
            onChange={setUpdatedDate}
          />
        </div>

        {/* Authorization Grid */}
        <div className="border border-primary rounded overflow-hidden">
          <div className="section-header">
            Mark with "Y" the tooling area you want to approve for the user
          </div>
          
          <div className="p-4 bg-card">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {authorizationGroups.map((group) => (
                <div 
                  key={group}
                  className="flex items-center justify-between border border-border rounded px-3 py-2 bg-muted"
                >
                  <span className="text-xs font-medium truncate mr-2">{group}</span>
                  <button
                    onClick={() => handleToggle(group)}
                    className={`
                      px-2 py-1 text-xs font-bold rounded transition-colors
                      ${authorizations[group] 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-destructive text-destructive-foreground'}
                    `}
                  >
                    {authorizations[group] ? 'Y' : 'N'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <ActionButton variant="green">SAVE CHANGES</ActionButton>
          <ActionButton variant="red">CANCEL</ActionButton>
        </div>
      </div>
    </div>
  );
}
