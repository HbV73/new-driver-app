import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LiveSyncProvider from "@/components/LiveSyncProvider";
import Index from "./pages/Index.tsx";
import VisitDetail from "./pages/VisitDetail.tsx";
import VisitNavigation from "./pages/VisitNavigation.tsx";
import Messages from "./pages/Messages.tsx";
import Profile from "./pages/Profile.tsx";
import RouteMap from "./pages/RouteMap.tsx";
import ScanPage from "./pages/ScanPage.tsx";
import Performance from "./pages/Performance.tsx";
import MenuPage from "./pages/MenuPage.tsx";
import Inventory from "./pages/Inventory.tsx";
import MorningFlow from "./pages/MorningFlow.tsx";
import WorkTime from "./pages/WorkTime.tsx";
import TourPlan from "./pages/TourPlan.tsx";
import Expenses from "./pages/Expenses.tsx";
import LeaveRequests from "./pages/LeaveRequests.tsx";
import Login from "./pages/Login.tsx";
import DriverID from "./pages/DriverID.tsx";
import TourOverview from "./pages/TourOverview.tsx";
import Notifications from "./pages/Notifications.tsx";
import Privacy from "./pages/Privacy.tsx";
import Settings from "./pages/Settings.tsx";
import NewCustomer from "./pages/NewCustomer.tsx";
import NotFound from "./pages/NotFound.tsx";
import BreakPage from "./pages/BreakPage.tsx";
import Fahrernachweis from "./pages/Fahrernachweis.tsx";
import PreTripInspection from "./pages/PreTripInspection.tsx";
import PostTrip from "./pages/PostTrip.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <LiveSyncProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/visit/:id" element={<ProtectedRoute><VisitNavigation /></ProtectedRoute>} />
                <Route path="/visit/:id/collect" element={<ProtectedRoute><VisitDetail /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/route" element={<ProtectedRoute><RouteMap /></ProtectedRoute>} />
                <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
                <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/morning" element={<ProtectedRoute><MorningFlow /></ProtectedRoute>} />
                <Route path="/work-time" element={<ProtectedRoute><WorkTime /></ProtectedRoute>} />
                <Route path="/tour-plan" element={<ProtectedRoute><TourPlan /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                <Route path="/leave" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
                <Route path="/driver-id" element={<ProtectedRoute><DriverID /></ProtectedRoute>} />
                <Route path="/tour-overview" element={<ProtectedRoute><TourOverview /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/new-customer" element={<ProtectedRoute><NewCustomer /></ProtectedRoute>} />
                <Route path="/break" element={<ProtectedRoute><BreakPage /></ProtectedRoute>} />
                <Route path="/fahrernachweis" element={<ProtectedRoute><Fahrernachweis /></ProtectedRoute>} />
                <Route path="/pre-trip-inspection" element={<ProtectedRoute><PreTripInspection /></ProtectedRoute>} />
                <Route path="/post-trip" element={<ProtectedRoute><PostTrip /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LiveSyncProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
