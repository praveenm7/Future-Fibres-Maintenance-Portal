import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReportToolbar } from '@/components/ui/ReportToolbar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthMatrix } from '@/hooks/useAuthMatrix';
import { useListOptions } from '@/hooks/useListOptions';
import { exportToExcel, getExportTimestamp } from '@/lib/exportExcel';
import { printReport } from '@/lib/printReport';
import {
  Loader2, Search, Users, ShieldCheck, ShieldX, ChevronDown, ChevronUp,
  User, Mail, Building2, Calendar,
} from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AuthorizationMatrix } from '@/types/maintenance';

type ViewMode = 'operators' | 'groups';

export default function AuthorizationReport() {
  const { useGetMatrices } = useAuthMatrix();
  const { useGetListOptions } = useListOptions();

  const { data: authMatrices = [], isLoading: loadingMatrices, isError: errorMatrices, refetch: refetchMatrices } = useGetMatrices();
  const { data: authGroups = [], isLoading: loadingGroups, isError: errorGroups, refetch: refetchGroups } = useGetListOptions('AUTHORIZATION_GROUP');

  const authorizationGroups = authGroups.map(g => g.value);

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('operators');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState<string>('');

  // Derived data
  const departments = useMemo(() => {
    const depts = new Set<string>();
    authMatrices.forEach(u => { if (u.department) depts.add(u.department); });
    return [...depts].sort();
  }, [authMatrices]);

  const filteredOperators = useMemo(() => {
    const q = search.toLowerCase();
    return authMatrices.filter(u => {
      if (filterDept && u.department !== filterDept) return false;
      if (!q) return true;
      return u.operatorName.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q);
    });
  }, [authMatrices, search, filterDept]);

  // Group-centric view data
  const groupData = useMemo(() => {
    return authorizationGroups.map(group => {
      const authorized = authMatrices.filter(u => u.authorizations?.[group]);
      return { group, authorized, count: authorized.length, total: authMatrices.length };
    }).sort((a, b) => b.count - a.count);
  }, [authorizationGroups, authMatrices]);

  const filteredGroups = useMemo(() => {
    if (!search) return groupData;
    const q = search.toLowerCase();
    return groupData.filter(g => g.group.toLowerCase().includes(q));
  }, [groupData, search]);

  // Summary stats
  const stats = useMemo(() => {
    const totalOperators = authMatrices.length;
    const totalGroups = authorizationGroups.length;
    const withAuth = authMatrices.filter(u =>
      authorizationGroups.some(g => u.authorizations?.[g])
    ).length;
    const withoutAuth = totalOperators - withAuth;
    return { totalOperators, totalGroups, withAuth, withoutAuth };
  }, [authMatrices, authorizationGroups]);

  if (loadingMatrices || loadingGroups) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading authorization report...</p>
      </div>
    );
  }

  if (errorMatrices || errorGroups) {
    return <QueryError onRetry={() => { refetchMatrices(); refetchGroups(); }} />;
  }

  if (authMatrices.length === 0) {
    return (
      <div>
        <PageHeader title="Authorization Matrix" />
        <EmptyState
          title="No authorization data"
          description="No operators have been added to the authorization matrix yet."
        />
      </div>
    );
  }

  const getAuthCount = (user: AuthorizationMatrix) =>
    authorizationGroups.filter(g => user.authorizations?.[g]).length;

  const handlePrint = () => {
    const operatorCards = authMatrices.map(user => {
      const authGroups = authorizationGroups.filter(g => user.authorizations?.[g]);
      const count = authGroups.length;
      return `
        <div style="page-break-inside:avoid;border:1px solid #d1d5db;border-radius:6px;margin-bottom:12px;overflow:hidden">
          <div style="background:#f3f4f6;padding:8px 12px;border-bottom:1px solid #d1d5db;display:flex;justify-content:space-between;align-items:center">
            <div>
              <strong style="font-size:12px">${user.operatorName}</strong>
              ${user.department ? `<span style="font-size:9px;color:#666;margin-left:8px">${user.department}</span>` : ''}
              ${user.email ? `<span style="font-size:9px;color:#666;margin-left:8px">${user.email}</span>` : ''}
            </div>
            <span style="font-size:10px;font-weight:600;color:#059669">${count}/${authorizationGroups.length} authorized</span>
          </div>
          <div style="padding:8px 12px">
            ${authGroups.length > 0
              ? `<div style="display:flex;flex-wrap:wrap;gap:4px">
                  ${authGroups.map(g => `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:8px;font-weight:600;background:#d1fae5;color:#065f46;border:1px solid #a7f3d0">${g}</span>`).join('')}
                </div>`
              : '<span style="font-size:9px;color:#999;font-style:italic">No authorizations</span>'}
          </div>
        </div>`;
    }).join('');

    printReport({
      title: 'Authorization Matrix',
      subtitle: `${authMatrices.length} operators | ${authorizationGroups.length} equipment groups`,
      orientation: 'portrait',
      htmlContent: operatorCards,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      filename: `Authorization_Matrix_${getExportTimestamp()}`,
      sheets: [{
        name: 'Authorization Matrix',
        headers: ['Operator', 'Email', 'Department', 'Authorized Groups', ...authorizationGroups],
        rows: authMatrices.map(user => [
          user.operatorName, user.email || '', user.department || '',
          getAuthCount(user),
          ...authorizationGroups.map(g => user.authorizations?.[g] ? 'Y' : 'N'),
        ]),
      }],
    });
  };

  return (
    <div>
      <PageHeader title="Authorization Matrix" />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Operators" value={stats.totalOperators} color="text-primary" />
        <StatCard icon={ShieldCheck} label="With Authorizations" value={stats.withAuth} color="text-success" />
        <StatCard icon={ShieldX} label="No Authorizations" value={stats.withoutAuth} color="text-destructive" />
        <StatCard icon={ShieldCheck} label="Equipment Groups" value={stats.totalGroups} color="text-info" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={viewMode === 'operators' ? 'Search operators...' : 'Search equipment groups...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Department filter (operators view only) */}
        {viewMode === 'operators' && departments.length > 1 && (
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="h-9 bg-card border border-border rounded-md px-3 text-sm"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}

        {/* View toggle */}
        <div className="flex border border-border rounded-md overflow-hidden">
          <button
            onClick={() => { setViewMode('operators'); setSearch(''); }}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'operators' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
          >
            By Operator
          </button>
          <button
            onClick={() => { setViewMode('groups'); setSearch(''); setFilterDept(''); }}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'groups' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
          >
            By Group
          </button>
        </div>

        <div className="sm:ml-auto">
          <ReportToolbar onPrint={handlePrint} onExportExcel={handleExportExcel} />
        </div>
      </div>

      {/* Content */}
      {viewMode === 'operators' ? (
        <OperatorView
          operators={filteredOperators}
          authorizationGroups={authorizationGroups}
          expandedId={expandedId}
          onToggle={id => setExpandedId(expandedId === id ? null : id)}
          getAuthCount={getAuthCount}
        />
      ) : (
        <GroupView groups={filteredGroups} />
      )}
    </div>
  );
}

// --- Sub-components ---

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground uppercase font-bold">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function OperatorView({
  operators, authorizationGroups, expandedId, onToggle, getAuthCount,
}: {
  operators: AuthorizationMatrix[];
  authorizationGroups: string[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  getAuthCount: (u: AuthorizationMatrix) => number;
}) {
  if (operators.length === 0) {
    return <p className="text-center text-muted-foreground py-8 text-sm">No operators match your search.</p>;
  }

  return (
    <div className="space-y-2">
      {operators.map(user => {
        const authCount = getAuthCount(user);
        const isExpanded = expandedId === user.id;
        const authGroups = authorizationGroups.filter(g => user.authorizations?.[g]);
        const unauthGroups = authorizationGroups.filter(g => !user.authorizations?.[g]);
        const coveragePct = authorizationGroups.length > 0
          ? Math.round((authCount / authorizationGroups.length) * 100)
          : 0;

        return (
          <div key={user.id} className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
            {/* Header row */}
            <button
              onClick={() => onToggle(user.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="text-sm font-bold">{user.operatorName.charAt(0)}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{user.operatorName}</span>
                  {user.department && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">{user.department}</Badge>
                  )}
                </div>
                {user.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>

              {/* Coverage bar */}
              <div className="hidden sm:flex items-center gap-3 shrink-0 w-[180px]">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${coveragePct >= 50 ? 'bg-emerald-500' : coveragePct > 0 ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                    style={{ width: `${coveragePct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground tabular-nums w-[52px] text-right">
                  {authCount}/{authorizationGroups.length}
                </span>
              </div>

              {isExpanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t border-border px-4 py-4 bg-muted/20">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs mb-4">
                  <InfoChip icon={User} label="Name" value={user.operatorName} />
                  <InfoChip icon={Mail} label="Email" value={user.email || '-'} />
                  <InfoChip icon={Building2} label="Department" value={user.department || '-'} />
                  {user.defaultShiftName && <InfoChip icon={Calendar} label="Shift" value={user.defaultShiftName} />}
                </div>

                {authGroups.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-success mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Authorized ({authGroups.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {authGroups.map(g => (
                        <span key={g} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {unauthGroups.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ShieldX className="h-3.5 w-3.5" />
                      Not Authorized ({unauthGroups.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {unauthGroups.map(g => (
                        <span key={g} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupView({ groups }: { groups: Array<{ group: string; authorized: AuthorizationMatrix[]; count: number; total: number }> }) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  if (groups.length === 0) {
    return <p className="text-center text-muted-foreground py-8 text-sm">No groups match your search.</p>;
  }

  return (
    <div className="space-y-2">
      {groups.map(({ group, authorized, count, total }) => {
        const isExpanded = expandedGroup === group;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div key={group} className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedGroup(isExpanded ? null : group)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${count > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold">{group}</span>
                <p className="text-xs text-muted-foreground">
                  {count === 0 ? 'No operators authorized' : `${count} operator${count !== 1 ? 's' : ''} authorized`}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-3 shrink-0 w-[180px]">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 50 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground tabular-nums w-[52px] text-right">
                  {pct}%
                </span>
              </div>

              {isExpanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {isExpanded && (
              <div className="border-t border-border px-4 py-3 bg-muted/20">
                {authorized.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No operators are authorized for this group.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {authorized.map(op => (
                      <div key={op.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-border">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold">{op.operatorName.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{op.operatorName}</p>
                          {op.department && <p className="text-[10px] text-muted-foreground truncate">{op.department}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoChip({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
