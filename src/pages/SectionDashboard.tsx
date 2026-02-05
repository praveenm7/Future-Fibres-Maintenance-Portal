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
import { cn } from '@/lib/utils'; // Assuming you have a utils file for cn

interface SectionDashboardProps {
    type: 'forms' | 'reports';
}

const formItems = [
    {
        path: '/machines',
        label: '01-MACHINE MANAGEMENT',
        description: 'ADD/MODIFY A NEW MACHINE ON THE LIST',
        icon: Settings
    },
    {
        path: '/maintenance-plan',
        label: '02-MAINTENANCE PLAN',
        description: 'SETUP THE MAINTENANCE PLAN FOR A MACHINE',
        icon: Wrench
    },
    {
        path: '/non-conformities',
        label: '03-MAINTENANCE NC\'S',
        description: 'MANAGE MAINTENANCE NO CONFORMITIES',
        icon: AlertTriangle
    },
    {
        path: '/nc-comments',
        label: '04-NC\'S COMMENTS',
        description: 'MANAGE COMMENTS FOR EACH NC',
        icon: MessageSquare
    },
    {
        path: '/spare-parts',
        label: '05-SPARE PARTS',
        description: 'MANAGE SPARE PARTS FOR EACH MACHINE',
        icon: Package
    },
    {
        path: '/authorization-matrix',
        label: '06-AUTHORIZATION MATRIX',
        description: 'MANAGE AUTHORIZATION TOOLING FOR PERSONAL',
        icon: Users
    },
    {
        path: '/lists',
        label: '07-LISTS MODIFICATION',
        description: 'MANAGE LISTS',
        icon: List
    },
];

const reportItems = [
    {
        path: '/reports/machinery-list',
        label: '01-TOOLING & MACHINERY LIST',
        description: 'SHOW THE MAIN LIST OF TOOLING & MACHINERY',
        icon: LayoutDashboard
    },
    {
        path: '/reports/nc-maintenance',
        label: '02-NC\'S MAINTENANCE',
        description: 'SHOW THE MAIN LIST OF MAINTENANCE NC\'S',
        icon: ClipboardList
    },
    {
        path: '/reports/maintenance-summary',
        label: '03-MAINTENANCE SUMMARY',
        description: 'SHOW THE SUMMARY OF THE MAINTENANCE PLAN',
        icon: BarChart3
    },
    {
        path: '/reports/maintenance-plan',
        label: '04-MAINTENANCE PLAN',
        description: 'SHOW FOR A SPECIFIC MACHINE THE MAINTENANCE PLAN',
        icon: FileText
    },
    {
        path: '/reports/authorization',
        label: '05-AUTHORIZATION MATRIX',
        description: 'SHOW AUTHORIZATION MACHINE LIST FOR A SPECIFIC USER',
        icon: Shield
    },
];

export default function SectionDashboard({ type }: SectionDashboardProps) {
    const items = type === 'forms' ? formItems : reportItems;
    const title = type === 'forms' ? 'FORMS' : 'REPORTS';
    const themeColor = type === 'forms' ? 'text-primary border-primary/20 bg-primary/5' : 'text-info border-info/20 bg-info/5';
    const iconColor = type === 'forms' ? 'text-primary' : 'text-info';

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className={cn("text-3xl font-bold tracking-tight uppercase", type === 'forms' ? 'text-primary' : 'text-info')}>
                    {title} DASHBOARD
                </h1>
                <p className="text-muted-foreground mt-2">
                    Select an option below to proceed.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className={cn("p-6 flex-1", themeColor)}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn("p-2 rounded-lg bg-background shadow-sm", iconColor)}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <ArrowRight className={cn("h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300", iconColor)} />
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-foreground">{item.label}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
