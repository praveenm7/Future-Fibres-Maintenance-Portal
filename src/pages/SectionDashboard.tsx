import { Link } from 'react-router-dom';
import {
    Settings,
    Wrench,
    FileText,
    AlertTriangle,
    MessageSquare,
    Package,
    Users,
    List,
    LayoutDashboard,
    ClipboardList,
    BarChart3,
    Shield,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionDashboardProps {
    type: 'forms' | 'reports';
}

const formItems = [
    {
        path: '/machines',
        label: 'Machine Management',
        description: 'Add, modify or delete machines from the list',
        icon: Settings
    },
    {
        path: '/maintenance-plan',
        label: 'Maintenance Plan',
        description: 'Set up the maintenance plan for a machine',
        icon: Wrench
    },
    {
        path: '/non-conformities',
        label: 'Non-Conformities',
        description: 'Manage maintenance non-conformities',
        icon: AlertTriangle
    },
    {
        path: '/nc-comments',
        label: 'NC Comments',
        description: 'Manage comments for each non-conformity',
        icon: MessageSquare
    },
    {
        path: '/spare-parts',
        label: 'Spare Parts',
        description: 'Manage spare parts for each machine',
        icon: Package
    },
    {
        path: '/authorization-matrix',
        label: 'Authorization Matrix',
        description: 'Manage tooling authorization for personnel',
        icon: Users
    },
    {
        path: '/lists',
        label: 'Lists Management',
        description: 'Configure system lists and options',
        icon: List
    },
];

const reportItems = [
    {
        path: '/reports/machinery-list',
        label: 'Tooling & Machinery List',
        description: 'View the complete list of tooling and machinery',
        icon: LayoutDashboard
    },
    {
        path: '/reports/nc-maintenance',
        label: 'NC Maintenance',
        description: 'View the list of maintenance non-conformities',
        icon: ClipboardList
    },
    {
        path: '/reports/maintenance-summary',
        label: 'Maintenance Summary',
        description: 'View the summary of the maintenance plan',
        icon: BarChart3
    },
    {
        path: '/reports/maintenance-plan',
        label: 'Maintenance Plan',
        description: 'View the maintenance plan for a specific machine',
        icon: FileText
    },
    {
        path: '/reports/authorization',
        label: 'Authorization Matrix',
        description: 'View authorization list for a specific user',
        icon: Shield
    },
];

export default function SectionDashboard({ type }: SectionDashboardProps) {
    const items = type === 'forms' ? formItems : reportItems;
    const title = type === 'forms' ? 'Forms' : 'Reports';

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {title}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Select an option below to proceed.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
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
