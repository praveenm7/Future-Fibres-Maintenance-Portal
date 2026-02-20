import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReportToolbar } from '@/components/ui/ReportToolbar';
import { useMachines } from '@/hooks/useMachines';
import { useMaintenanceActions } from '@/hooks/useMaintenanceActions';
import { useMaintenanceExecutions } from '@/hooks/useMaintenanceExecutions';
import { useSpareParts } from '@/hooks/useSpareParts';
import { useNonConformities } from '@/hooks/useNonConformities';
import { exportToExcel, formatDateForExport, getExportTimestamp } from '@/lib/exportExcel';
import { printReport } from '@/lib/printReport';
import {
  Loader2, Wrench, Package, AlertTriangle, ImageIcon,
  Check, ExternalLink, MapPin, Factory, Hash, User, Minus, TrendingUp
} from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';
const SERVER_BASE = API_BASE_URL.replace('/api', '');

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; text: string }> = {
    'PENDING': { dot: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-400' },
    'IN PROGRESS': { dot: 'bg-blue-400', text: 'text-blue-700 dark:text-blue-400' },
    'COMPLETED': { dot: 'bg-emerald-400', text: 'text-emerald-700 dark:text-emerald-400' },
    'CANCELLED': { dot: 'bg-gray-400', text: 'text-gray-500' },
  };
  const c = config[status] || config['PENDING'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`}></span>
      {status === 'IN PROGRESS' ? 'In Progress' : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority >= 3) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">High</span>;
  if (priority === 2) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Medium</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Low</span>;
}

function PeriodicityBadge({ periodicity }: { periodicity: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
      {periodicity}
    </span>
  );
}

export default function MaintenancePlanReport() {
  const { useGetMachines } = useMachines();
  const { useGetActions } = useMaintenanceActions();
  const { useGetExecutionStats } = useMaintenanceExecutions();
  const { useGetParts } = useSpareParts();
  const { useGetNCs } = useNonConformities();

  const { data: machines = [], isLoading: loadingMachines, isError: errorMachines, refetch: refetchMachines } = useGetMachines();
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');

  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].id);
    }
  }, [machines, selectedMachineId]);

  const { data: machineActions = [], isLoading: loadingActions, isError: errorActions, refetch: refetchActions } = useGetActions(selectedMachineId);
  const { data: executionStats = [] } = useGetExecutionStats(selectedMachineId);
  const { data: machineParts = [], isLoading: loadingParts, isError: errorParts, refetch: refetchParts } = useGetParts(selectedMachineId);
  const { data: machineNCs = [], isLoading: loadingNCs, isError: errorNCs, refetch: refetchNCs } = useGetNCs(selectedMachineId);

  // Build a lookup map for execution stats by actionId
  const statsMap = useMemo(() => new Map(executionStats.map(s => [s.actionId, s])), [executionStats]);

  // Overall completion rate for this machine (planned vs completed)
  const overallCompletionRate = useMemo(() => {
    if (executionStats.length === 0) return null;
    const totalCompleted = executionStats.reduce((sum, s) => sum + s.totalCompleted, 0);
    const totalPlanned = executionStats.reduce((sum, s) => sum + s.totalPlanned, 0);
    return totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
  }, [executionStats]);

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const isLoadingData = loadingActions || loadingParts || loadingNCs;
  const hasDataError = errorActions || errorParts || errorNCs;
  const refetchAllData = () => { refetchActions(); refetchParts(); refetchNCs(); };

  const handlePrint = () => {
    if (!selectedMachine) return;
    const machineHeader = `<div class="machine-header">
      <strong>${selectedMachine.finalCode}</strong> — ${selectedMachine.description}<br/>
      Area: ${selectedMachine.area} &nbsp;|&nbsp; Manufacturer: ${selectedMachine.manufacturer} &nbsp;|&nbsp; Model: ${selectedMachine.model}
    </div>`;

    const actionsTable = `<div class="section-title">Maintenance Actions</div>
    <table><thead><tr><th>Action</th><th>Periodicity</th><th>Time (min)</th><th>Maint.</th><th>Done</th><th>Rate</th><th>Avg Time</th><th>Last Done</th></tr></thead>
    <tbody>${machineActions.length === 0 ? '<tr><td colspan="8" style="text-align:center">No actions defined</td></tr>' :
      machineActions.map(a => {
        const stats = statsMap.get(a.id);
        const done = stats && stats.totalPlanned > 0 ? `${stats.totalCompleted}/${stats.totalPlanned}` : '—';
        const rate = stats && stats.totalPlanned > 0 ? `${stats.completionRate}%` : '—';
        const avgTime = stats?.avgActualTime != null ? `${Math.round(stats.avgActualTime)}m / ${a.timeNeeded}m` : '—';
        const lastDone = stats?.lastCompletedDate ? new Date(stats.lastCompletedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
        return `<tr><td>${a.action}</td><td>${a.periodicity}</td><td style="text-align:center">${a.timeNeeded}</td><td style="text-align:center">${a.maintenanceInCharge ? 'Yes' : 'No'}</td><td style="text-align:center">${done}</td><td style="text-align:center">${rate}</td><td style="text-align:center">${avgTime}</td><td>${lastDone}</td></tr>`;
      }).join('')}
    </tbody></table>`;

    const partsTable = `<div class="section-title">Spare Parts</div>
    <table><thead><tr><th>Description</th><th>Reference</th><th>Qty</th><th>Link</th></tr></thead>
    <tbody>${machineParts.length === 0 ? '<tr><td colspan="4" style="text-align:center">No spare parts</td></tr>' :
      machineParts.map(p => `<tr><td>${p.description}</td><td>${p.reference}</td><td style="text-align:center">${p.quantity}</td><td>${p.link || '-'}</td></tr>`).join('')}
    </tbody></table>`;

    const ncsTable = `<div class="section-title">Non-Conformities</div>
    <table><thead><tr><th>NC Code</th><th>Operator</th><th>Created</th><th>Initiated</th><th>Finished</th><th>Status</th><th>Category</th><th>Priority</th></tr></thead>
    <tbody>${machineNCs.length === 0 ? '<tr><td colspan="8" style="text-align:center">No non-conformities</td></tr>' :
      machineNCs.map(nc => {
        const pLabel = nc.priority >= 3 ? 'High' : nc.priority === 2 ? 'Medium' : 'Low';
        const sLabel = nc.status === 'IN PROGRESS' ? 'In Progress' : nc.status.charAt(0) + nc.status.slice(1).toLowerCase();
        return `<tr><td>${nc.ncCode}</td><td>${nc.maintenanceOperator || '-'}</td><td>${formatDate(nc.creationDate)}</td><td>${formatDate(nc.initiationDate)}</td><td>${formatDate(nc.finishDate)}</td><td>${sLabel}</td><td>${nc.category || '-'}</td><td>${pLabel}</td></tr>`;
      }).join('')}
    </tbody></table>`;

    printReport({
      title: `Maintenance Plan — ${selectedMachine.finalCode}`,
      subtitle: selectedMachine.description,
      htmlContent: machineHeader + actionsTable + partsTable + ncsTable,
    });
  };

  const handleExportExcel = () => {
    if (!selectedMachine) return;
    exportToExcel({
      filename: `Maintenance_Plan_${selectedMachine.finalCode}_${getExportTimestamp()}`,
      sheets: [
        {
          name: 'Actions',
          headers: ['Action', 'Periodicity', 'Time (min)', 'Maintenance In Charge', 'Completed', 'Planned', 'Rate %', 'Avg Actual Time', 'Last Done'],
          rows: machineActions.map(a => {
            const stats = statsMap.get(a.id);
            return [
              a.action, a.periodicity, a.timeNeeded, a.maintenanceInCharge ? 'Yes' : 'No',
              stats?.totalCompleted ?? '', stats?.totalPlanned ?? '',
              stats && stats.totalPlanned > 0 ? stats.completionRate : '',
              stats?.avgActualTime != null ? Math.round(stats.avgActualTime) : '',
              stats?.lastCompletedDate ? new Date(stats.lastCompletedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''
            ];
          }),
        },
        {
          name: 'Spare Parts',
          headers: ['Description', 'Reference', 'Quantity', 'Link'],
          rows: machineParts.map(p => [p.description, p.reference, p.quantity, p.link || '']),
        },
        {
          name: 'Non-Conformities',
          headers: ['NC Code', 'Operator', 'Created', 'Initiated', 'Finished', 'Status', 'Category', 'Priority'],
          rows: machineNCs.map(nc => {
            const pLabel = nc.priority >= 3 ? 'High' : nc.priority === 2 ? 'Medium' : 'Low';
            return [
              nc.ncCode, nc.maintenanceOperator || '',
              formatDateForExport(nc.creationDate), formatDateForExport(nc.initiationDate),
              formatDateForExport(nc.finishDate), nc.status, nc.category || '', pLabel
            ];
          }),
        },
      ],
    });
  };

  if (loadingMachines) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading maintenance plan data...</p>
      </div>
    );
  }

  if (errorMachines) return <QueryError onRetry={refetchMachines} />;

  return (
    <div>
      <PageHeader title="Maintenance Plan" subtitle="View maintenance actions, spare parts, and NCs per machine" />

      {/* Machine Selector */}
      <div className="bg-card border border-border rounded-lg mb-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 flex flex-col sm:flex-row border-b sm:border-b-0">
            <div className="px-4 py-3 bg-muted/30 border-b sm:border-b-0 sm:border-r border-border flex items-center gap-2 sm:min-w-[140px]">
              <Factory className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Machine</span>
            </div>
            <div className="flex-1 flex items-center px-3 gap-2">
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="flex-1 h-10 bg-transparent text-sm font-medium focus:outline-none"
              >
                {machines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.finalCode} — {m.description}
                  </option>
                ))}
              </select>
              {isLoadingData && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>

          {/* Quick Stats + Toolbar */}
          {selectedMachine && (
            <div className="flex border-t sm:border-t-0 sm:border-l border-border divide-x divide-border">
              <QuickStat icon={<Wrench className="h-3.5 w-3.5" />} value={machineActions.length} label="Actions" />
              <QuickStat icon={<Package className="h-3.5 w-3.5" />} value={machineParts.length} label="Parts" />
              <QuickStat icon={<AlertTriangle className="h-3.5 w-3.5" />} value={machineNCs.length} label="NCs" />
              {overallCompletionRate !== null && (
                <QuickStat icon={<TrendingUp className="h-3.5 w-3.5" />} value={overallCompletionRate} label="% Done" />
              )}
              <div className="flex items-center px-3">
                <ReportToolbar onPrint={handlePrint} onExportExcel={handleExportExcel} />
              </div>
            </div>
          )}
        </div>
      </div>

      {hasDataError && <QueryError onRetry={refetchAllData} className="mb-6" />}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Maintenance Actions */}
          <SectionCard
            icon={<Wrench className="h-3.5 w-3.5" />}
            title="Maintenance Actions"
            count={machineActions.length}
          >
            <div className="relative isolate overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th className="w-[30%]">Action</th>
                    <th>Periodicity</th>
                    <th className="text-center">Time</th>
                    <th className="text-center">Maint.</th>
                    <th className="text-center">Done</th>
                    <th className="text-center">Rate</th>
                    <th className="text-center">Avg Time</th>
                    <th>Last Done</th>
                  </tr>
                </thead>
                <tbody>
                  {machineActions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        <Wrench className="h-6 w-6 mx-auto mb-1.5 opacity-15" />
                        <p className="text-xs">No maintenance actions defined</p>
                      </td>
                    </tr>
                  ) : (
                    machineActions.map((action) => {
                      const stats = statsMap.get(action.id);
                      return (
                        <tr key={action.id}>
                          <td className="font-medium">{action.action}</td>
                          <td><PeriodicityBadge periodicity={action.periodicity} /></td>
                          <td className="text-center">
                            <span className="font-mono text-muted-foreground">{action.timeNeeded} min</span>
                          </td>
                          <td className="text-center">
                            {action.maintenanceInCharge ? (
                              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto" strokeWidth={2.5} />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                            )}
                          </td>
                          <td className="text-center">
                            {stats && stats.totalPlanned > 0 ? (
                              <span className="font-mono text-muted-foreground">{stats.totalCompleted}/{stats.totalPlanned}</span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="text-center">
                            {stats && stats.totalPlanned > 0 ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                stats.completionRate >= 75
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                  : stats.completionRate >= 50
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {stats.completionRate}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="text-center">
                            {stats?.avgActualTime != null ? (
                              <span className="font-mono text-muted-foreground">
                                {Math.round(stats.avgActualTime)}m
                                <span className="text-muted-foreground/50"> / {action.timeNeeded}m</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap text-muted-foreground">
                            {stats?.lastCompletedDate
                              ? new Date(stats.lastCompletedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                              : <span className="text-muted-foreground/30">—</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Spare Parts */}
          <SectionCard
            icon={<Package className="h-3.5 w-3.5" />}
            title="Spare Parts"
            count={machineParts.length}
          >
            <div className="relative isolate overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Reference</th>
                    <th className="text-center">Qty</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {machineParts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        <Package className="h-6 w-6 mx-auto mb-1.5 opacity-15" />
                        <p className="text-xs">No spare parts registered</p>
                      </td>
                    </tr>
                  ) : (
                    machineParts.map((part) => (
                      <tr key={part.id}>
                        <td className="font-medium">{part.description}</td>
                        <td className="font-mono text-muted-foreground">{part.reference}</td>
                        <td className="text-center">
                          <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded bg-muted text-xs font-semibold">
                            {part.quantity}
                          </span>
                        </td>
                        <td>
                          {part.link ? (
                            <a
                              href={part.link.startsWith('http') ? part.link : `https://${part.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="max-w-[200px] truncate">{part.link}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Non-Conformities */}
          <SectionCard
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            title="Non-Conformities"
            count={machineNCs.length}
          >
            <div className="relative isolate overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>NC Code</th>
                    <th>Operator</th>
                    <th>Created</th>
                    <th>Initiated</th>
                    <th>Finished</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th className="text-center">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {machineNCs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-6 w-6 mx-auto mb-1.5 opacity-15" />
                        <p className="text-xs">No non-conformities recorded</p>
                      </td>
                    </tr>
                  ) : (
                    machineNCs.map((nc) => (
                      <tr key={nc.id}>
                        <td className="font-mono font-semibold whitespace-nowrap">{nc.ncCode}</td>
                        <td className="text-muted-foreground">{nc.maintenanceOperator || '-'}</td>
                        <td className="whitespace-nowrap text-muted-foreground">{formatDate(nc.creationDate)}</td>
                        <td className="whitespace-nowrap text-muted-foreground">{formatDate(nc.initiationDate)}</td>
                        <td className="whitespace-nowrap text-muted-foreground">{formatDate(nc.finishDate)}</td>
                        <td><StatusBadge status={nc.status} /></td>
                        <td className="text-muted-foreground">{nc.category || '-'}</td>
                        <td className="text-center"><PriorityBadge priority={nc.priority} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Machine Info Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-4 py-3 bg-muted/20">
              <p className="text-base font-bold font-mono">{selectedMachine?.finalCode}</p>
              <p className="text-sm text-muted-foreground">{selectedMachine?.description}</p>
            </div>

            {/* Machine Image */}
            <div className="p-3 border-b border-border">
              <div className="aspect-square bg-muted/20 rounded-lg flex items-center justify-center border border-border overflow-hidden">
                {selectedMachine?.imageUrl ? (
                  <img
                    src={selectedMachine.imageUrl.startsWith('http') ? selectedMachine.imageUrl : `${SERVER_BASE}${selectedMachine.imageUrl}`}
                    alt="Machine"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-1 text-muted-foreground/15" />
                    <span className="text-xs text-muted-foreground/40">No image available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="divide-y divide-border">
              <DetailRow icon={<MapPin className="h-3.5 w-3.5" />} label="Area" value={selectedMachine?.area} />
              <DetailRow icon={<Factory className="h-3.5 w-3.5" />} label="Manufacturer" value={selectedMachine?.manufacturer} />
              <DetailRow icon={<Hash className="h-3.5 w-3.5" />} label="Model" value={selectedMachine?.model} />
              <DetailRow icon={<User className="h-3.5 w-3.5" />} label="Person in Charge" value={selectedMachine?.personInCharge} />
            </div>
          </div>

          {/* NC Status Summary */}
          {machineNCs.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NC Status Summary</p>
              </div>
              <div className="p-3 space-y-2.5">
                {(['PENDING', 'IN PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((statusKey) => {
                  const count = machineNCs.filter(nc => nc.status === statusKey).length;
                  if (count === 0) return null;
                  const dotColor: Record<string, string> = {
                    'PENDING': 'bg-amber-400',
                    'IN PROGRESS': 'bg-blue-400',
                    'COMPLETED': 'bg-emerald-400',
                    'CANCELLED': 'bg-gray-400',
                  };
                  const statusLabel = statusKey === 'IN PROGRESS' ? 'In Progress' : statusKey.charAt(0) + statusKey.slice(1).toLowerCase();
                  return (
                    <div key={statusKey} className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor[statusKey]}`}></span>
                        {statusLabel}
                      </span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SectionCard({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <p className="text-sm font-semibold">{title}</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-medium">{count}</span>
      </div>
      {children}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </span>
      <span className="text-sm font-medium text-foreground text-right max-w-[55%] truncate" title={value || '-'}>
        {value || <span className="text-muted-foreground/30">-</span>}
      </span>
    </div>
  );
}
