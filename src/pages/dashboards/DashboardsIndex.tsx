import { Link } from 'react-router-dom';
import {
    BarChart3,
    AlertTriangle,
    Wrench,
    Package,
    Users,
    ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

const dashboardItems = [
    {
        path: '/dashboards/overview',
        label: 'Overview',
        description: 'High-level KPIs across all maintenance areas',
        icon: BarChart3,
    },
    {
        path: '/dashboards/nc-analytics',
        label: 'NC Analytics',
        description: 'Non-conformity trends, resolution times, and priority analysis',
        icon: AlertTriangle,
    },
    {
        path: '/dashboards/equipment-health',
        label: 'Equipment Health',
        description: 'Machine status, maintenance compliance, and aging',
        icon: Wrench,
    },
    {
        path: '/dashboards/spare-parts',
        label: 'Spare Parts',
        description: 'Inventory levels, stock alerts, and distribution',
        icon: Package,
    },
    {
        path: '/dashboards/workforce',
        label: 'Workforce',
        description: 'Operator workload and authorization coverage',
        icon: Users,
    },
];

export default function DashboardsIndex() {
    return (
        <div className="animate-in fade-in duration-300">
            <PageHeader
                title="Dashboards"
                subtitle="Select a dashboard to view analytics and KPIs."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30"
                        >
                            <div className="p-5 flex-1">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded-md bg-muted/50 text-primary">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                                </div>
                                <h3 className="font-medium text-sm mb-1 text-foreground">{item.label}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
