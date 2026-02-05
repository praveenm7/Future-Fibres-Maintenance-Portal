import { ReactNode, useState, useEffect } from 'react';
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
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

const formLinks = [
  { path: '/machines', label: 'Machine Management', icon: Settings },
  { path: '/maintenance-plan', label: 'Maintenance Plan', icon: Wrench },
  { path: '/non-conformities', label: 'Maintenance NC\'s', icon: AlertTriangle },
  { path: '/nc-comments', label: 'NC\'s Comments', icon: MessageSquare },
  { path: '/spare-parts', label: 'Spare Parts', icon: Package },
  { path: '/authorization-matrix', label: 'Authorization Matrix', icon: Users },
  { path: '/lists', label: 'Lists Modification', icon: List },
];

const reportLinks = [
  { path: '/reports/machinery-list', label: 'Tooling & Machinery List', icon: LayoutDashboard },
  { path: '/reports/nc-maintenance', label: 'NC\'s Maintenance', icon: ClipboardList },
  { path: '/reports/maintenance-summary', label: 'Maintenance Summary', icon: BarChart3 },
  { path: '/reports/maintenance-plan', label: 'Maintenance Plan', icon: FileText },
  { path: '/reports/authorization', label: 'Authorization Matrix', icon: Shield },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // Initialize state based on screen size or default
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
          className="absolute -right-3 top-24 bg-primary text-primary-foreground rounded-full p-1 shadow-md hover:bg-primary/90 transition-colors z-50 border border-background flex items-center justify-center h-6 w-6"
        >
          {isSidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-none overflow-x-hidden">
          {/* Forms Section */}
          <div className="px-2 mb-2">
            {isSidebarOpen && (
              <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 animate-in fade-in duration-300 truncate">
                Forms
              </h2>
            )}
            <nav className="space-y-1">
              {formLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
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

          <div className="my-4 border-t border-sidebar-border/30 mx-4" />

          {/* Reports Section */}
          <div className="px-2 mb-2">
            {isSidebarOpen && (
              <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 animate-in fade-in duration-300 truncate">
                Reports
              </h2>
            )}
            <nav className="space-y-1">
              {reportLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
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
