import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuthMatrix } from '@/hooks/useAuthMatrix';
import { useListOptions } from '@/hooks/useListOptions';
import { Loader2 } from 'lucide-react';

export default function AuthorizationReport() {
  const { useGetMatrices } = useAuthMatrix();
  const { useGetListOptions } = useListOptions();

  const { data: authMatrices = [], isLoading: loadingMatrices } = useGetMatrices();
  const { data: authGroups = [], isLoading: loadingGroups } = useGetListOptions('Authorization Groups');

  // Map database list options to simple strings
  const authorizationGroups = authGroups.map(g => g.value);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const selectedUserData = authMatrices.find(u => u.operatorName === selectedUser);

  if (loadingMatrices || loadingGroups) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading authorization report...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="05-AUTHORIZATION MATRIX" />

      <div className="overflow-x-auto">
        <table className="data-table text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-table-header z-10">OPERATOR</th>
              <th>EMAIL</th>
              <th>DEPARTMENT</th>
              {authorizationGroups.map((group) => (
                <th key={group} className="whitespace-nowrap">
                  {group} Y/N
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {authMatrices.length === 0 ? (
              <tr>
                <td colSpan={authorizationGroups.length + 1} className="text-center p-4 text-muted-foreground">
                  No authorization data found.
                </td>
              </tr>
            ) : (
              authMatrices.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUser(user.operatorName)}
                  className={`cursor-pointer ${selectedUser === user.operatorName ? 'bg-accent/30' : ''}`}
                >
                  <td className="sticky left-0 bg-card z-10 font-medium">{user.operatorName}</td>
                  <td>{user.email || '-'}</td>
                  <td>{user.department || '-'}</td>
                  {authorizationGroups.map((group) => (
                    <td
                      key={group}
                      className={`text-center font-bold ${user.authorizations?.[group] ? 'text-success' : 'text-destructive'
                        }`}
                    >
                      {user.authorizations?.[group] ? 'Y' : 'N'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUserData && (
        <div className="mt-6 border border-primary rounded overflow-hidden max-w-2xl">
          <div className="section-header">
            Authorizations for {selectedUserData.operatorName}
          </div>
          <div className="p-4 bg-card space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b border-border pb-4">
              <div>
                <span className="text-muted-foreground block text-xs uppercase">Email</span>
                <span className="font-medium">{selectedUserData.email || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase">Department</span>
                <span className="font-medium">{selectedUserData.department || '-'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {authorizationGroups.map((group) => (
                <div
                  key={group}
                  className={`
                  px-3 py-2 rounded text-xs font-medium text-center
                  ${selectedUserData.authorizations?.[group]
                      ? 'bg-success/20 text-success border border-success/30'
                      : 'bg-destructive/20 text-destructive border border-destructive/30'}
                `}
                >
                  {group}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
