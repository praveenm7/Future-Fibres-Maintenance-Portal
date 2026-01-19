import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { authorizationGroups } from '@/data/mockData';

interface UserAuthorization {
  name: string;
  authorizations: Record<string, boolean>;
}

const mockUsers: UserAuthorization[] = [
  {
    name: 'FERNANDO',
    authorizations: authorizationGroups.reduce((acc, group) => {
      acc[group] = Math.random() > 0.5;
      return acc;
    }, {} as Record<string, boolean>),
  },
  {
    name: 'OSCAR',
    authorizations: authorizationGroups.reduce((acc, group) => {
      acc[group] = Math.random() > 0.5;
      return acc;
    }, {} as Record<string, boolean>),
  },
  {
    name: 'MIGUEL',
    authorizations: authorizationGroups.reduce((acc, group) => {
      acc[group] = Math.random() > 0.5;
      return acc;
    }, {} as Record<string, boolean>),
  },
];

export default function AuthorizationReport() {
  const [selectedUser, setSelectedUser] = useState<string | null>(mockUsers[0]?.name);

  const selectedUserData = mockUsers.find(u => u.name === selectedUser);

  return (
    <div>
      <PageHeader title="05-AUTHORIZATION MATRIX" />

      <div className="overflow-x-auto">
        <table className="data-table text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-table-header z-10">OPERATOR</th>
              {authorizationGroups.map((group) => (
                <th key={group} className="whitespace-nowrap">
                  {group} Y/N
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr 
                key={user.name}
                onClick={() => setSelectedUser(user.name)}
                className={`cursor-pointer ${selectedUser === user.name ? 'bg-accent/30' : ''}`}
              >
                <td className="sticky left-0 bg-card z-10 font-medium">{user.name}</td>
                {authorizationGroups.map((group) => (
                  <td 
                    key={group}
                    className={`text-center font-bold ${
                      user.authorizations[group] ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {user.authorizations[group] ? 'Y' : 'N'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUserData && (
        <div className="mt-6 border border-primary rounded overflow-hidden max-w-2xl">
          <div className="section-header">
            Authorizations for {selectedUserData.name}
          </div>
          <div className="p-4 bg-card">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {authorizationGroups.map((group) => (
                <div 
                  key={group}
                  className={`
                    px-3 py-2 rounded text-xs font-medium text-center
                    ${selectedUserData.authorizations[group] 
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
