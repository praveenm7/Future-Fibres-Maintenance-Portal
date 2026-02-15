import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

const ROUTE_MAP: Record<string, { label: string; section?: string }> = {
  // Forms
  '/machines': { label: 'Machine Management', section: 'Forms' },
  '/maintenance-plan': { label: 'Maintenance Plan', section: 'Forms' },
  '/non-conformities': { label: "Maintenance NC's", section: 'Forms' },
  '/nc-comments': { label: "NC's Comments", section: 'Forms' },
  '/spare-parts': { label: 'Spare Parts', section: 'Forms' },
  '/authorization-matrix': { label: 'Authorization Matrix', section: 'Forms' },
  '/lists': { label: 'Lists Modification', section: 'Forms' },
  '/maintenance-calendar': { label: 'Maintenance Calendar', section: 'Forms' },
  // Reports
  '/reports/machinery-list': { label: 'Tooling & Machinery List', section: 'Reports' },
  '/reports/nc-maintenance': { label: 'NC Maintenance', section: 'Reports' },
  '/reports/maintenance-summary': { label: 'Maintenance Summary', section: 'Reports' },
  '/reports/maintenance-plan': { label: 'Maintenance Plan', section: 'Reports' },
  '/reports/authorization': { label: 'Authorization Matrix', section: 'Reports' },
  // Dashboards
  '/dashboards/overview': { label: 'Overview', section: 'Dashboards' },
  '/dashboards/nc-analytics': { label: 'NC Analytics', section: 'Dashboards' },
  '/dashboards/equipment-health': { label: 'Equipment Health', section: 'Dashboards' },
  '/dashboards/spare-parts': { label: 'Spare Parts', section: 'Dashboards' },
  '/dashboards/workforce': { label: 'Workforce', section: 'Dashboards' },
  // Admin
  '/admin': { label: 'Admin Dashboard', section: 'Administration' },
  '/admin/database': { label: 'Database Explorer', section: 'Administration' },
  '/admin/users': { label: 'User Management', section: 'Administration' },
  '/admin/monitoring': { label: 'System Monitoring', section: 'Administration' },
  '/admin/logs': { label: 'Activity Logs', section: 'Administration' },
  // Sections
  '/forms': { label: 'Forms' },
  '/reports': { label: 'Reports' },
  '/dashboards': { label: 'Dashboards' },
};

const SECTION_PATHS: Record<string, string> = {
  'Forms': '/forms',
  'Reports': '/reports',
  'Dashboards': '/dashboards',
  'Administration': '/admin',
};

export function PageHeader({ title, subtitle, showBack = true }: PageHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeInfo = ROUTE_MAP[location.pathname];

  // Don't show back on top-level section pages
  const isTopLevel = ['/', '/forms', '/reports', '/dashboards'].includes(location.pathname);

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-6 lg:-mx-10 px-6 lg:px-10 py-4 mb-6">
      {/* Breadcrumbs */}
      {routeInfo && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {routeInfo.section && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={SECTION_PATHS[routeInfo.section] || '/'}>{routeInfo.section}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{routeInfo.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Title Row */}
      <div className="flex items-center gap-3">
        {showBack && !isTopLevel && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
