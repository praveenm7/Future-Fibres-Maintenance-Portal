import { Link } from 'react-router-dom';
import {
  Settings,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Package,
  Users,
  List,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  FileText,
  Shield
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';

const formItems = [
  {
    path: '/machines',
    label: '01-MACHINE MANAGEMENT',
    description: 'ADD/MODIFY A NEW MACHINE ON THE LIST',
    icon: Settings
  },
  {
    path: '/maintenance-plan',
    label: '02-MAINTENANCE PLAN CREATION/MODIFICATION',
    description: 'SETUP THE MAINTENANCE PLAN FOR A MACHINE',
    icon: Wrench
  },
  {
    path: '/non-conformities',
    label: '03-MAINTENANCE NO CONFORMITIES',
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

export default function Dashboard() {
  const { useGetStats } = useDashboard();
  const { data: stats, isLoading: loadingStats } = useGetStats();

  return (
    <div>
      {/* Header */}
      <div className="page-header mb-8 inline-block">
        MAINTENANCE DATABASE: MENU
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
          <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Machines</div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-primary">{stats?.totalMachines || 0}</div>
          )}
        </div>
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
          <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Active NCs</div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-destructive">{stats?.activeNCs || 0}</div>
          )}
        </div>
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
          <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Pending Actions</div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-info">{stats?.pendingActions || 0}</div>
          )}
        </div>
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
          <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Critical Spare Parts</div>
          {loadingStats ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-warning">{stats?.criticalSpareParts || 0}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Forms Section */}
        <div>
          <div className="bg-success text-success-foreground px-4 py-2 font-bold text-lg uppercase mb-4">
            FORMS
          </div>
          <div className="space-y-2">
            {formItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-4 group"
                >
                  <div className="menu-button-forms flex items-center gap-3 flex-1 group-hover:opacity-90 transition-opacity">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  <div className="bg-card text-foreground px-4 py-3 text-sm italic border border-border flex-1 hidden md:block">
                    {item.description}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Reports Section */}
        <div>
          <div className="bg-info text-info-foreground px-4 py-2 font-bold text-lg uppercase mb-4">
            REPORTS
          </div>
          <div className="space-y-2">
            {reportItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-4 group"
                >
                  <div className="menu-button-reports flex items-center gap-3 flex-1 group-hover:opacity-90 transition-opacity">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  <div className="bg-card text-foreground px-4 py-3 text-sm italic border border-border flex-1 hidden md:block">
                    {item.description}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
