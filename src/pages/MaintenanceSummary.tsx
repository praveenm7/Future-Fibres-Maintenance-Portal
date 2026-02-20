import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReportToolbar } from '@/components/ui/ReportToolbar';
import { useDashboard } from '@/hooks/useDashboard';
import { exportToExcel, getExportTimestamp } from '@/lib/exportExcel';
import { Loader2 } from 'lucide-react';

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export default function MaintenanceSummary() {
  const currentYear = new Date().getFullYear();
  const [periodicity, setPeriodicity] = useState('WEEKLY');
  const [year, setYear] = useState(currentYear);
  const { useGetMaintenanceSummary } = useDashboard();

  const { data: summaryData = [], isLoading } = useGetMaintenanceSummary(periodicity, year);

  if (isLoading && summaryData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading maintenance summary...</p>
      </div>
    );
  }

  const yearSuffix = String(year).slice(-2);

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
          <option value="QUARTERLY">QUARTERLY</option>
          <option value="YEARLY">YEARLY</option>
        </select>

        <label className="text-sm font-medium">Year:</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-card border border-border rounded px-3 py-1 text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <ReportToolbar
          onExportExcel={() => {
            const weekHeaders = Array.from({ length: 48 }, (_, i) => `W${i + 1}`);
            exportToExcel({
              filename: `Maintenance_Summary_${periodicity}_${year}_${getExportTimestamp()}`,
              sheets: [{
                name: 'Maintenance Summary',
                headers: ['Machine Code', 'Description', 'Area', 'Efficiency %', ...weekHeaders],
                rows: [
                  ...summaryData.map(row => [
                    row.finalCode, row.description, row.area,
                    row.efficiency === -1 ? 'N/A' : row.efficiency,
                    ...row.weeklyData.map(v => v === -1 ? '' : v)
                  ]),
                  [],
                  ['Legend:', '0 = Not Completed', '1 = All Completed (100%)', '2 = Mandatory Only (50%)']
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
                  {month.toUpperCase()}-{yearSuffix}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaryData.length === 0 ? (
              <tr>
                <td colSpan={52} className="text-center p-8 text-muted-foreground">
                  No maintenance records found.
                </td>
              </tr>
            ) : (
              summaryData.map((row, index) => (
                <tr key={row.machineId}>
                  <td className={`sticky left-0 z-20 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${index % 2 === 1 ? '!bg-muted' : '!bg-card'}`}>{row.finalCode}</td>
                  <td className={`sticky left-[100px] z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${index % 2 === 1 ? '!bg-muted' : '!bg-card'}`}>{row.description}</td>
                  <td>{row.area}</td>
                  <td className={`font-bold ${
                    row.efficiency === -1 ? 'text-muted-foreground' :
                    row.efficiency >= 80 ? 'text-success' :
                    row.efficiency >= 60 ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {row.efficiency === -1 ? 'N/A' : `${row.efficiency}%`}
                  </td>
                  {row.weeklyData.map((value: number, idx: number) => (
                    <td
                      key={idx}
                      className={`text-center border-l border-border/10 ${
                        value === 1 ? 'bg-success/30' :
                        value === 2 ? 'bg-warning/30' :
                        value === 0 ? 'bg-destructive/30' : 'bg-muted/10'
                      }`}
                    >
                      {value === -1 ? '' : value}
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
          Each cell represents a week within the month. The value indicates the level of maintenance completion.
          Ideal actions count as 100% and mandatory actions count as 50% of the maintenance for each week.
        </p>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success/30 border border-success rounded"></div>
            <span className="text-sm">All Completed (1) = 100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning/30 border border-warning rounded"></div>
            <span className="text-sm">Mandatory Only (2) = 50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-destructive/30 border border-destructive rounded"></div>
            <span className="text-sm">Not Completed (0) = 0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted/30 border border-muted rounded"></div>
            <span className="text-sm">No Data / Future</span>
          </div>
        </div>
      </div>
    </div>
  );
}
