import { useState, useRef, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReportToolbar } from '@/components/ui/ReportToolbar';
import { useMachines } from '@/hooks/useMachines';
import { exportToExcel, getExportTimestamp } from '@/lib/exportExcel';
import { printReport } from '@/lib/printReport';
import type { Machine } from '@/types/maintenance';
import {
  Loader2, Search, Eye, X, Wrench, ShieldCheck, MapPin,
  Factory, Hash, Calendar, Zap, User, DollarSign, FileText,
  Check, Minus, ImageIcon
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';
const SERVER_BASE = API_BASE_URL.replace('/api', '');

export default function MachineryListReport() {
  const { useGetMachines } = useMachines();
  const { data: machines = [], isLoading } = useGetMachines();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const detailsRef = useRef<HTMLDivElement>(null);

  const areas = useMemo(() => [...new Set(machines.map(m => m.area).filter(Boolean))].sort(), [machines]);

  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        m.finalCode.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.model.toLowerCase().includes(q);
      const matchesArea = !areaFilter || m.area === areaFilter;
      return matchesSearch && matchesArea;
    });
  }, [machines, searchQuery, areaFilter]);

  const handleSelectMachine = (machine: Machine) => {
    if (selectedMachine?.id === machine.id) {
      setSelectedMachine(null);
    } else {
      setSelectedMachine(machine);
      setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading machinery list...</p>
      </div>
    );
  }

  const maintenanceCount = machines.filter(m => m.maintenanceNeeded).length;
  const permissionCount = machines.filter(m => m.permissionRequired).length;

  const handlePrint = () => {
    const tableHtml = `<table>
      <thead><tr>
        <th>Code</th><th>Description</th><th>Area</th><th>Manufacturer</th>
        <th>Model</th><th>Permission</th><th>Auth Group</th><th>Maintenance</th><th>Person in Charge</th>
      </tr></thead>
      <tbody>
      ${filteredMachines.map(m => `<tr>
        <td>${m.finalCode}</td><td>${m.description}</td><td>${m.area}</td>
        <td>${m.manufacturer}</td><td>${m.model}</td>
        <td>${m.permissionRequired ? 'Yes' : 'No'}</td>
        <td>${m.authorizationGroup || '-'}</td>
        <td>${m.maintenanceNeeded ? 'Yes' : 'No'}</td>
        <td>${m.personInCharge || '-'}</td>
      </tr>`).join('')}
      </tbody></table>`;
    printReport({
      title: 'Tooling & Machinery List',
      subtitle: areaFilter ? `Filtered by Area: ${areaFilter}` : undefined,
      htmlContent: tableHtml,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      filename: `Machinery_List_${getExportTimestamp()}`,
      sheets: [{
        name: 'Machinery List',
        headers: ['Code', 'Description', 'Type', 'Group', 'Area', 'Manufacturer',
          'Model', 'Serial Number', 'Year', 'Power', 'Permission Required',
          'Auth Group', 'Maintenance Needed', 'Person in Charge',
          'Purchasing Date', 'Purchasing Cost', 'PO Number'],
        rows: filteredMachines.map(m => [
          m.finalCode, m.description, m.type, m.group, m.area, m.manufacturer,
          m.model, m.serialNumber, m.manufacturerYear, m.power,
          m.permissionRequired ? 'Yes' : 'No', m.authorizationGroup || '',
          m.maintenanceNeeded ? 'Yes' : 'No', m.personInCharge || '',
          m.purchasingDate || '', m.purchasingCost || '', m.poNumber || ''
        ]),
      }],
    });
  };

  return (
    <div>
      <PageHeader title="Tooling & Machinery List" subtitle={`${machines.length} machines registered`} />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Factory className="h-4 w-4" />} value={machines.length} label="Total Machines" />
        <StatCard icon={<Wrench className="h-4 w-4" />} value={maintenanceCount} label="Maintenance Active" />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} value={permissionCount} label="Permission Required" />
        <StatCard icon={<MapPin className="h-4 w-4" />} value={areas.length} label="Areas" />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by code, description, manufacturer, or model..."
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
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="form-input w-full sm:w-44"
        >
          <option value="">All Areas</option>
          {areas.map(area => <option key={area} value={area}>{area}</option>)}
        </select>
        <ReportToolbar onPrint={handlePrint} onExportExcel={handleExportExcel} className="ml-auto" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Main Table */}
        <div className="relative isolate overflow-x-auto border border-border rounded-lg bg-card">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Code</th>
                <th>Description</th>
                <th>Area</th>
                <th>Manufacturer</th>
                <th>Model</th>
                <th className="text-center">Permission</th>
                <th>Auth Group</th>
                <th className="text-center">Maintenance</th>
                <th>Person in Charge</th>
              </tr>
            </thead>
            <tbody>
              {filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No machines found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredMachines.map((machine) => {
                  const isSelected = selectedMachine?.id === machine.id;
                  return (
                    <tr
                      key={machine.id}
                      onClick={() => handleSelectMachine(machine)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : 'hover:bg-muted/40'}`}
                    >
                      <td className="text-center">
                        <div className={`h-4 w-4 rounded border-2 mx-auto flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/25'}`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                        </div>
                      </td>
                      <td className="font-mono font-semibold whitespace-nowrap">{machine.finalCode}</td>
                      <td className="font-medium">{machine.description}</td>
                      <td>
                        <span className="text-muted-foreground">{machine.area}</span>
                      </td>
                      <td>{machine.manufacturer}</td>
                      <td className="text-muted-foreground">{machine.model}</td>
                      <td className="text-center">
                        <YesNoBadge value={machine.permissionRequired} />
                      </td>
                      <td>
                        {machine.authorizationGroup ? (
                          <span className="text-xs font-medium">{machine.authorizationGroup}</span>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <YesNoBadge value={machine.maintenanceNeeded} />
                      </td>
                      <td className="text-muted-foreground">{machine.personInCharge || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {filteredMachines.length > 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/20">
              Showing {filteredMachines.length} of {machines.length} machines
              {selectedMachine && <span className="float-right">Selected: <strong>{selectedMachine.finalCode}</strong></span>}
            </div>
          )}
        </div>

        {/* Machine Details Sidebar */}
        <div ref={detailsRef} className="space-y-4">
          {!selectedMachine ? (
            <div className="border border-dashed border-border rounded-lg p-8 text-center bg-card/50">
              <Eye className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">No machine selected</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click on a row to view details</p>
            </div>
          ) : (
            <>
              {/* Machine Header Card */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="border-b border-border px-4 py-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold font-mono">{selectedMachine.finalCode}</p>
                      <p className="text-sm text-muted-foreground">{selectedMachine.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMachine(null)}
                      className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Machine Image */}
                <div className="p-3 border-b border-border">
                  <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center border border-border overflow-hidden">
                    {selectedMachine.imageUrl ? (
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

                {/* Details Grid */}
                <div className="divide-y divide-border">
                  <DetailRow icon={<MapPin className="h-3.5 w-3.5" />} label="Area" value={selectedMachine.area} />
                  <DetailRow icon={<Factory className="h-3.5 w-3.5" />} label="Manufacturer" value={selectedMachine.manufacturer} />
                  <DetailRow icon={<Hash className="h-3.5 w-3.5" />} label="Model" value={selectedMachine.model} />
                  <DetailRow icon={<FileText className="h-3.5 w-3.5" />} label="Serial Number" value={selectedMachine.serialNumber} />
                  <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Year" value={selectedMachine.manufacturerYear} />
                  <DetailRow icon={<Zap className="h-3.5 w-3.5" />} label="Power" value={selectedMachine.power} />
                  <DetailRow icon={<User className="h-3.5 w-3.5" />} label="Person in Charge" value={selectedMachine.personInCharge} />
                </div>
              </div>

              {/* Purchasing Info */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" /> Purchasing Info
                  </p>
                </div>
                <div className="divide-y divide-border">
                  <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Date" value={selectedMachine.purchasingDate} />
                  <DetailRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Cost" value={selectedMachine.purchasingCost} />
                  <DetailRow icon={<FileText className="h-3.5 w-3.5" />} label="PO Number" value={selectedMachine.poNumber} />
                </div>
              </div>

              {/* Status Indicators */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className={`rounded-lg p-2.5 text-center text-xs font-medium border ${selectedMachine.permissionRequired ? 'bg-foreground/5 text-foreground border-border' : 'bg-muted/20 text-muted-foreground border-border'}`}>
                    <ShieldCheck className="h-4 w-4 mx-auto mb-1 opacity-60" />
                    Permission {selectedMachine.permissionRequired ? 'Required' : 'Not Required'}
                  </div>
                  <div className={`rounded-lg p-2.5 text-center text-xs font-medium border ${selectedMachine.maintenanceNeeded ? 'bg-foreground/5 text-foreground border-border' : 'bg-muted/20 text-muted-foreground border-border'}`}>
                    <Wrench className="h-4 w-4 mx-auto mb-1 opacity-60" />
                    Maintenance {selectedMachine.maintenanceNeeded ? 'Active' : 'Inactive'}
                  </div>
                </div>
                {selectedMachine.authorizationGroup && (
                  <div className="mt-2 rounded-lg p-2 text-center text-xs border border-border bg-muted/20">
                    <span className="text-muted-foreground">Auth Group: </span>
                    <span className="font-semibold">{selectedMachine.authorizationGroup}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
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

function YesNoBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-foreground bg-foreground/8">
      <Check className="h-3 w-3" strokeWidth={2.5} /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground/40 text-xs">
      <Minus className="h-3 w-3" /> No
    </span>
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
