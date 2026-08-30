
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Events from "./pages/Events";
import Membership from "./pages/Membership";
import PaymentSuccess from "./pages/PaymentSuccess";
import MembershipCheckout from "./pages/MembershipCheckout";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import Mission from "./pages/Mission";
import Donate from "./pages/Donate";
import DonateThankYou from "./pages/DonateThankYou";
import { ThemeProvider } from "next-themes";
import Suggestions from "./pages/Suggestions";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyEmail from "./pages/VerifyEmail";
// import Checkout from "./pages/StripeCheckout";
import { MembershipGate } from "@/components/MembershipGate";
import { AdminUsersRoute } from "@/components/admin/AdminUsersRoute";
import { AdminEventsTab } from "@/components/admin/AdminEventsTab";
import { AdminEventDetailRoute } from "@/components/admin/AdminEventDetailRoute";
import { AdminEventCreateView } from "@/components/admin/AdminEventCreateView";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminTreasuryTab } from "@/components/admin/AdminTreasuryTab";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <div className="min-h-dvh bg-background text-foreground">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={100}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <MembershipGate>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:eventSlug" element={<Events />} />
                  <Route path="/membership" element={<Membership />} />
                  <Route path="/membership/checkout" element={<MembershipCheckout />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/mission" element={<Mission />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/donate/thank-you" element={<DonateThankYou />} />
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
