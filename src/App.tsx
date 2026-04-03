import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import Units from "./pages/Units";
import Residents from "./pages/Residents";
import Inspection from "./pages/Inspection";
import Moving from "./pages/Moving";
import Payments from "./pages/Payments";
import Notices from "./pages/Notices";
import Defects from "./pages/Defects";
import CSChat from "./pages/CSChat";
import SiteSettings from "./pages/SiteSettings";
import Agreements from "./pages/Agreements";
import Vehicles from "./pages/Vehicles";
import Permits from "./pages/Permits";
import Announcements from "./pages/Announcements";
import DefectReport from "./pages/DefectReport";
import Accounts from "./pages/Accounts";
import Vendors from "./pages/Vendors";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Dashboard />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/sites" element={<Sites />} />
                    <Route path="/units" element={<Units />} />
                    <Route path="/residents" element={<Residents />} />
                    <Route path="/inspection" element={<Inspection />} />
                    <Route path="/moving" element={<Moving />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/notices" element={<Notices />} />
                    <Route path="/defects" element={<Defects />} />
                    <Route path="/cs" element={<CSChat />} />
                    <Route path="/settings" element={<SiteSettings />} />
                    <Route path="/agreements" element={<Agreements />} />
                    <Route path="/vehicles" element={<Vehicles />} />
                    <Route path="/permits" element={<Permits />} />
                    <Route path="/announcements" element={<Announcements />} />
                    <Route path="/defect-report" element={<DefectReport />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/vendors" element={<Vendors />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
