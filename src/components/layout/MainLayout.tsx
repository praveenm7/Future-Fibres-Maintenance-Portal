import { ReactNode } from 'react';
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
  Shield
} from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const formLinks = [
  { path: '/machines', label: '01-MACHINE MANAGEMENT', icon: Settings },
  { path: '/maintenance-plan', label: '02-MAINTENANCE PLAN', icon: Wrench },
  { path: '/non-conformities', label: '03-MAINTENANCE NC\'S', icon: AlertTriangle },
  { path: '/nc-comments', label: '04-NC\'S COMMENTS', icon: MessageSquare },
  { path: '/spare-parts', label: '05-SPARE PARTS', icon: Package },
  { path: '/authorization-matrix', label: '06-AUTHORIZATION MATRIX', icon: Users },
  { path: '/lists', label: '07-LISTS MODIFICATION', icon: List },
];

const reportLinks = [
  { path: '/reports/machinery-list', label: '01-TOOLING & MACHINERY LIST', icon: LayoutDashboard },
  { path: '/reports/nc-maintenance', label: '02-NC\'S MAINTENANCE', icon: ClipboardList },
  { path: '/reports/maintenance-summary', label: '03-MAINTENANCE SUMMARY', icon: BarChart3 },
  { path: '/reports/maintenance-plan', label: '04-MAINTENANCE PLAN', icon: FileText },
  { path: '/reports/authorization', label: '05-AUTHORIZATION MATRIX', icon: Shield },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-lg">
        <Link to="/" className="flex items-center gap-3">
          <Wrench className="h-8 w-8" />
          <h1 className="text-xl font-bold tracking-wide">MAINTENANCE DATABASE</h1>
        </Link>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-72 min-h-[calc(100vh-72px)] bg-secondary text-secondary-foreground shadow-xl">
          {/* Forms Section */}
          <div className="py-4">
            <div className="px-4 py-2 bg-destructive text-destructive-foreground font-bold text-sm uppercase tracking-wider">
              Forms
            </div>
            <nav className="mt-1">
              {formLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-sidebar-accent ${
                      isActive ? 'bg-sidebar-accent border-l-4 border-primary' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Reports Section */}
          <div className="py-4 border-t border-sidebar-border">
            <div className="px-4 py-2 bg-info text-info-foreground font-bold text-sm uppercase tracking-wider">
              Reports
            </div>
            <nav className="mt-1">
              {reportLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:bg-sidebar-accent ${
                      isActive ? 'bg-sidebar-accent border-l-4 border-primary' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 text-info" />
                    <span className="text-xs font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
