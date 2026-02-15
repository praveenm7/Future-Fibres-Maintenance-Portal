import { Link, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  FileBarChart,
  BarChart3,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/forms', label: 'Forms', icon: ClipboardList },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/dashboards', label: 'Dashboards', icon: BarChart3 },
  { path: '/admin', label: 'Admin', icon: Shield },
];

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname.startsWith('/admin');
    if (path === '/forms') {
      return ['/forms', '/machines', '/maintenance-plan', '/non-conformities', '/nc-comments', '/spare-parts', '/authorization-matrix', '/lists'].includes(location.pathname);
    }
    if (path === '/reports') return location.pathname.startsWith('/reports');
    if (path === '/dashboards') return location.pathname.startsWith('/dashboards');
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 min-w-[60px] transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
