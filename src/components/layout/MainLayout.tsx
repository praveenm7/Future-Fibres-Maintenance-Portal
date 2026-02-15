import { ReactNode, useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Search,
  X,
  Calendar,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BottomNav } from '@/components/layout/BottomNav';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

interface NavLink {
  path: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: string;
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
      { path: '/non-conformities', label: 'Maintenance NC\'s', icon: AlertTriangle, badgeKey: 'nonConformities' },
      { path: '/nc-comments', label: 'NC\'s Comments', icon: MessageSquare },
      { path: '/spare-parts', label: 'Spare Parts', icon: Package, badgeKey: 'spareParts' },
      { path: '/authorization-matrix', label: 'Authorization Matrix', icon: Users },
      { path: '/lists', label: 'Lists Modification', icon: List },
      { path: '/maintenance-calendar', label: 'Maintenance Calendar', icon: Calendar },
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
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Badge counts (only fetch when sidebar is open)
  const badges = useSidebarBadges(isSidebarOpen);

  // Online/offline status
  const isOnline = useOnlineStatus();

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

  // Filter nav links based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        links: section.links.filter((link) =>
          link.label.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.links.length > 0);
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ to focus sidebar search
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        if (!isSidebarOpen) setIsSidebarOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      // Ctrl+1-4 to navigate sections
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        const sectionKeys = ['forms', 'reports', 'dashboards', 'admin'];
        const sectionPaths = ['/forms', '/reports', '/dashboards', '/admin'];
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
          e.preventDefault();
          navigate(sectionPaths[num - 1]);
          setExpandedSections((prev) => ({ ...prev, [sectionKeys[num - 1]]: true }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, navigate]);

  if (isLandingPage) {
    return (
      <main className="min-h-screen bg-background">
        {children}
      </main>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar Navigation - hidden on mobile */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground shadow-xl flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out border-r border-sidebar-border hidden md:flex",
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

        {/* Sidebar Search */}
        {isSidebarOpen && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search... (Ctrl+/)"
                className="w-full h-8 pl-8 pr-7 text-xs rounded-md bg-sidebar-accent/50 border border-sidebar-border/50 text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:outline-none focus:ring-1 focus:ring-sidebar-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4 scrollbar-none overflow-x-hidden">
          {filteredSections.map((section, sectionIdx) => {
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
                    isSidebarOpen && !isExpanded && !searchQuery && "max-h-0",
                    (isSidebarOpen && (isExpanded || searchQuery)) && "max-h-[500px]",
                    !isSidebarOpen && "max-h-[500px]"
                  )}>
                    <nav className="space-y-1">
                      {section.links.map((link) => {
                        const Icon = link.icon;
                        const isActive = section.isActiveCheck
                          ? section.isActiveCheck(location.pathname, link)
                          : location.pathname === link.path;
                        const badgeCount = link.badgeKey ? (badges as Record<string, number | undefined>)[link.badgeKey] : undefined;

                        return (
                          <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setSearchQuery('')}
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
                            {isSidebarOpen && (
                              <>
                                <span className="truncate flex-1">{link.label}</span>
                                {badgeCount != null && badgeCount > 0 && (
                                  <span className={cn(
                                    "ml-auto text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1",
                                    isActive
                                      ? "bg-white/20 text-white"
                                      : "bg-destructive/15 text-destructive"
                                  )}>
                                    {badgeCount > 99 ? '99+' : badgeCount}
                                  </span>
                                )}
                              </>
                            )}

                            {/* Badge dot for collapsed state */}
                            {!isSidebarOpen && badgeCount != null && badgeCount > 0 && (
                              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                            )}

                            {/* Tooltip for collapsed state */}
                            {!isSidebarOpen && (
                              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                {link.label}
                                {badgeCount != null && badgeCount > 0 && (
                                  <span className="ml-1.5 text-destructive font-semibold">({badgeCount})</span>
                                )}
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

          {/* No results for search */}
          {searchQuery && filteredSections.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Search className="h-5 w-5 mx-auto mb-2 text-sidebar-foreground/20" />
              <p className="text-xs text-sidebar-foreground/40">No pages found</p>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <div className={cn(
          "px-4 py-2 border-t border-sidebar-border/30 flex items-center",
          isSidebarOpen ? "justify-between" : "justify-center"
        )}>
          {isSidebarOpen && (
            <span className="text-xs text-sidebar-foreground/50">Theme</span>
          )}
          <ThemeToggle className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
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
          "flex-1 flex flex-col min-h-0 transition-[margin-left] duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-64" : "md:ml-16"
        )}
      >
        {!isOnline && (
          <div className="flex-shrink-0 px-4 md:px-6 lg:px-10 pt-3">
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/15 border border-amber-500/30 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>You are offline. Showing cached data.</span>
            </div>
          </div>
        )}

        {/* Page header renders here via portal — outside the scroll container */}
        <div id="page-header-slot" className="flex-shrink-0" />

        {/* Scrollable content area — no horizontal padding so scrollbar stays at right edge */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-background/50">
          <div className="px-4 md:px-6 lg:px-8 pt-6 pb-20 md:pb-6 lg:pb-10 flex flex-col min-h-full">
            <div className="content-max-width flex-1 flex flex-col">
              {children}
            </div>
            <div className="py-4 text-center mt-8">
              <p className="text-xs text-muted-foreground/50">
                Powered by North Technology Group Data Team
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - mobile only */}
      <BottomNav />
    </div>
  );
}
