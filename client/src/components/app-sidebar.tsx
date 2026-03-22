import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  LayoutDashboard,
  Users,
  MapPin,
  UserCheck,
  TrendingUp,
  Package,
  ClipboardCheck,
  Database,
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

const navItems = [
  { title: "Overview",           url: "/",             icon: LayoutDashboard },
  { title: "Attendance",         url: "/attendance",   icon: Users           },
  { title: "School Visits",      url: "/visits",       icon: MapPin           },
  { title: "Teacher Performance",url: "/teachers",     icon: UserCheck        },
  { title: "Student Progress",   url: "/progress",     icon: TrendingUp       },
  { title: "Resources",          url: "/resources",    icon: Package          },
  { title: "Readiness",          url: "/readiness",    icon: ClipboardCheck   },
  { title: "Data Sources",       url: "/data-sources", icon: Database         },
];

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

export function AppSidebar() {
  const [location] = useHashLocation();

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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-4 mb-1">
            Analytics
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
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
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/40 leading-relaxed">
          <p className="font-medium text-sidebar-foreground/60">Data Sources</p>
          <p>UBEC NPA 2022/23 • EdoBEST</p>
          <p>PLANE • DHIS2/EdoEMIS</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
