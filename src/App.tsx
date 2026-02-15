import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";

// Sections
import LandingPage from "./pages/LandingPage";
import SectionDashboard from "./pages/SectionDashboard";

// Forms Pages
import MachineManagement from "./pages/MachineManagement";
import MaintenancePlan from "./pages/MaintenancePlan";
import NonConformities from "./pages/NonConformities";
import NCComments from "./pages/NCComments";
import SpareParts from "./pages/SpareParts";
import AuthorizationMatrix from "./pages/AuthorizationMatrix";
import ListsModification from "./pages/ListsModification";

// Reports Pages
import MachineryListReport from "./pages/MachineryListReport";
import NCMaintenanceReport from "./pages/NCMaintenanceReport";
import MaintenanceSummary from "./pages/MaintenanceSummary";
import MaintenancePlanReport from "./pages/MaintenancePlanReport";
import AuthorizationReport from "./pages/AuthorizationReport";

// Dashboard Pages
import DashboardsIndex from "./pages/dashboards/DashboardsIndex";
import OverviewDashboard from "./pages/dashboards/OverviewDashboard";
import NCAnalyticsDashboard from "./pages/dashboards/NCAnalyticsDashboard";
import EquipmentHealthDashboard from "./pages/dashboards/EquipmentHealthDashboard";
import SparePartsDashboard from "./pages/dashboards/SparePartsDashboard";
import WorkforceDashboard from "./pages/dashboards/WorkforceDashboard";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import DatabaseExplorer from "./pages/admin/DatabaseExplorer";
import UserManagement from "./pages/admin/UserManagement";
import SystemMonitoring from "./pages/admin/SystemMonitoring";
import ActivityLogs from "./pages/admin/ActivityLogs";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
