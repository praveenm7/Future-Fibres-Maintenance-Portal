import { useState } from 'react';
import {
    Package,
    PackageX,
    PackageMinus,
    Boxes,
    Factory,
} from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useDashboards } from '@/hooks/useDashboards';
import { KPICard } from '@/components/dashboards/KPICard';
import { DashboardShell } from '@/components/dashboards/DashboardShell';
import { ChartCard } from '@/components/dashboards/ChartCard';
import { DashboardFiltersBar } from '@/components/dashboards/DashboardFilters';
import type { DashboardFilters } from '@/types/dashboards';

const STOCK_COLORS: Record<string, string> = {
    'Out of Stock': 'hsl(0, 84%, 60%)',
    'Low (1-2)': 'hsl(48, 96%, 51%)',
    'Adequate (3-5)': 'hsl(199, 89%, 48%)',
    'Good (6+)': 'hsl(142, 76%, 36%)',
};

const AREA_COLORS = [
    'hsl(221, 83%, 53%)',
    'hsl(142, 76%, 36%)',
    'hsl(48, 96%, 51%)',
    'hsl(0, 84%, 60%)',
    'hsl(199, 89%, 48%)',
    'hsl(280, 65%, 60%)',
];

export default function SparePartsDashboard() {
    const [filters, setFilters] = useState<DashboardFilters>({});
    const { useSparePartsAnalytics } = useDashboards();
    const { data, isLoading } = useSparePartsAnalytics(filters);

    return (
        <DashboardShell
            title="SPARE PARTS & INVENTORY"
            subtitle="Inventory levels, stock alerts, and distribution across machines"
            filters={
                <DashboardFiltersBar
                    filters={filters}
                    onFiltersChange={setFilters}
                    showAreaFilter
                    showTypeFilter={false}
                />
            }
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <KPICard
                    title="Total Part Types"
                    value={data?.kpis.totalPartTypes ?? 0}
                    icon={Package}
                    colorClass="text-primary"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Out of Stock"
                    value={data?.kpis.outOfStock ?? 0}
                    icon={PackageX}
                    colorClass="text-destructive"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Low Stock"
                    value={data?.kpis.lowStock ?? 0}
                    icon={PackageMinus}
                    colorClass="text-warning"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Total Units"
                    value={data?.kpis.totalUnits ?? 0}
                    icon={Boxes}
                    colorClass="text-info"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Machines w/ Parts"
                    value={data?.kpis.machinesWithParts ?? 0}
                    icon={Factory}
                    colorClass="text-success"
                    isLoading={isLoading}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Stock Level Distribution">
                    {data?.stockDistribution && data.stockDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.stockDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="count"
                                    nameKey="level"
                                    label={({ level, count }) => `${level}: ${count}`}
                                    labelLine={false}
                                >
                                    {data.stockDistribution.map((entry) => (
                                        <Cell key={entry.level} fill={STOCK_COLORS[entry.level] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    )}
                </ChartCard>

                <ChartCard title="Spare Parts per Area">
                    {data?.partsPerArea && data.partsPerArea.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.partsPerArea}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="area" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="totalQuantity" name="Total Quantity" radius={[4, 4, 0, 0]}>
                                    {data.partsPerArea.map((_, i) => (
                                        <Cell key={i} fill={AREA_COLORS[i % AREA_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard title="Top 10 Machines by Spare Parts">
                    {data?.topMachinesByParts && data.topMachinesByParts.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topMachinesByParts} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis type="category" dataKey="finalCode" tick={{ fontSize: 10 }} width={80} />
                                <Tooltip />
                                <Bar dataKey="partCount" name="Parts" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No data available
                        </div>
                    )}
                </ChartCard>

                {/* Out of Stock Table */}
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="section-header">Out-of-Stock Items</div>
                    <div className="p-4 overflow-auto" style={{ height: 300 }}>
                        {data?.outOfStockItems && data.outOfStockItems.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground uppercase">Machine</th>
                                        <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground uppercase">Part</th>
                                        <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground uppercase">Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.outOfStockItems.map((item, i) => (
                                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                            <td className="py-2 px-2 text-xs font-medium">{item.machineCode}</td>
                                            <td className="py-2 px-2 text-xs">{item.partDescription}</td>
                                            <td className="py-2 px-2 text-xs text-muted-foreground">{item.reference || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                No out-of-stock items
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
