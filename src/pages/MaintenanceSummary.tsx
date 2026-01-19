import { PageHeader } from '@/components/ui/PageHeader';
import { machines, maintenanceActions } from '@/data/mockData';

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Generate mock efficiency data
const generateEfficiencyData = () => {
  return machines.map(machine => {
    const weeklyData: number[] = [];
    const baseEfficiency = 50 + Math.random() * 40;
    
    // 48 weeks (4 per month)
    for (let i = 0; i < 48; i++) {
      const completed = Math.random() > (1 - baseEfficiency / 100);
      weeklyData.push(completed ? 1 : 0);
    }
    
    const totalCompleted = weeklyData.filter(v => v === 1).length;
    const efficiency = ((totalCompleted / 48) * 100).toFixed(2);
    
    return {
      machine,
      efficiency,
      weeklyData,
    };
  });
};

export default function MaintenanceSummary() {
  const efficiencyData = generateEfficiencyData();

  return (
    <div>
      <PageHeader title="03-MAINTENANCE SUMMARY" />

      <div className="overflow-x-auto">
        <table className="data-table text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-table-header z-10">MACHINE CODE</th>
              <th className="sticky left-[100px] bg-table-header z-10">DESCRIPTION</th>
              <th>AREA</th>
              <th>EFFICIENCY</th>
              {months.map((month, idx) => (
                <th key={month} colSpan={4} className="text-center">
                  {month.toUpperCase()}-25
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {efficiencyData.map(({ machine, efficiency, weeklyData }) => (
              <tr key={machine.id}>
                <td className="sticky left-0 bg-card z-10 font-medium">{machine.finalCode}</td>
                <td className="sticky left-[100px] bg-card z-10">{machine.description}</td>
                <td>{machine.area}</td>
                <td className={`font-bold ${
                  parseFloat(efficiency) >= 80 ? 'text-success' :
                  parseFloat(efficiency) >= 60 ? 'text-warning' :
                  'text-destructive'
                }`}>
                  {efficiency}%
                </td>
                {weeklyData.map((value, idx) => (
                  <td 
                    key={idx} 
                    className={`text-center ${
                      value === 1 ? 'bg-success/30' : 'bg-destructive/30'
                    }`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-card border border-border rounded">
        <p className="text-sm text-muted-foreground italic">
          Fill the cells for each week with "ideal" or "mandatory". 
          Ideal counts as 100% of the maintenance for this week. 
          Mandatory counts as 50% of maintenance for this week.
        </p>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success/30 border border-success rounded"></div>
            <span className="text-sm">Completed (1)</span>
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
