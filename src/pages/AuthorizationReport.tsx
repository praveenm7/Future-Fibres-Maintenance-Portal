import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReportToolbar } from '@/components/ui/ReportToolbar';
import { useAuthMatrix } from '@/hooks/useAuthMatrix';
import { useListOptions } from '@/hooks/useListOptions';
import { exportToExcel, getExportTimestamp } from '@/lib/exportExcel';
import { printReport } from '@/lib/printReport';
import { Loader2 } from 'lucide-react';

export default function AuthorizationReport() {
  const { useGetMatrices } = useAuthMatrix();
  const { useGetListOptions } = useListOptions();

  const { data: authMatrices = [], isLoading: loadingMatrices } = useGetMatrices();
  const { data: authGroups = [], isLoading: loadingGroups } = useGetListOptions('AUTHORIZATION_GROUP');

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

  const handlePrint = () => {
    const tableHtml = `<table>
      <thead><tr>
        <th>Operator</th><th>Email</th><th>Department</th>
        ${authorizationGroups.map(g => `<th>${g}</th>`).join('')}
      </tr></thead>
      <tbody>
      ${authMatrices.map(user => `<tr>
        <td>${user.operatorName}</td><td>${user.email || '-'}</td><td>${user.department || '-'}</td>
        ${authorizationGroups.map(g => `<td style="text-align:center;font-weight:bold">${user.authorizations?.[g] ? 'Y' : 'N'}</td>`).join('')}
      </tr>`).join('')}
      </tbody></table>`;
    printReport({ title: 'Authorization Matrix', htmlContent: tableHtml });
  };

  const handleExportExcel = () => {
    exportToExcel({
      filename: `Authorization_Matrix_${getExportTimestamp()}`,
      sheets: [{
        name: 'Authorization Matrix',
        headers: ['Operator', 'Email', 'Department', ...authorizationGroups],
        rows: authMatrices.map(user => [
          user.operatorName, user.email || '', user.department || '',
          ...authorizationGroups.map(g => user.authorizations?.[g] ? 'Y' : 'N')
        ]),
      }],
    });
  };

  return (
    <div>
      <PageHeader title="Authorization Matrix" />

      <div className="flex justify-end mb-4">
        <ReportToolbar onPrint={handlePrint} onExportExcel={handleExportExcel} />
      </div>

      <div className="relative isolate overflow-x-auto border border-border rounded-lg">
        <table className="data-table text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 !bg-muted z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">OPERATOR</th>
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
                <td colSpan={authorizationGroups.length + 3} className="text-center p-4 text-muted-foreground">
                  No authorization data found.
                </td>
              </tr>
            ) : (
              authMatrices.map((user, index) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUser(user.operatorName)}
                  className={`cursor-pointer ${selectedUser === user.operatorName ? 'bg-accent' : ''}`}
                >
                  <td className={`sticky left-0 z-20 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${selectedUser === user.operatorName ? '!bg-accent' : index % 2 === 1 ? '!bg-muted' : '!bg-card'}`}>{user.operatorName}</td>
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
        <div className="mt-6 border border-border rounded-lg overflow-hidden max-w-2xl">
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
