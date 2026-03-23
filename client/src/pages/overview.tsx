import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  School, Users, UserCheck, TrendingUp, MapPin, ClipboardCheck,
  ArrowUpRight, ArrowDownRight, RefreshCw, Zap, BookOpen, GraduationCap
} from "lucide-react";
import {
  NATIONAL_OVERVIEW,
  ENROLLMENT_BY_STATE,
  MONTHLY_ATTENDANCE,
  SCHOOL_TYPE_DISTRIBUTION,
  STATE_DATA,
} from "@/lib/data";
import { useLiveData } from "@/hooks/use-live-data";
import { useDbData } from "@/hooks/use-db-data";
import { useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface IndicatorResult {
  code: string;
  name: string;
  latestValue: number | null;
  latestYear: string | null;
  unit: string;
  trend: { year: string; value: number }[];
}
interface WorldBankResponse {
  indicators: IndicatorResult[];
  fetchedAt: string;
}
interface AttendanceResponse {
  studentsPresent: number;
  avgAttendanceRate: number;
  timestamp: string;
}
interface VisitsResponse {
  visitsTodayCount: number;
  monthTotal: number;
  timestamp: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}
function fmtFull(n: number) {
  return n.toLocaleString("en-NG");
}

// Animated counter
function useAnimatedCounter(target: number | undefined, duration = 800) {
  const [display, setDisplay] = useState(target ?? 0);
  const prev = useRef(display);

  useEffect(() => {
    if (target === undefined) return;
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
      else prev.current = target;
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return display;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: { value: string; up: boolean };
  live?: boolean;
  "data-testid"?: string;
}

function KpiCard({ title, value, sub, icon: Icon, trend, live, "data-testid": testId }: KpiCardProps) {
  return (
    <Card className="hover-elevate border border-border" data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          {title}
          {live && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          )}
        </CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums lining-nums text-foreground">
          {value}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
            {trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── World Bank Indicator Card ───────────────────────────────────────────────
function WbIndicatorCard({ indicator }: { indicator: IndicatorResult }) {
  const val = indicator.latestValue;
  const formatted = val === null ? "N/A"
    : indicator.code === "SE.PRM.UNER"
      ? fmt(val)
      : `${val.toFixed(2)}${indicator.unit === "%" ? "%" : ""}`;

  return (
    <Card className="border border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          {indicator.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold tabular-nums text-foreground">{formatted}</div>
        {indicator.unit !== "%" && indicator.unit !== "children" && (
          <div className="text-xs text-muted-foreground">{indicator.unit}</div>
        )}
        {indicator.latestYear && (
          <div className="text-xs text-muted-foreground mt-0.5">Latest: {indicator.latestYear}</div>
        )}
        {indicator.trend.length > 1 && (
          <div className="mt-2 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indicator.trend} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(183, 98%, 22%)"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "11px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v: number) => [`${indicator.code === "SE.PRM.UNER" ? fmt(v) : v.toFixed(1) + (indicator.unit === "%" ? "%" : "")}`, ""]}
                  labelFormatter={(label) => `Year ${label}`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = {
  primary: "hsl(183, 98%, 22%)",
  secondary: "hsl(20, 73%, 34%)",
  tertiary: "hsl(43, 74%, 49%)",
  quaternary: "hsl(103, 56%, 31%)",
};

export default function Overview() {
  const enrollmentData = ENROLLMENT_BY_STATE.map(s => ({
    ...s,
    enrollmentM: +(s.enrollment / 1_000_000).toFixed(2),
  }));

  // Database data (with demo fallback)
  const { isRealData, isDemoMode: isDemo, clientName, kpis } = useDbData();

  // Live data hooks
  const { data: wbData, isLoading: wbLoading, isFetching: wbFetching } =
    useLiveData<WorldBankResponse>("/api/live/worldbank", 300000); // 5 min cache matches server

  const { data: attendanceData } =
    useLiveData<AttendanceResponse>("/api/live/attendance", 30000);

  const { data: visitsData } =
    useLiveData<VisitsResponse>("/api/live/visits", 30000);

  // Animated counters
  const animatedStudents = useAnimatedCounter(attendanceData?.studentsPresent);
  const animatedVisitsToday = useAnimatedCounter(visitsData?.visitsTodayCount);
  const animatedMonthTotal = useAnimatedCounter(visitsData?.monthTotal);

  // World Bank indicators by code
  const wbByCode = (wbData?.indicators ?? []).reduce<Record<string, IndicatorResult>>(
    (acc, ind) => { acc[ind.code] = ind; return acc; },
    {}
  );

  const primaryGer = wbByCode["SE.PRM.ENRR"]?.latestValue;
  const outOfSchool = wbByCode["SE.PRM.UNER"]?.latestValue;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">National Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Nigeria Basic Education System — UBEC Data 2022/2023 + Live World Bank Feed
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
            UBEC NPA 2022/23
          </Badge>
          {isRealData ? (
            <Badge variant="outline" className="text-xs border-[hsl(183_98%_22%)]/40 text-[hsl(183_98%_22%)] bg-[hsl(183_98%_22%)]/5 flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Connected · {clientName}
            </Badge>
          ) : (
            <>
              <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                World Bank Live
              </Badge>
              {isDemo && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Demo Mode
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Schools"
          value={fmtFull(NATIONAL_OVERVIEW.totalSchools)}
          sub={`Public: ${fmt(NATIONAL_OVERVIEW.publicSchools)} · Private: ${fmt(NATIONAL_OVERVIEW.privateSchools)}`}
          icon={School}
          data-testid="kpi-total-schools"
        />
        <KpiCard
          title="Primary GER"
          value={primaryGer ? `${primaryGer.toFixed(1)}%` : fmtFull(NATIONAL_OVERVIEW.totalEnrollment)}
          sub={primaryGer ? `World Bank 2023` : `Primary: ${fmt(NATIONAL_OVERVIEW.primaryEnrollment)}`}
          icon={Users}
          trend={primaryGer ? { value: "World Bank 2023", up: true } : { value: "GER 91%", up: true }}
          live={!!primaryGer}
          data-testid="kpi-total-enrollment"
        />
        <KpiCard
          title="Total Teachers"
          value={fmt(NATIONAL_OVERVIEW.totalTeachers)}
          sub="Qualified: 72.3% primary"
          icon={UserCheck}
          data-testid="kpi-total-teachers"
        />
        <KpiCard
          title="Students Present"
          value={attendanceData ? animatedStudents.toLocaleString() : `${NATIONAL_OVERVIEW.avgAttendanceRate}%`}
          sub={attendanceData ? `${attendanceData.avgAttendanceRate}% avg attendance` : "EdoBEST: 81.9%"}
          icon={TrendingUp}
          trend={{ value: "Real-time estimate", up: true }}
          live={!!attendanceData}
          data-testid="kpi-avg-attendance"
        />
        <KpiCard
          title="Visits Today"
          value={visitsData ? String(animatedVisitsToday) : fmtFull(NATIONAL_OVERVIEW.schoolVisitsThisMonth)}
          sub={visitsData ? `${animatedMonthTotal.toLocaleString()} this month` : "77% coverage (3 states)"}
          icon={MapPin}
          trend={{ value: "Live tracking", up: true }}
          live={!!visitsData}
          data-testid="kpi-visits-this-month"
        />
        <KpiCard
          title="Out of School"
          value={outOfSchool ? fmt(outOfSchool) : `${NATIONAL_OVERVIEW.readinessScore}/100`}
          sub={outOfSchool ? "World Bank 2023" : "National average"}
          icon={outOfSchool ? GraduationCap : ClipboardCheck}
          trend={outOfSchool ? { value: "Primary age children", up: false } : { value: "+4 pts YoY", up: true }}
          live={!!outOfSchool}
          data-testid="kpi-readiness-score"
        />
      </div>

      {/* World Bank Live Data Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">World Bank Live Education Data</h2>
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20">
              Nigeria (NGA) · Auto-refresh 5min
            </Badge>
          </div>
          {wbFetching && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" /> refreshing…
            </span>
          )}
          {wbData && (
            <span className="text-xs text-muted-foreground hidden md:block">
              Fetched: {new Date(wbData.fetchedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {wbLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-border">
                <CardHeader className="pb-2"><Skeleton className="h-4 w-full" /></CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wbData ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {wbData.indicators.map(ind => (
              <WbIndicatorCard key={ind.code} indicator={ind} />
            ))}
          </div>
        ) : (
          <Card className="border border-border border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              World Bank data unavailable — showing cached indicators
            </CardContent>
          </Card>
        )}
      </div>

      {/* Live Counters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance live counter */}
        <Card className="border border-border bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Attendance Counter</span>
              <span className="relative flex h-1.5 w-1.5 ml-auto">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
            </div>
            {attendanceData ? (
              <>
                <div className="text-3xl font-bold tabular-nums text-foreground">
                  {animatedStudents.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">students present right now</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg rate: <span className="font-semibold text-primary">{attendanceData.avgAttendanceRate}%</span>
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  Updated {new Date(attendanceData.timestamp).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <Skeleton className="h-10 w-32 mt-1" />
            )}
          </CardContent>
        </Card>

        {/* Visits live counter */}
        <Card className="border border-border bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-md bg-amber-500/15 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Visit Counter</span>
              <span className="relative flex h-1.5 w-1.5 ml-auto">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
              </span>
            </div>
            {visitsData ? (
              <>
                <div className="text-3xl font-bold tabular-nums text-foreground">
                  {animatedVisitsToday}
                </div>
                <p className="text-sm text-muted-foreground mt-1">school visits today</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This month: <span className="font-semibold text-amber-600 dark:text-amber-400">{animatedMonthTotal.toLocaleString()}</span>
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  Updated {new Date(visitsData.timestamp).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <Skeleton className="h-10 w-32 mt-1" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollment bar chart */}
        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Enrollment by State</CardTitle>
            <p className="text-xs text-muted-foreground">Total students enrolled (millions) — UBEC 2022/23</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={enrollmentData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="state"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}M`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v: number) => [`${v}M students`, "Enrollment"]}
                />
                <Bar dataKey="enrollmentM" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* School type donut */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Schools by Type</CardTitle>
            <p className="text-xs text-muted-foreground">Public vs Private distribution</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={SCHOOL_TYPE_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {SCHOOL_TYPE_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v: number) => [v.toLocaleString(), ""]}
                />
                <Legend
                  formatter={(value) => <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {SCHOOL_TYPE_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ background: item.fill }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="tabular-nums font-medium">{((item.value / NATIONAL_OVERVIEW.totalSchools) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Attendance Trend */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Monthly Attendance Trend</CardTitle>
          <p className="text-xs text-muted-foreground">Average daily attendance rate across monitored schools (Apr 2023 – Mar 2024)</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={MONTHLY_ATTENDANCE} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[60, 90]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(v: number) => [`${v}%`, "Attendance"]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke={CHART_COLORS.primary}
                strokeWidth={2.5}
                dot={{ fill: CHART_COLORS.primary, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* State Summary Table */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Focus States — Key Indicators</CardTitle>
          <p className="text-xs text-muted-foreground">6 priority states under EduTrack monitoring programme</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">State</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Schools</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Enrollment</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">PTR</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">GER</th>
                  <th className="text-right py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {STATE_DATA.map((row, i) => (
                  <tr key={row.state} className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
                    <td className="py-2.5 pr-4 font-semibold text-foreground">{row.state}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{row.schools.toLocaleString()}+</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{fmt(row.enrollment)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{row.ptr}:1</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${row.ger >= 90 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : row.ger >= 75 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {row.ger}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${row.attendanceRate >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : row.attendanceRate >= 70 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {row.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
