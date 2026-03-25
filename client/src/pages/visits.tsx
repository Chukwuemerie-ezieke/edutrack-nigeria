import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { MapPin, TrendingUp, Users, CheckCircle, RefreshCw, Clock } from "lucide-react";
import {
  VISIT_METRICS,
  VISIT_COVERAGE_BY_STATE,
  SSO_PERFORMANCE,
} from "@/lib/data";
import { useLiveData } from "@/hooks/use-live-data";
import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface VisitEntry {
  id: number;
  timestamp: string;
  schoolName: string;
  lga: string;
  state: string;
  ssoName: string;
  gpsLat: number;
  gpsLng: number;
  activity: string;
}
interface VisitsLiveResponse {
  timestamp: string;
  isWorkingHours: boolean;
  visitsTodayCount: number;
  monthTotal: number;
  recentVisits: VisitEntry[];
  nextVisitExpectedInSecs: number | null;
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

// ─── Time ago ────────────────────────────────────────────────────────────────
function timeAgo(isoTs: string): string {
  const diffMs = Date.now() - new Date(isoTs).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

// ─── Live Visit Log ───────────────────────────────────────────────────────────
function LiveVisitLog({ visits, isLoading }: { visits: VisitEntry[] | undefined; isLoading: boolean }) {
  const stateColors: Record<string, string> = {
    Kano: "text-primary bg-primary/10",
    Kaduna: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30",
    Lagos: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30",
    Oyo: "text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30",
    Anambra: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30",
    Enugu: "text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/30",
    Edo: "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30",
    Rivers: "text-cyan-700 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-900/30",
    Bauchi: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30",
    Borno: "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/30",
    Plateau: "text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30",
    Kwara: "text-lime-700 bg-lime-100 dark:text-lime-300 dark:bg-lime-900/30",
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!visits || visits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No recent visits recorded
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-border/50">
      {visits.map((visit, i) => (
        <div
          key={visit.id}
          className={`flex gap-3 py-3 transition-all duration-500 ${i === 0 ? "animate-in fade-in slide-in-from-top-1" : ""}`}
          data-testid={`visit-entry-${visit.id}`}
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
            <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-emerald-500 ring-2 ring-emerald-500/30" : "bg-primary/40"}`} />
            {i < visits.length - 1 && <div className="w-px bg-border/50 flex-1 mt-1.5 min-h-[16px]" />}
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <span className="text-sm font-semibold text-foreground block truncate">{visit.schoolName}</span>
                <span className="text-xs text-muted-foreground">{visit.lga} · {visit.ssoName}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${stateColors[visit.state] ?? "text-muted-foreground bg-muted"}`}>
                  {visit.state}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {timeAgo(visit.timestamp)}
                </span>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">
                {visit.activity}
              </Badge>
              <span className="text-[10px] text-muted-foreground/60">
                {visit.gpsLat.toFixed(4)}°N, {visit.gpsLng.toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MapPlaceholder() {
  const zones = [
    { label: "North West", color: "hsl(183, 98%, 22%)", x: 60, y: 40, w: 130, h: 80, states: "Kano · Kaduna" },
    { label: "North East", color: "hsl(20, 73%, 34%)", x: 220, y: 40, w: 130, h: 80, states: "Bauchi · Borno" },
    { label: "North Central", color: "hsl(43, 74%, 49%)", x: 380, y: 40, w: 130, h: 80, states: "Plateau · Kwara" },
    { label: "South West", color: "hsl(210, 60%, 40%)", x: 60, y: 140, w: 130, h: 80, states: "Lagos · Oyo" },
    { label: "South East", color: "hsl(103, 56%, 31%)", x: 220, y: 140, w: 130, h: 80, states: "Anambra · Enugu" },
    { label: "South South", color: "hsl(0, 50%, 40%)", x: 380, y: 140, w: 130, h: 80, states: "Edo · Rivers" },
  ];
  return (
    <div className="relative rounded-lg border border-border overflow-hidden bg-muted/40" style={{ height: 260 }}>
      <svg viewBox="0 0 570 260" className="w-full h-full" aria-label="GPS visit distribution map">
        <rect width="570" height="260" fill="hsl(var(--muted))" />
        <text x="285" y="22" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="12" fontFamily="sans-serif" fontWeight="500">
          GPS Visit Distribution — 12 States across 6 Geopolitical Zones
        </text>
        {zones.map((z, i) => (
          <g key={i}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="6" fill={z.color} opacity="0.12" stroke={z.color} strokeWidth="1.5" />
            <text x={z.x + z.w / 2} y={z.y + z.h / 2 - 8} textAnchor="middle" fill={z.color} fontSize="11" fontWeight="600">{z.label}</text>
            <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 8} textAnchor="middle" fill={z.color} fontSize="9">{z.states}</text>
            {Array.from({ length: 6 }, (_, j) => (
              <circle
                key={j}
                cx={z.x + 15 + (j % 3) * (z.w - 30) / 2}
                cy={z.y + 18 + Math.floor(j / 3) * (z.h - 36)}
                r="3"
                fill={z.color}
                opacity="0.6"
              />
            ))}
          </g>
        ))}
        <text x="285" y="245" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">
          Visit locations across 12 monitored states · 2 per geopolitical zone
        </text>
      </svg>
    </div>
  );
}

export default function Visits() {
  const coverageData = VISIT_COVERAGE_BY_STATE.map(s => ({
    state: s.state,
    "Before Dashboard": s.before,
    "After Dashboard": s.after,
  }));

  // Live visits data
  const { data: liveData, isLoading, isFetching } =
    useLiveData<VisitsLiveResponse>("/api/live/visits", 30000);

  const animatedToday = useAnimatedCounter(liveData?.visitsTodayCount);
  const animatedMonth = useAnimatedCounter(liveData?.monthTotal);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">School Support Visits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            GPS-enabled SSO visit tracking across 12 monitored states
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
            PLANE Dashboard Data
          </Badge>
          {liveData && (
            <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              {liveData.isWorkingHours ? "Live (Working Hours)" : "Live (Off Hours)"}
            </Badge>
          )}
          {isFetching && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" /> updating…
            </span>
          )}
        </div>
      </div>

      {/* Live counters banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 to-transparent dark:from-emerald-900/10">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                Visits Today
                {liveData && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                )}
              </p>
              {isLoading ? <Skeleton className="h-9 w-20 mt-1" /> : (
                <div className="text-3xl font-bold tabular-nums text-foreground">{animatedToday}</div>
              )}
              {liveData && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {liveData.isWorkingHours ? "Active working hours (8am–4pm WAT)" : "Off working hours — reduced activity"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-amber-500/30 bg-gradient-to-br from-amber-50/80 to-transparent dark:from-amber-900/10">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Visits This Month</p>
              {isLoading ? <Skeleton className="h-9 w-24 mt-1" /> : (
                <div className="text-3xl font-bold tabular-nums text-foreground">{animatedMonth.toLocaleString()}</div>
              )}
              {liveData && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {liveData.nextVisitExpectedInSecs
                    ? `Next visit expected ~${liveData.nextVisitExpectedInSecs}s`
                    : "Resumes at 8am WAT"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content: live feed + map side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Visit Feed */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  Recent Visit Log
                  {liveData && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Live GPS-tagged visits — newest first</p>
              </div>
              {liveData && (
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {new Date(liveData.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <LiveVisitLog visits={liveData?.recentVisits} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">GPS Visit Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Geo-tagged school support visits across 12 states</p>
          </CardHeader>
          <CardContent>
            <MapPlaceholder />
          </CardContent>
        </Card>
      </div>

      {/* Before / After Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-border hover-elevate">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Pre-Dashboard (Q1 2022)</span>
            </div>
            <p className="text-4xl font-bold tabular-nums text-foreground">{VISIT_METRICS.before.visits.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">school visits</p>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-2xl font-bold tabular-nums text-muted-foreground">{VISIT_METRICS.before.coverage}%</p>
              <p className="text-xs text-muted-foreground">coverage in 3 months</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/30 bg-primary/5 hover-elevate">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">Post-Dashboard (Q1 2023)</span>
            </div>
            <p className="text-4xl font-bold tabular-nums text-primary">{VISIT_METRICS.after.visits.toLocaleString()}</p>
            <p className="text-sm text-primary/70 mt-1">school visits</p>
            <div className="mt-3 pt-3 border-t border-primary/20">
              <p className="text-2xl font-bold tabular-nums text-primary">{VISIT_METRICS.after.coverage}%</p>
              <p className="text-xs text-primary/70">coverage in 3 months</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border hover-elevate">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Impact</span>
            </div>
            <p className="text-4xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{VISIT_METRICS.increase}×</p>
            <p className="text-sm text-muted-foreground mt-1">increase in visit volume</p>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">+56pp</p>
              <p className="text-xs text-muted-foreground">coverage improvement</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage chart */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Visit Coverage by State</CardTitle>
            <p className="text-xs text-muted-foreground">Before vs after EduTrack dashboard deployment</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={coverageData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barGap={6}>
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
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
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
                <Legend formatter={(v) => <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>{v}</span>} />
                <Bar dataKey="Before Dashboard" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="After Dashboard" fill="hsl(183, 98%, 22%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visit types breakdown */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Visit Activities</CardTitle>
            <p className="text-xs text-muted-foreground">Types of support activities per visit</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {[
                { label: "Lesson Observations", value: 82, total: 1522 },
                { label: "Coaching Sessions", value: 74, total: 1522 },
                { label: "Head Teacher Interviews", value: 67, total: 1522 },
                { label: "Enrollment Monitoring", value: 91, total: 1522 },
                { label: "Infrastructure Checks", value: 55, total: 1522 },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.label}</span>
                    <span className="tabular-nums text-muted-foreground">{item.value}% of visits</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.value}%`, background: "hsl(183, 98%, 22%)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SSO Performance Table */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">School Support Officer (SSO) Performance</CardTitle>
          <p className="text-xs text-muted-foreground">Individual SSO metrics — Q1 2023</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["SSO Name", "State", "Total Visits", "Coverage", "Coaching", "Lesson Obs."].map((h) => (
                    <th key={h} className={`py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide ${h === "SSO Name" ? "text-left pr-4" : "text-right pr-4 last:pr-0"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SSO_PERFORMANCE.map((sso, i) => (
                  <tr key={sso.name} className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
                    <td className="py-2.5 pr-4 font-semibold text-foreground">{sso.name}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <Badge variant="outline" className="text-xs">{sso.state}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums font-medium">{sso.visits}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sso.coverage >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                        {sso.coverage}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{sso.coaching}</td>
                    <td className="py-2.5 text-right tabular-nums">{sso.lessonObs}</td>
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
