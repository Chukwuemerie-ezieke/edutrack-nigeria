import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useState, useEffect } from "react";
import { Moon, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

import Overview from "@/pages/overview";
import Attendance from "@/pages/attendance";
import Visits from "@/pages/visits";
import Teachers from "@/pages/teachers";
import Progress from "@/pages/progress";
import Resources from "@/pages/resources";
import Readiness from "@/pages/readiness";
import DataSources from "@/pages/data-sources";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import LogAttendancePage from "@/pages/log-attendance";
import LogVisitPage from "@/pages/log-visit";
import ManageSchoolsPage from "@/pages/manage-schools";
import ManageUsersPage from "@/pages/manage-users";
import AdminPage from "@/pages/admin";
import ReportsPage from "@/pages/reports";
import ResourceRequestsPage from "@/pages/resource-requests";
import ExamResultsPage from "@/pages/exam-results";
import AlertsPage from "@/pages/alerts";
import { LiveFeedBanner } from "@/components/live-feed-banner";
import { OfflineIndicator } from "@/components/offline-indicator";

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      data-testid="button-theme-toggle"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-8 w-8"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function AppRouter() {
  const { isDemoMode } = useAuth();
  return (
    <Switch>
      <Route path="/" component={Overview} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/visits" component={Visits} />
      <Route path="/teachers" component={Teachers} />
      <Route path="/progress" component={Progress} />
      <Route path="/resources" component={Resources} />
      <Route path="/readiness" component={Readiness} />
      <Route path="/data-sources" component={DataSources} />
      <Route path="/log-attendance" component={LogAttendancePage} />
      <Route path="/log-visit" component={LogVisitPage} />
      <Route path="/manage-schools" component={ManageSchoolsPage} />
      <Route path="/manage-users" component={ManageUsersPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/resource-requests" component={ResourceRequestsPage} />
      <Route path="/exam-results" component={ExamResultsPage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp({ dark, setDark }: { dark: boolean; setDark: (v: (p: boolean) => boolean) => void }) {
  const { isDemoMode, profile, loading } = useAuth();
  const [location] = useHashLocation();

  // Show login page
  if (location === "/login") {
    return <LoginPage />;
  }

  // In production mode, require login
  if (!isDemoMode && !loading && !profile) {
    return <LoginPage />;
  }

  const sidebarStyle = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <Router hook={useHashLocation}>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur-sm h-12 flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="h-8 w-8" />
                <span className="text-sm text-muted-foreground hidden sm:block">
                  School Operational Excellence Dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isDemoMode && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-xs hidden sm:flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Demo Mode
                  </Badge>
                )}
                {!isDemoMode && profile && (
                  <span className="text-xs text-muted-foreground hidden md:block">
                    Connected · {profile.client_id ? "Live Data" : ""}
                  </span>
                )}
                {isDemoMode && (
                  <span className="text-xs text-muted-foreground hidden md:block">
                    Live Data · UBEC NPA 2022/23 + World Bank
                  </span>
                )}
                <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
              </div>
            </header>

            <LiveFeedBanner />
            <OfflineIndicator />

            <main className="flex-1 overflow-y-auto">
              <AppRouter />
            </main>

            <PerplexityAttribution />
          </div>
        </div>
      </SidebarProvider>
    </Router>
  );
}

function App() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AuthenticatedApp dark={dark} setDark={setDark} />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
