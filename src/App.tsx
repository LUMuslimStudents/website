
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import About from "./pages/About";
import Index from "./pages/Index";
import Events from "./pages/Events";
import Membership from "./pages/Membership";
import PaymentSuccess from "./pages/PaymentSuccess";
import MembershipCheckout from "./pages/MembershipCheckout";
import NotFound from "./pages/NotFound";
import Mission from "./pages/Mission";
import Governance from "./pages/Governance";
import HalalMap from "./pages/HalalMap";
import AdhanSchedule from "./pages/PrayerTimes";
import Donate from "./pages/Donate";
import DonateThankYou from "./pages/DonateThankYou";
import Collaborate from "./pages/Collaborate";
import { ThemeProvider } from "next-themes";
import Suggestions from "./pages/Suggestions";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyEmail from "./pages/VerifyEmail";
import { MembershipGate } from "@/components/MembershipGate";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdminUsersRoute } from "@/components/admin/AdminUsersRoute";
import { AdminEventsTab } from "@/components/admin/AdminEventsTab";
import { AdminEventDetailRoute } from "@/components/admin/AdminEventDetailRoute";
import { AdminEventCreateView } from "@/components/admin/AdminEventCreateView";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminTreasuryTab } from "@/components/admin/AdminTreasuryTab";
import PrayerRooms from "./pages/PrayerRooms";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <div className="min-h-dvh bg-background text-foreground">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={100}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <MembershipGate>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:eventSlug" element={<Events />} />
                  <Route path="/membership" element={<Membership />} />
                  <Route path="/membership/checkout" element={<MembershipCheckout />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/mission" element={<Mission />} />
                  <Route path="/by-laws" element={<Governance />} />
                  <Route path="/resources/halal-map" element={<HalalMap />} />
                  <Route path="/resources/prayer-times" element={<AdhanSchedule />} />
                  <Route path="/resources/prayer-rooms" element={<PrayerRooms />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/donate/thank-you" element={<DonateThankYou />} />
                  <Route path="/collaborate" element={<Collaborate />} />
                  <Route path="/suggestions" element={<Suggestions />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin" element={<AdminDashboard />}>
                    <Route index element={<Navigate to="users" replace />} />
                    <Route path="users" element={<AdminUsersRoute />} />
                    <Route path="events" element={<AdminEventsTab />} />
                    <Route path="events/new" element={<AdminEventCreateView />} />
                    <Route path="events/:eventId/edit" element={<AdminEventCreateView />} />
                    <Route path="events/:eventId" element={<AdminEventDetailRoute />} />
                    <Route path="settings" element={<AdminSettingsTab />} />
                    <Route path="treasury" element={<AdminTreasuryTab />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MembershipGate>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  </ThemeProvider>
);

export default App;
