import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReportToolbar } from '@/components/ui/ReportToolbar';
import { useNonConformities } from '@/hooks/useNonConformities';
import { useMachines } from '@/hooks/useMachines';
import { exportToExcel, formatDateForExport, getExportTimestamp } from '@/lib/exportExcel';
import { printReport } from '@/lib/printReport';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { NonConformity } from '@/types/maintenance';
import {
  Loader2, Search, X, AlertTriangle, Clock, Check,
  MessageSquare, ImageIcon
} from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { EmptyState } from '@/components/ui/EmptyState';

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

export default function NCMaintenanceReport() {
  const { useGetNCs, useGetNCComments } = useNonConformities();
  const { useGetMachines } = useMachines();

  const { data: nonConformities = [], isLoading: loadingNCs, isError: errorNCs, refetch: refetchNCs } = useGetNCs();
  const { data: machines = [], isLoading: loadingMachines, isError: errorMachines, refetch: refetchMachines } = useGetMachines();

  const [selectedNC, setSelectedNC] = useState<NonConformity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');

  const { data: comments = [], isLoading: loadingComments } = useGetNCComments(selectedNC?.id || '');

  const selectedMachine = machines.find(m => m.id === selectedNC?.machineId);

  const areas = useMemo(() => [...new Set(nonConformities.map(nc => nc.area).filter(Boolean))].sort(), [nonConformities]);

  const filteredNCs = useMemo(() => {
    return nonConformities.filter(nc => {
      const q = searchQuery.toLowerCase();
      const machine = machines.find(m => m.id === nc.machineId);
      const matchesSearch = !q ||
        nc.ncCode.toLowerCase().includes(q) ||
        machine?.finalCode.toLowerCase().includes(q) ||
        machine?.description.toLowerCase().includes(q) ||
        nc.maintenanceOperator?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || nc.status === statusFilter;
      const matchesArea = !areaFilter || nc.area === areaFilter;
      return matchesSearch && matchesStatus && matchesArea;
    });
  }, [nonConformities, machines, searchQuery, statusFilter, areaFilter]);

  if (loadingNCs || loadingMachines) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading NC maintenance report...</p>
      </div>
    );
  }

  if (errorNCs || errorMachines) {
    return <QueryError onRetry={() => { refetchNCs(); refetchMachines(); }} />;
  }

  if (nonConformities.length === 0) {
    return (
      <div>
        <PageHeader title="NC Maintenance" subtitle="0 non-conformities recorded" />
        <EmptyState
          icon={AlertTriangle}
          title="No non-conformities found"
          description="No non-conformities have been recorded yet."
        />
      </div>
    );
  }

  const pendingCount = nonConformities.filter(nc => nc.status === 'PENDING').length;
  const inProgressCount = nonConformities.filter(nc => nc.status === 'IN PROGRESS').length;
  const completedCount = nonConformities.filter(nc => nc.status === 'COMPLETED').length;

  const handlePrint = () => {
    const tableHtml = `<table>
      <thead><tr>
        <th>NC Code</th><th>Machine</th><th>Description</th><th>Area</th>
        <th>Operator</th><th>Created</th><th>Initiated</th><th>Status</th><th>Priority</th>
      </tr></thead>
      <tbody>
      ${filteredNCs.map(nc => {
        const machine = machines.find(m => m.id === nc.machineId);
        const pLabel = nc.priority >= 3 ? 'High' : nc.priority === 2 ? 'Medium' : 'Low';
        const sLabel = nc.status === 'IN PROGRESS' ? 'In Progress' : nc.status.charAt(0) + nc.status.slice(1).toLowerCase();
        return `<tr>
          <td>${nc.ncCode}</td><td>${machine?.finalCode || '-'}</td>
          <td>${machine?.description || '-'}</td><td>${nc.area}</td>
          <td>${nc.maintenanceOperator || '-'}</td>
          <td>${formatDate(nc.creationDate)}</td><td>${formatDate(nc.initiationDate)}</td>
          <td>${sLabel}</td><td>${pLabel}</td>
        </tr>`;
      }).join('')}
      </tbody></table>`;

    const filters = [statusFilter && `Status: ${statusFilter}`, areaFilter && `Area: ${areaFilter}`].filter(Boolean).join(', ');
    printReport({
      title: 'NC Maintenance Report',
      subtitle: filters || undefined,
      htmlContent: tableHtml,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      filename: `NC_Maintenance_${getExportTimestamp()}`,
      sheets: [{
        name: 'NC Maintenance',
        headers: ['NC Code', 'Machine Code', 'Description', 'Area', 'Operator',
          'Created', 'Initiated', 'Finished', 'Status', 'Priority', 'Category'],
        rows: filteredNCs.map(nc => {
          const machine = machines.find(m => m.id === nc.machineId);
          const pLabel = nc.priority >= 3 ? 'High' : nc.priority === 2 ? 'Medium' : 'Low';
          return [
            nc.ncCode, machine?.finalCode || '', machine?.description || '',
            nc.area, nc.maintenanceOperator || '',
            formatDateForExport(nc.creationDate), formatDateForExport(nc.initiationDate),
            formatDateForExport(nc.finishDate), nc.status, pLabel, nc.category || ''
          ];
        }),
      }],
    });
  };

  return (
    <div>
      <PageHeader title="NC Maintenance" subtitle={`${nonConformities.length} non-conformities recorded`} />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} value={nonConformities.length} label="Total NCs" dot="bg-slate-400" />
        <StatCard icon={<Clock className="h-4 w-4" />} value={pendingCount} label="Pending" dot="bg-amber-400" />
        <StatCard icon={<Loader2 className="h-4 w-4" />} value={inProgressCount} label="In Progress" dot="bg-blue-400" />
        <StatCard icon={<Check className="h-4 w-4" />} value={completedCount} label="Completed" dot="bg-emerald-400" />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by NC code, machine, or operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-9 pr-8"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input w-full sm:w-40">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="form-input w-full sm:w-36">
          <option value="">All Areas</option>
          {areas.map(area => <option key={area} value={area}>{area}</option>)}
        </select>
        <ReportToolbar onPrint={handlePrint} onExportExcel={handleExportExcel} className="ml-auto" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* Main Table */}
        <div className="relative isolate overflow-x-auto border border-border rounded-lg bg-card">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>NC Code</th>
                <th>Machine</th>
                <th>Description</th>
                <th>Area</th>
                <th>Operator</th>
                <th>Created</th>
                <th>Initiated</th>
                <th>Status</th>
                <th className="text-center">Priority</th>
              </tr>
            </thead>
            <tbody>
              {filteredNCs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-15" />
                    <p>No non-conformities found</p>
                  </td>
                </tr>
              ) : (
                filteredNCs.map((nc) => {
                  const machine = machines.find(m => m.id === nc.machineId);
                  const isSelected = selectedNC?.id === nc.id;
                  return (
                    <tr
                      key={nc.id}
                      onClick={() => setSelectedNC(nc)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : 'hover:bg-muted/40'}`}
                    >
                      <td className="font-mono font-semibold whitespace-nowrap">{nc.ncCode}</td>
                      <td className="font-medium whitespace-nowrap">{machine?.finalCode || '-'}</td>
                      <td className="text-muted-foreground max-w-[200px] truncate">{machine?.description || '-'}</td>
                      <td className="text-muted-foreground">{nc.area}</td>
                      <td className="text-muted-foreground">{nc.maintenanceOperator || '-'}</td>
                      <td className="whitespace-nowrap text-muted-foreground">{formatDate(nc.creationDate)}</td>
                      <td className="whitespace-nowrap text-muted-foreground">{formatDate(nc.initiationDate)}</td>
                      <td><StatusBadge value={nc.status} /></td>
                      <td className="text-center"><StatusBadge value={nc.priority} variant="priority" /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {filteredNCs.length > 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/20">
              Showing {filteredNCs.length} of {nonConformities.length} records
              {selectedNC && <span className="float-right">Selected: <strong>{selectedNC.ncCode}</strong></span>}
            </div>
          )}
        </div>

        {/* NC Details Sidebar */}
        <div className="space-y-4">
          {!selectedNC ? (
            <div className="border border-dashed border-border rounded-lg p-8 text-center bg-card/50">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">No NC selected</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click on a row to view full details</p>
            </div>
          ) : (
            <>
              {/* NC Header */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="border-b border-border px-4 py-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold font-mono">{selectedNC.ncCode}</p>
                      <p className="text-sm text-muted-foreground">{selectedMachine?.description || 'Unknown Machine'}</p>
                    </div>
                    <button
                      onClick={() => setSelectedNC(null)}
                      className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-3 mt-2.5">
                    <StatusBadge value={selectedNC.status} />
                    <span className="text-xs text-muted-foreground/40">|</span>
                    <StatusBadge value={selectedNC.priority} variant="priority" />
                  </div>
                </div>

                {/* Machine Image */}
                <div className="p-3 border-b border-border">
                  <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center border border-border overflow-hidden">
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

                {/* NC Details */}
                <div className="divide-y divide-border">
                  <DetailRow label="Machine Code" value={selectedMachine?.finalCode} />
                  <DetailRow label="Area" value={selectedNC.area} />
                  <DetailRow label="Operator" value={selectedNC.maintenanceOperator} />
                  <DetailRow label="Created" value={formatDate(selectedNC.creationDate)} />
                  <DetailRow label="Initiated" value={formatDate(selectedNC.initiationDate)} />
                  <DetailRow label="Finished" value={formatDate(selectedNC.finishDate)} />
                  {selectedNC.category && <DetailRow label="Category" value={selectedNC.category} />}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Comments
                  </p>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{comments.length}</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {loadingComments ? (
                    <div className="flex justify-center p-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="divide-y divide-border">
                      {comments.map((comment) => (
                        <div key={comment.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">{comment.operator || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(comment.date)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <MessageSquare className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/15" />
                      <p className="text-xs text-muted-foreground/50">No comments yet</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, dot: _dot }: { icon: React.ReactNode; value: number; label: string; dot: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[55%] truncate" title={value || '-'}>
        {value || <span className="text-muted-foreground/30">-</span>}
      </span>
    </div>
  );
}
