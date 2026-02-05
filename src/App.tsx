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

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
