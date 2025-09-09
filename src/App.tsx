import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { RouteErrorBoundary } from "@/components/ui/route-error-boundary";
import { useAuth } from "@/hooks/useAuth";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load components for better performance
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Leads = lazy(() => import("@/pages/Leads"));
const LeadDetails = lazy(() => import("@/pages/LeadDetails"));
const Visits = lazy(() => import("@/pages/Visits"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Performance = lazy(() => import("@/pages/Performance"));
const Territory = lazy(() => import("@/pages/Territory"));
const ScheduledFollowups = lazy(() => import("@/pages/ScheduledFollowups"));
const SalespersonDetail = lazy(() => import("@/pages/SalespersonDetail"));

const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Auth = lazy(() => import("@/pages/Auth"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
          <Router>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={
                      <RouteErrorBoundary route="Dashboard">
                        <Dashboard />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/leads" element={
                      <RouteErrorBoundary route="Leads">
                        <Leads />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/leads/:id" element={
                      <RouteErrorBoundary route="Lead Details">
                        <LeadDetails />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/visits" element={
                      <RouteErrorBoundary route="Visits">
                        <Visits />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/analytics" element={
                      <RouteErrorBoundary route="Analytics">
                        <Analytics />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/performance" element={
                      <RouteErrorBoundary route="Performance">
                        <Performance />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/salesperson/:salespersonId" element={
                      <RouteErrorBoundary route="Salesperson Detail">
                        <SalespersonDetail />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/territory" element={
                      <RouteErrorBoundary route="Territory">
                        <Territory />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/scheduled-followups" element={
                      <RouteErrorBoundary route="Scheduled Followups">
                        <ScheduledFollowups />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/profile" element={
                      <RouteErrorBoundary route="Profile">
                        <Profile />
                      </RouteErrorBoundary>
                    } />
                    <Route path="/settings" element={
                      <RouteErrorBoundary route="Settings">
                        <Settings />
                      </RouteErrorBoundary>
                    } />
                    <Route path="*" element={
                      <RouteErrorBoundary route="Not Found">
                        <NotFound />
                      </RouteErrorBoundary>
                    } />
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
