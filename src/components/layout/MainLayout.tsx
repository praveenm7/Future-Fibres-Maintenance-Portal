import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database,
  UserCog,
  Activity,
  ScrollText,
  MonitorDot,
  TrendingUp,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

interface NavLink {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  key: string;
  label: string;
  links: NavLink[];
  isActiveCheck?: (pathname: string, link: NavLink) => boolean;
}

const sections: NavSection[] = [
  {
    key: 'forms',
    label: 'Forms',
    links: [
      { path: '/machines', label: 'Machine Management', icon: Settings },
      { path: '/maintenance-plan', label: 'Maintenance Plan', icon: Wrench },
      { path: '/non-conformities', label: 'Maintenance NC\'s', icon: AlertTriangle },
      { path: '/nc-comments', label: 'NC\'s Comments', icon: MessageSquare },
      { path: '/spare-parts', label: 'Spare Parts', icon: Package },
      { path: '/authorization-matrix', label: 'Authorization Matrix', icon: Users },
      { path: '/lists', label: 'Lists Modification', icon: List },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    links: [
      { path: '/reports/machinery-list', label: 'Tooling & Machinery List', icon: LayoutDashboard },
      { path: '/reports/nc-maintenance', label: 'NC\'s Maintenance', icon: ClipboardList },
      { path: '/reports/maintenance-summary', label: 'Maintenance Summary', icon: BarChart3 },
      { path: '/reports/maintenance-plan', label: 'Maintenance Plan', icon: FileText },
      { path: '/reports/authorization', label: 'Authorization Matrix', icon: Shield },
    ],
  },
  {
    key: 'dashboards',
    label: 'Dashboards',
    links: [
      { path: '/dashboards/overview', label: 'Overview', icon: TrendingUp },
      { path: '/dashboards/nc-analytics', label: 'NC Analytics', icon: AlertTriangle },
      { path: '/dashboards/equipment-health', label: 'Equipment Health', icon: Wrench },
      { path: '/dashboards/spare-parts', label: 'Spare Parts', icon: Package },
      { path: '/dashboards/workforce', label: 'Workforce', icon: Users },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    links: [
      { path: '/admin', label: 'Admin Dashboard', icon: MonitorDot },
      { path: '/admin/database', label: 'Database Explorer', icon: Database },
      { path: '/admin/users', label: 'User Management', icon: UserCog },
      { path: '/admin/monitoring', label: 'System Monitoring', icon: Activity },
      { path: '/admin/logs', label: 'Activity Logs', icon: ScrollText },
    ],
    isActiveCheck: (pathname, link) =>
      link.path === '/admin'
        ? pathname === '/admin'
        : pathname.startsWith(link.path),
  },
];

// Determine which section contains the current path
function getActiveSectionKey(pathname: string): string | null {
  for (const section of sections) {
    const hasActive = section.links.some((link) =>
      section.isActiveCheck
        ? section.isActiveCheck(pathname, link)
        : pathname === link.path
    );
    if (hasActive) return section.key;
  }
  return null;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Track which sections are expanded; auto-expand the active one
  const activeSectionKey = getActiveSectionKey(location.pathname);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((s) => {
      initial[s.key] = s.key === activeSectionKey;
    });
    return initial;
  });

  // Keep active section expanded when route changes
  if (activeSectionKey && !expandedSections[activeSectionKey]) {
    setExpandedSections((prev) => ({ ...prev, [activeSectionKey]: true }));
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLandingPage) {
    return (
      <main className="min-h-screen bg-background">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground shadow-xl flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out border-r border-sidebar-border",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="h-16 flex items-center justify-between px-3 border-b border-sidebar-border relative">
          {isSidebarOpen ? (
            <Link to="/" className="flex items-center gap-2 group overflow-hidden whitespace-nowrap px-1">
              <div className="bg-primary/20 p-1.5 rounded-lg group-hover:bg-primary/30 transition-colors">
                <Wrench className="h-5 w-5 text-primary flex-shrink-0" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground truncate">Maintenance <span className="text-primary">Portal</span></h1>
            </Link>
          ) : (
            <Link to="/" className="mx-auto" title="Home">
              <div className="bg-primary/20 p-2 rounded-lg hover:bg-primary/30 transition-colors">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
            </Link>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 bg-background text-muted-foreground rounded-full p-1 shadow-sm hover:bg-muted transition-colors z-50 border border-border flex items-center justify-center h-6 w-6"
        >
          {isSidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-none overflow-x-hidden">
          {sections.map((section, sectionIdx) => {
            const isExpanded = expandedSections[section.key] ?? false;
            const sectionHasActive = section.key === activeSectionKey;

            return (
              <div key={section.key}>
                {sectionIdx > 0 && (
                  <div className="my-2 border-t border-sidebar-border/30 mx-4" />
                )}
                <div className="px-2 mb-1">
                  {/* Section Header - Clickable to expand/collapse */}
                  {isSidebarOpen ? (
                    <button
                      onClick={() => toggleSection(section.key)}
                      className={cn(
                        "w-full flex items-center justify-between mb-1 px-4 py-1.5 rounded-md transition-colors",
                        "hover:bg-sidebar-accent/50",
                        sectionHasActive && "text-primary"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-semibold uppercase tracking-wider truncate",
                        sectionHasActive ? "text-primary" : "text-sidebar-foreground/60"
                      )}>
                        {section.label}
                      </span>
                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200",
                        sectionHasActive ? "text-primary" : "text-sidebar-foreground/40",
                        !isExpanded && "-rotate-90"
                      )} />
                    </button>
                  ) : (
                    <div className="my-1" />
                  )}

                  {/* Links - collapsible when sidebar is expanded, always show when collapsed */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-200",
                    isSidebarOpen && !isExpanded && "max-h-0",
                    (isSidebarOpen && isExpanded) && "max-h-[500px]",
                    !isSidebarOpen && "max-h-[500px]"
                  )}>
                    <nav className="space-y-1">
                      {section.links.map((link) => {
                        const Icon = link.icon;
                        const isActive = section.isActiveCheck
                          ? section.isActiveCheck(location.pathname, link)
                          : location.pathname === link.path;
                        return (
                          <Link
                            key={link.path}
                            to={link.path}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative group",
                              isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              !isSidebarOpen && "justify-center px-0 py-3"
                            )}
                            title={!isSidebarOpen ? link.label : undefined}
                          >
                            <Icon className={cn("h-5 w-5 flex-shrink-0", !isSidebarOpen && "mx-auto")} />
                            {isSidebarOpen && <span className="truncate">{link.label}</span>}

                            {/* Tooltip for collapsed state */}
                            {!isSidebarOpen && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                {link.label}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Logo */}
        <div className={cn(
          "p-4 border-t border-sidebar-border flex items-center justify-center bg-sidebar/50",
          !isSidebarOpen && "p-2"
        )}>
          <div className="bg-white p-2 rounded-lg transition-colors w-full flex justify-center">
            <img
              src="https://www.futurefibres.com/wp-content/uploads/2025/02/Untitled-design-11.png"
              alt="Future Fibres"
              className={cn(
                "w-auto object-contain transition-all",
                isSidebarOpen ? "h-12" : "h-8"
              )}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 p-6 lg:p-10 overflow-y-auto h-screen transition-all duration-300 ease-in-out bg-background/50",
          isSidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
