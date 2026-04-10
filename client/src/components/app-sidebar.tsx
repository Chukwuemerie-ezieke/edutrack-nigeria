import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  LayoutDashboard,
  School,
  Users,
  MapPin,
  UserCheck,
  TrendingUp,
  Package,
  ClipboardCheck,
  Database,
  ClipboardEdit,
  MapPinPlus,
  Building2,
  UserCog,
  Shield,
  LogOut,
  ChevronRight,
  FileBarChart,
  PackagePlus,
  GraduationCap,
  Bell,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth, hasRole, ROLE_LABELS, type UserRole } from "@/contexts/auth-context";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  minRole?: UserRole;
}

// My School — shown for head_teacher, principal, and above (not in demo mode unless user has school_id)
const MY_SCHOOL_NAV: NavItem[] = [
  { title: "My School", url: "/my-school", icon: School, minRole: "head_teacher" },
];

// Items always shown (all roles in demo, or any logged-in user)
const CORE_NAV: NavItem[] = [
  { title: "Overview",      url: "/",          icon: LayoutDashboard },
  { title: "Attendance",    url: "/attendance", icon: Users           },
  { title: "School Visits", url: "/visits",     icon: MapPin          },
];

// Data entry — role-gated
const ENTRY_NAV: NavItem[] = [
  { title: "Log Attendance",    url: "/log-attendance",    icon: ClipboardEdit, minRole: "head_teacher" },
  { title: "Log Visit",         url: "/log-visit",          icon: MapPinPlus,    minRole: "sso"         },
  { title: "Resource Requests", url: "/resource-requests", icon: PackagePlus,   minRole: "head_teacher" },
];

// Analytics — subeb_admin and above
const ANALYTICS_NAV: NavItem[] = [
  { title: "Teacher Performance", url: "/teachers",     icon: UserCheck,      minRole: "subeb_admin" },
  { title: "Student Progress",    url: "/progress",     icon: TrendingUp,     minRole: "subeb_admin" },
  { title: "Resources",           url: "/resources",    icon: Package,        minRole: "subeb_admin" },
  { title: "Readiness",           url: "/readiness",    icon: ClipboardCheck, minRole: "subeb_admin" },
  { title: "Data Sources",        url: "/data-sources", icon: Database,       minRole: "subeb_admin" },
  { title: "Reports",             url: "/reports",      icon: FileBarChart,   minRole: "subeb_admin" },
  { title: "Exam Results",        url: "/exam-results", icon: GraduationCap,  minRole: "subeb_admin" },
];

// Management — subeb_admin and above
const MANAGEMENT_NAV: NavItem[] = [
  { title: "Manage Schools", url: "/manage-schools", icon: Building2, minRole: "subeb_admin" },
  { title: "Manage Users",   url: "/manage-users",   icon: UserCog,   minRole: "super_admin" },
  { title: "Admin",          url: "/admin",          icon: Shield,    minRole: "super_admin" },
  { title: "Alerts",         url: "/alerts",         icon: Bell,      minRole: "subeb_admin" },
];

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  super_admin:  "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  subeb_admin:  "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  head_teacher: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
  principal:    "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
  aeo:          "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  sso:          "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
  teacher:      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function EduTrackLogo() {
  return (
    <svg
      aria-label="EduTrack Nigeria"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 flex-shrink-0"
    >
      {/* Hexagon background */}
      <path
        d="M20 2L36 11V29L20 38L4 29V11L20 2Z"
        fill="hsl(183 60% 45%)"
        opacity="0.25"
      />
      <path
        d="M20 4L34 12.5V27.5L20 36L6 27.5V12.5L20 4Z"
        stroke="hsl(183 60% 45%)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* ET letterform */}
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fontFamily="'General Sans', sans-serif"
        fontWeight="700"
        fontSize="13"
        fill="hsl(183 60% 75%)"
        letterSpacing="-0.5"
      >
        ET
      </text>
    </svg>
  );
}

function NavGroup({ items, label, userRole, isDemoMode }: {
  items: NavItem[];
  label: string;
  userRole: UserRole | undefined;
  isDemoMode: boolean;
}) {
  const [location] = useHashLocation();

  const visibleItems = items.filter(item => {
    if (isDemoMode) return true; // Show all in demo mode
    if (!item.minRole) return true;
    if (!userRole) return false;
    return hasRole(userRole, item.minRole);
  });

  if (visibleItems.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4 mb-1">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            const isActive = location === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Link href={item.url} className="flex items-center gap-3 px-4 py-2.5">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { profile, isDemoMode, signOut } = useAuth();
  const [, navigate] = useHashLocation();

  const userRole = profile?.role;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Filter entry nav based on role
  const visibleEntryNav = ENTRY_NAV.filter(item => {
    if (isDemoMode) return true;
    if (!item.minRole || !userRole) return isDemoMode;
    return hasRole(userRole, item.minRole);
  });

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <EduTrackLogo />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              EduTrack Nigeria
            </span>
            <span className="text-xs text-sidebar-foreground/60 truncate leading-tight">
              Harmony Digital Consults
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {/* My School — head_teacher/principal with school_id, or in demo mode for those roles */}
        {(!isDemoMode && profile?.school_id && userRole && hasRole(userRole, "head_teacher")) && (
          <NavGroup items={MY_SCHOOL_NAV} label="My School" userRole={userRole} isDemoMode={isDemoMode} />
        )}

        {/* Core nav - always shown */}
        <NavGroup items={CORE_NAV} label="Dashboard" userRole={userRole} isDemoMode={isDemoMode} />

        {/* Data entry - role-gated */}
        {visibleEntryNav.length > 0 && (
          <NavGroup items={visibleEntryNav} label="Data Entry" userRole={userRole} isDemoMode={isDemoMode} />
        )}

        {/* Analytics - subeb_admin+ */}
        <NavGroup items={ANALYTICS_NAV} label="Analytics" userRole={userRole} isDemoMode={isDemoMode} />

        {/* Management - subeb_admin+ */}
        <NavGroup items={MANAGEMENT_NAV} label="Management" userRole={userRole} isDemoMode={isDemoMode} />
      </SidebarContent>

      {/* User Info + Sign Out */}
      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border space-y-3">
        {profile && (
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-[hsl(183_60%_22%)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
                {profile.full_name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate leading-none mt-0.5">
                {profile.email || ""}
              </p>
              <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${ROLE_BADGE_COLORS[profile.role]}`}>
                {ROLE_LABELS[profile.role]}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={handleSignOut}
              title="Sign out"
              data-testid="button-sign-out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Data sources credit (small) */}
        <div className="text-xs text-sidebar-foreground/40 leading-relaxed">
          <p>UBEC NPA 2022/23 · EdoBEST · PLANE</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
