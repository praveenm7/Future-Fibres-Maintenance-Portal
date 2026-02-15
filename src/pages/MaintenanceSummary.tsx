import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReportToolbar } from '@/components/ui/ReportToolbar';
import { useDashboard } from '@/hooks/useDashboard';
import { useMachines } from '@/hooks/useMachines';
import { exportToExcel, getExportTimestamp } from '@/lib/exportExcel';
import { Loader2 } from 'lucide-react';

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export default function MaintenanceSummary() {
  const [periodicity, setPeriodicity] = useState('WEEKLY');
  const { useGetMaintenanceReport } = useDashboard();
  const { useGetMachines } = useMachines();

  const { data: machines = [], isLoading: loadingMachines } = useGetMachines();
  const { data: reportData = [], isLoading: loadingReport } = useGetMaintenanceReport(periodicity);

  const isLoading = loadingMachines || loadingReport;

  // Merge report data with machine info
  const displayData = machines.map(machine => {
    const machineReport = reportData.find(r => r.machineId === machine.id) || {
      efficiency: 0,
      weeklyData: new Array(48).fill(0)
    };

    return {
      machine,
      efficiency: machineReport.efficiency,
      weeklyData: machineReport.weeklyData || new Array(48).fill(0)
    };
  });

  if (isLoading && machines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading maintenance summary...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Maintenance Summary" />

      <div className="mb-4 flex gap-4 items-center">
        <label className="text-sm font-medium">Periodicity:</label>
        <select
          value={periodicity}
          onChange={(e) => setPeriodicity(e.target.value)}
          className="bg-card border border-border rounded px-3 py-1 text-sm"
        >
          <option value="WEEKLY">WEEKLY</option>
          <option value="MONTHLY">MONTHLY</option>
          <option value="YEARLY">YEARLY</option>
        </select>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <ReportToolbar
          onExportExcel={() => {
            const weekHeaders = Array.from({ length: 48 }, (_, i) => `W${i + 1}`);
            exportToExcel({
              filename: `Maintenance_Summary_${periodicity}_${getExportTimestamp()}`,
              sheets: [{
                name: 'Maintenance Summary',
                headers: ['Machine Code', 'Description', 'Area', 'Efficiency %', ...weekHeaders],
                rows: [
                  ...displayData.map(({ machine, efficiency, weeklyData }) => [
                    machine.finalCode, machine.description, machine.area, efficiency,
                    ...weeklyData
                  ]),
                  [],
                  ['Legend:', '0 = Not Completed', '1 = Completed', '2 = Partial/Mandatory']
                ],
                columnWidths: [15, 25, 12, 12, ...new Array(48).fill(5)],
              }],
            });
          }}
          className="ml-auto"
        />
      </div>

      <div className="relative isolate overflow-x-auto border border-border rounded-lg">
        <table className="data-table text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 !bg-muted z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">MACHINE CODE</th>
              <th className="sticky left-[100px] !bg-muted z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">DESCRIPTION</th>
              <th>AREA</th>
              <th>EFFICIENCY</th>
              {months.map((month) => (
                <th key={month} colSpan={4} className="text-center border-l border-border/50">
                  {month.toUpperCase()}-25
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={52} className="text-center p-8 text-muted-foreground">
                  No maintenance records found.
                </td>
              </tr>
            ) : (
              displayData.map(({ machine, efficiency, weeklyData }, index) => (
                <tr key={machine.id}>
                  <td className={`sticky left-0 z-20 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${index % 2 === 1 ? '!bg-muted' : '!bg-card'}`}>{machine.finalCode}</td>
                  <td className={`sticky left-[100px] z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${index % 2 === 1 ? '!bg-muted' : '!bg-card'}`}>{machine.description}</td>
                  <td>{machine.area}</td>
                  <td className={`font-bold ${efficiency >= 80 ? 'text-success' :
                      efficiency >= 60 ? 'text-warning' :
                        'text-destructive'
                    }`}>
                    {efficiency}%
                  </td>
                  {weeklyData.map((value: number, idx: number) => (
                    <td
                      key={idx}
                      className={`text-center border-l border-border/10 ${value === 1 ? 'bg-success/30' :
                          value === 2 ? 'bg-warning/30' :
                            value === 0 ? 'bg-destructive/30' : 'bg-muted/10'
                        }`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-card border border-border rounded">
        <p className="text-sm text-muted-foreground italic">
          Fill the cells for each week with "ideal" or "mandatory".
          Ideal (1) counts as 100% of the maintenance for this week.
          Mandatory (2) counts as 50% of maintenance for this week.
        </p>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success/30 border border-success rounded"></div>
            <span className="text-sm">Completed (1)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning/30 border border-warning rounded"></div>
            <span className="text-sm">Partial/Mandatory (2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-destructive/30 border border-destructive rounded"></div>
            <span className="text-sm">Not Completed (0)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
