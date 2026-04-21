
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Events from "./pages/Events";
import Membership from "./pages/Membership";
import PaymentSuccess from "./pages/PaymentSuccess";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import Mission from "./pages/Mission";
import { ThemeProvider } from "next-themes";
import Suggestions from "./pages/Suggestions";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyEmail from "./pages/VerifyEmail";
// import Checkout from "./pages/StripeCheckout";
import { AdminUsersRoute } from "@/components/admin/AdminUsersRoute";
import { AdminEventsTab } from "@/components/admin/AdminEventsTab";
import { AdminEventDetailRoute } from "@/components/admin/AdminEventDetailRoute";
import { AdminEventCreateView } from "@/components/admin/AdminEventCreateView";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <div className="min-h-screen bg-background text-foreground">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={100}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:eventSlug" element={<Events />} />
              <Route path="/membership" element={<Membership />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/mission" element={<Mission />} />
              <Route path="/suggestions" element={<Suggestions />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<AdminUsersRoute />} />
                <Route path="events" element={<AdminEventsTab />} />
                <Route path="events/new" element={<AdminEventCreateView />} />
                <Route path="events/:eventId" element={<AdminEventDetailRoute />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  </ThemeProvider>
);

export default App;
