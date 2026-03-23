import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Shield, Building, School, Users, ClipboardList, MapPin, Plus, ArrowUpRight
} from "lucide-react";

const DEMO_CLIENTS = [
  { id: "c1", name: "Anambra State SUBEB", state: "Anambra", plan: "enterprise", schools: 48, last_activity: "Today", compliance_rate: 87 },
  { id: "c2", name: "Edo State SUBEB", state: "Edo", plan: "standard", schools: 23, last_activity: "Yesterday", compliance_rate: 72 },
  { id: "c3", name: "Lagos SUBEB Pilot", state: "Lagos", plan: "pilot", schools: 8, last_activity: "2 days ago", compliance_rate: 63 },
];

const DEMO_KPIS = {
  total_clients: 3,
  total_schools: 79,
  total_users: 156,
  schools_reported_today: 47,
  visits_today: 12,
};

const PLAN_COLORS: Record<string, string> = {
  pilot: "text-gray-600 border-gray-300 bg-gray-50 dark:bg-gray-950/40",
  standard: "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/40",
  enterprise: "text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/40",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  loading,
  color = "text-[hsl(183_98%_22%)]",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  loading?: boolean;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-muted/50 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { profile, isDemoMode } = useAuth();
  const configured = isSupabaseConfigured();

  // Fetch all clients
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      if (!configured) return DEMO_CLIENTS;
      const { data } = await supabase
        .from("clients")
        .select("id, name, state, plan, max_schools, active")
        .order("name");
      return data || DEMO_CLIENTS;
    },
    enabled: !!profile,
  });

  // Aggregate KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      if (!configured) return DEMO_KPIS;
      const today = new Date().toISOString().split("T")[0];
      const [clientsRes, schoolsRes, usersRes, attendanceRes, visitsRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("schools").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("daily_attendance").select("id", { count: "exact", head: true }).eq("date", today),
        supabase.from("visits").select("id", { count: "exact", head: true }).eq("visit_date", today),
      ]);
      return {
        total_clients: clientsRes.count || 0,
        total_schools: schoolsRes.count || 0,
        total_users: usersRes.count || 0,
        schools_reported_today: attendanceRes.count || 0,
        visits_today: visitsRes.count || 0,
      };
    },
    enabled: !!profile,
  });

  const displayKpis = kpis || DEMO_KPIS;
  const displayClients = (clients as typeof DEMO_CLIENTS) || DEMO_CLIENTS;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[hsl(183_98%_22%)]" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Admin Overview</h1>
            <p className="text-sm text-muted-foreground">
              System-wide view across all clients
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
              Demo Mode
            </Badge>
          )}
          <Button
            size="sm"
            className="bg-[hsl(183_98%_22%)] hover:bg-[hsl(183_98%_18%)] text-white"
            data-testid="button-add-client"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Client
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          icon={Building}
          label="Total Clients"
          value={displayKpis.total_clients}
          loading={kpisLoading}
        />
        <KpiCard
          icon={School}
          label="Total Schools"
          value={displayKpis.total_schools}
          loading={kpisLoading}
        />
        <KpiCard
          icon={Users}
          label="Total Users"
          value={displayKpis.total_users}
          loading={kpisLoading}
        />
        <KpiCard
          icon={ClipboardList}
          label="Reported Today"
          value={displayKpis.schools_reported_today}
          loading={kpisLoading}
          color="text-green-600"
        />
        <KpiCard
          icon={MapPin}
          label="Visits Today"
          value={displayKpis.visits_today}
          loading={kpisLoading}
          color="text-orange-600"
        />
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">State</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold text-right hidden sm:table-cell">Schools</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Last Activity</TableHead>
                  <TableHead className="font-semibold text-right hidden md:table-cell">Compliance</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : displayClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No clients registered yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayClients.map((client) => (
                    <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {client.state}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${PLAN_COLORS[client.plan] || PLAN_COLORS.pilot}`}
                        >
                          {client.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums hidden sm:table-cell">
                        {client.schools || (client as { max_schools?: number }).max_schools || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                        {client.last_activity || "No activity"}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {client.compliance_rate !== undefined ? (
                          <span className={`font-mono tabular-nums font-medium ${
                            client.compliance_rate >= 80 ? "text-green-600" :
                            client.compliance_rate >= 60 ? "text-yellow-600" :
                            "text-red-600"
                          }`}>
                            {client.compliance_rate}%
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          data-testid={`button-view-client-${client.id}`}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
