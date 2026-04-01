import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  MONTHLY_ATTENDANCE,
  ATTENDANCE_HEATMAP,
  TEACHER_ATTENDANCE_COMPARISON,
  STATE_DATA,
} from "@/lib/data";
import { useLiveData } from "@/hooks/use-live-data";
import { useEffect, useRef, useState } from "react";
import { RefreshCw, Users } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StateAttendance {
  state: string;
  rate: number;
}
interface AttendanceLiveResponse {
  timestamp: string;
  lastUpdated: string;
  windowKey: number;
  avgAttendanceRate: number;
  studentsPresent: number;
  studentBaselineEdoBest: number;
  teacherBaselineEdoBest: number;
  dayOfWeek: string;
  byState: StateAttendance[];
}

// ─── Animated counter ────────────────────────────────────────────────────────
function useAnimatedCounter(target: number | undefined, duration = 700) {
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

const CHART_COLORS = {
  edobest: "hsl(183, 98%, 22%)",
  statusQuo: "hsl(20, 73%, 34%)",
};

function AttendanceBar({ label, value, color, live }: { label: string; value: number; color: string; live?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium flex items-center gap-1.5">
          {label}
          {live && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
          )}
        </span>
        <span className="tabular-nums font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function HeatCell({ value }: { value: number }) {
  const opacity = (value - 50) / 50;
  return (
    <td className="p-1">
      <div
        className="h-10 w-full rounded flex items-center justify-center text-xs font-medium tabular-nums"
        style={{
          background: `hsla(183, 98%, 22%, ${Math.max(0.08, opacity)})`,
          color: opacity > 0.6 ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
        }}
        title={`${value}%`}
      >
        {value}%
      </div>
    </td>
  );
}

export default function Attendance() {
  const staticStateAttendance = STATE_DATA.map(s => ({
    state: s.state,
    rate: s.attendanceRate,
  })).sort((a, b) => b.rate - a.rate);

  // Live attendance data
  const { data: liveData, isFetching, isLoading } =
    useLiveData<AttendanceLiveResponse>("/api/live/attendance", 30000);

  const animatedStudents = useAnimatedCounter(liveData?.studentsPresent);

  // Use live state rates if available, otherwise fall back to static
  const stateAttendance = liveData?.byState
    ? [...liveData.byState].sort((a, b) => b.rate - a.rate)
    : staticStateAttendance;

  const avgLive = liveData?.avgAttendanceRate;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">Attendance Tracking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Daily student and teacher attendance — live feed + historical data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
            EdoBEST & DHIS2/EdoEMIS
          </Badge>
          {liveData && (
            <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live · {liveData.dayOfWeek}
            </Badge>
          )}
          {isFetching && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" /> updating…
            </span>
          )}
        </div>
      </div>

      {/* Live Attendance Counter */}
      <Card className="border border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 to-transparent dark:from-emerald-900/10">
        <CardContent className="pt-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                  Students Present Right Now
                  {liveData && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                  )}
                </p>
                {isLoading ? (
                  <Skeleton className="h-9 w-36 mt-1" />
                ) : (
                  <div className="text-3xl font-bold tabular-nums text-foreground">
                    {animatedStudents.toLocaleString()}
                  </div>
                )}
                {liveData && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Updated at {new Date(liveData.timestamp).toLocaleTimeString()} · refreshes every 30s
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className={`text-xl font-bold tabular-nums ${avgLive ? "text-primary" : "text-muted-foreground"}`}>
                  {avgLive ? `${avgLive}%` : "–"}
                </div>
                <p className="text-xs text-muted-foreground">Avg Rate (live)</p>
              </div>
              <div>
                <div className="text-xl font-bold tabular-nums text-primary">81.9%</div>
                <p className="text-xs text-muted-foreground">EdoBEST Baseline</p>
              </div>
              <div>
                <div className="text-xl font-bold tabular-nums text-orange-600 dark:text-orange-400">71.8%</div>
                <p className="text-xs text-muted-foreground">Status Quo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "EdoBEST Student Attendance", value: "81.9%", note: "vs 71.8% status quo", good: true },
          { label: "Teacher Present 7:30am", value: "100%", note: "EdoBEST schools", good: true },
          { label: "Teacher Present 2:30pm", value: "90%", note: "vs 13.3% status quo", good: true },
          { label: "Absenteeism Rate", value: "44%", note: "6.9 days/month missed", good: false },
        ].map((m) => (
          <Card key={m.label} className="border border-border">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-2xl font-bold tabular-nums mt-1 ${m.good ? "text-primary" : "text-destructive"}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher attendance comparison */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Teacher Attendance Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">EdoBEST schools vs status quo (P3 teachers)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={TEACHER_ATTENDANCE_COMPARISON}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 100 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="metric"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v: number) => [`${v}%`, ""]}
                />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>{v}</span>}
                />
                <Bar dataKey="edobest" name="EdoBEST" fill={CHART_COLORS.edobest} radius={[0, 4, 4, 0]} />
                <Bar dataKey="statusQuo" name="Status Quo" fill={CHART_COLORS.statusQuo} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Student Attendance by State — Live */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  Student Attendance by State
                  {liveData && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {liveData ? "Live attendance rate — auto-refreshes every 30s" : "Average daily attendance rate"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
              : stateAttendance.map((s) => (
                <AttendanceBar
                  key={s.state}
                  label={s.state}
                  value={s.rate}
                  color={s.rate >= 80 ? CHART_COLORS.edobest : s.rate >= 70 ? "hsl(43, 74%, 49%)" : CHART_COLORS.statusQuo}
                  live={!!liveData}
                />
              ))
            }
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Attendance Heatmap by Day &amp; Period</CardTitle>
          <p className="text-xs text-muted-foreground">Average attendance % across monitored schools — darker = higher attendance</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 w-20">Day</th>
                  <th className="text-center text-xs font-medium text-muted-foreground pb-2 px-1">Morning</th>
                  <th className="text-center text-xs font-medium text-muted-foreground pb-2 px-1">Midday</th>
                  <th className="text-center text-xs font-medium text-muted-foreground pb-2 px-1">Afternoon</th>
                </tr>
              </thead>
              <tbody>
                {ATTENDANCE_HEATMAP.map((row) => (
                  <tr key={row.day}>
                    <td className="pr-4 py-1">
                      <span className="text-sm font-medium text-foreground">{row.day}</span>
                    </td>
                    <HeatCell value={row.morning} />
                    <HeatCell value={row.midday} />
                    <HeatCell value={row.afternoon} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Friday afternoon drop reflects early departures common in Muslim-majority northern states.
          </p>
        </CardContent>
      </Card>

      {/* Daily attendance trend */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Monthly Attendance Trend</CardTitle>
          <p className="text-xs text-muted-foreground">12-month rolling average — all monitored schools</p>
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
                stroke={CHART_COLORS.edobest}
                strokeWidth={2.5}
                dot={{ fill: CHART_COLORS.edobest, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
