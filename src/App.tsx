import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import MainLayout from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages — code-split for smaller initial bundle
const LandingPage = lazy(() => import("./pages/LandingPage"));
const SectionDashboard = lazy(() => import("./pages/SectionDashboard"));

// Forms Pages
const MachineManagement = lazy(() => import("./pages/MachineManagement"));
const MaintenancePlan = lazy(() => import("./pages/MaintenancePlan"));
const NonConformities = lazy(() => import("./pages/NonConformities"));
const NCComments = lazy(() => import("./pages/NCComments"));
const SpareParts = lazy(() => import("./pages/SpareParts"));
const AuthorizationMatrix = lazy(() => import("./pages/AuthorizationMatrix"));
const ListsModification = lazy(() => import("./pages/ListsModification"));
const MaintenanceCalendar = lazy(() => import("./pages/MaintenanceCalendar"));

// Reports Pages
const MachineryListReport = lazy(() => import("./pages/MachineryListReport"));
const NCMaintenanceReport = lazy(() => import("./pages/NCMaintenanceReport"));
const MaintenanceSummary = lazy(() => import("./pages/MaintenanceSummary"));
const MaintenancePlanReport = lazy(() => import("./pages/MaintenancePlanReport"));
const AuthorizationReport = lazy(() => import("./pages/AuthorizationReport"));

// Dashboard Pages
const DashboardsIndex = lazy(() => import("./pages/dashboards/DashboardsIndex"));
const OverviewDashboard = lazy(() => import("./pages/dashboards/OverviewDashboard"));
const NCAnalyticsDashboard = lazy(() => import("./pages/dashboards/NCAnalyticsDashboard"));
const EquipmentHealthDashboard = lazy(() => import("./pages/dashboards/EquipmentHealthDashboard"));
const SparePartsDashboard = lazy(() => import("./pages/dashboards/SparePartsDashboard"));
const WorkforceDashboard = lazy(() => import("./pages/dashboards/WorkforceDashboard"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const DatabaseExplorer = lazy(() => import("./pages/admin/DatabaseExplorer"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const SystemMonitoring = lazy(() => import("./pages/admin/SystemMonitoring"));
const ActivityLogs = lazy(() => import("./pages/admin/ActivityLogs"));

const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: 5 * 60 * 1000,        // 5 minutes
      gcTime: 30 * 60 * 1000,           // 30 minutes
      retry: (failureCount, _error) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      networkMode: 'always',
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing Page - Sidebar Hidden */}
          <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />

          {/* Section Dashboards - Sidebar Visible */}
          <Route path="/forms" element={<MainLayout><SectionDashboard type="forms" /></MainLayout>} />
          <Route path="/reports" element={<MainLayout><SectionDashboard type="reports" /></MainLayout>} />

          {/* Forms */}
          <Route path="/machines" element={<MainLayout><MachineManagement /></MainLayout>} />
          <Route path="/maintenance-plan" element={<MainLayout><MaintenancePlan /></MainLayout>} />
          <Route path="/non-conformities" element={<MainLayout><NonConformities /></MainLayout>} />
          <Route path="/nc-comments" element={<MainLayout><NCComments /></MainLayout>} />
          <Route path="/spare-parts" element={<MainLayout><SpareParts /></MainLayout>} />
          <Route path="/authorization-matrix" element={<MainLayout><AuthorizationMatrix /></MainLayout>} />
          <Route path="/lists" element={<MainLayout><ListsModification /></MainLayout>} />
          <Route path="/maintenance-calendar" element={<MainLayout><MaintenanceCalendar /></MainLayout>} />

          {/* Reports */}
          <Route path="/reports/machinery-list" element={<MainLayout><MachineryListReport /></MainLayout>} />
          <Route path="/reports/nc-maintenance" element={<MainLayout><NCMaintenanceReport /></MainLayout>} />
          <Route path="/reports/maintenance-summary" element={<MainLayout><MaintenanceSummary /></MainLayout>} />
          <Route path="/reports/maintenance-plan" element={<MainLayout><MaintenancePlanReport /></MainLayout>} />
          <Route path="/reports/authorization" element={<MainLayout><AuthorizationReport /></MainLayout>} />

          {/* Dashboards */}
          <Route path="/dashboards" element={<MainLayout><DashboardsIndex /></MainLayout>} />
          <Route path="/dashboards/overview" element={<MainLayout><OverviewDashboard /></MainLayout>} />
          <Route path="/dashboards/nc-analytics" element={<MainLayout><NCAnalyticsDashboard /></MainLayout>} />
          <Route path="/dashboards/equipment-health" element={<MainLayout><EquipmentHealthDashboard /></MainLayout>} />
          <Route path="/dashboards/spare-parts" element={<MainLayout><SparePartsDashboard /></MainLayout>} />
          <Route path="/dashboards/workforce" element={<MainLayout><WorkforceDashboard /></MainLayout>} />

          {/* Admin */}
          <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
          <Route path="/admin/database" element={<MainLayout><DatabaseExplorer /></MainLayout>} />
          <Route path="/admin/users" element={<MainLayout><UserManagement /></MainLayout>} />
          <Route path="/admin/monitoring" element={<MainLayout><SystemMonitoring /></MainLayout>} />
          <Route path="/admin/logs" element={<MainLayout><ActivityLogs /></MainLayout>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
