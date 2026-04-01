import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, RefreshCw, CheckCircle, Clock, Database, Zap, Archive } from "lucide-react";
import { useLiveData } from "@/hooks/use-live-data";
import { LineChart, Line, Tooltip, ResponsiveContainer } from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DataSource {
  name: string;
  type: string;
  status: string;
  statusLabel: string;
  lastUpdated: string | null;
  dataPoints: number;
  url: string;
  description: string;
}
interface StatusResponse {
  timestamp: string;
  sources: DataSource[];
}

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; bg: string }> = {
  active: {
    dot: "bg-emerald-500",
    label: "Active",
    bg: "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30",
  },
  available: {
    dot: "bg-sky-500",
    label: "Available",
    bg: "text-sky-700 bg-sky-100 dark:text-sky-400 dark:bg-sky-900/30",
  },
  cached: {
    dot: "bg-amber-500",
    label: "Cached",
    bg: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  },
  degraded: {
    dot: "bg-red-500",
    label: "Degraded",
    bg: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
  },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  API: Zap,
  Simulated: RefreshCw,
  Cached: Archive,
};

function StatusDot({ status, animate }: { status: string; animate?: boolean }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.cached;
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      {animate && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-60`} />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dot}`} />
    </span>
  );
}

// World Bank indicator mini-card
function WbMiniCard({ indicator }: { indicator: IndicatorResult }) {
  const val = indicator.latestValue;
  const formatted = val === null ? "N/A"
    : indicator.code === "SE.PRM.UNER" ? fmt(val)
    : `${val.toFixed(2)}${indicator.unit === "%" ? "%" : ""}`;

  return (
    <div className="border border-border rounded-lg p-3 bg-muted/20 hover:bg-muted/40 transition-colors">
      <p className="text-xs text-muted-foreground leading-snug mb-1.5">{indicator.name}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-base font-bold tabular-nums text-foreground">{formatted}</span>
          {indicator.unit === "% of GDP" && <span className="text-xs text-muted-foreground ml-1">% GDP</span>}
          {indicator.latestYear && <p className="text-[10px] text-muted-foreground mt-0.5">{indicator.latestYear}</p>}
        </div>
        {indicator.trend.length > 1 && (
          <div className="w-16 h-8 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={indicator.trend}>
                <Line type="monotone" dataKey="value" stroke="hsl(183, 98%, 22%)" strokeWidth={1.5} dot={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "10px",
                    color: "hsl(var(--popover-foreground))",
                    padding: "4px 6px",
                  }}
                  formatter={(v: number) => [
                    indicator.code === "SE.PRM.UNER" ? fmt(v) : v.toFixed(1) + (indicator.unit === "%" ? "%" : ""),
                    ""
                  ]}
                  labelFormatter={(l) => `${l}`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DataSources() {
  const { data: statusData, isLoading: statusLoading, isFetching: statusFetching } =
    useLiveData<StatusResponse>("/api/live/status", 60000);

  const { data: wbData, isLoading: wbLoading, isFetching: wbFetching } =
    useLiveData<WorldBankResponse>("/api/live/worldbank", 300000);

  const sources = statusData?.sources ?? [];
  const activeCount = sources.filter(s => s.status === "active").length;
  const cachedCount = sources.filter(s => s.status === "cached" || s.status === "available").length;
  const totalDataPoints = sources.reduce((sum, s) => sum + s.dataPoints, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Sources
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live status of all connected data sources powering EduTrack Nigeria
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusFetching && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" /> checking status…
            </span>
          )}
          {statusData && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Checked: {new Date(statusData.timestamp).toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Active Sources",
            value: activeCount || "–",
            icon: CheckCircle,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-100 dark:bg-emerald-900/30",
          },
          {
            label: "Cached Sources",
            value: cachedCount || "–",
            icon: Archive,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-100 dark:bg-amber-900/30",
          },
          {
            label: "Total Data Points",
            value: totalDataPoints ? totalDataPoints.toLocaleString() : "–",
            icon: Database,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "World Bank Indicators",
            value: wbData ? wbData.indicators.length : "–",
            icon: Zap,
            color: "text-sky-600 dark:text-sky-400",
            bg: "bg-sky-100 dark:bg-sky-900/30",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="border border-border">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <div className={`h-7 w-7 rounded-md ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data sources table */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Data Sources</CardTitle>
          <p className="text-xs text-muted-foreground">Connection status, type, last update, and data points available</p>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-data-sources">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Source</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Type</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Last Updated</th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Data Points</th>
                    <th className="text-right py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source, i) => {
                    const statusCfg = STATUS_CONFIG[source.status] ?? STATUS_CONFIG.cached;
                    const TypeIcon = TYPE_ICONS[source.type] ?? Database;
                    return (
                      <tr
                        key={source.name}
                        className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                        data-testid={`source-row-${source.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <td className="py-3 pr-4">
                          <div>
                            <span className="font-semibold text-foreground">{source.name}</span>
                            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{source.description}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{source.type}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <StatusDot status={source.status} animate={source.status === "active"} />
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusCfg.bg}`}>
                              {source.statusLabel}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(source.lastUpdated)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-sm font-medium">
                          {source.dataPoints.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            data-testid={`link-source-${source.name.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* World Bank Indicators Detail */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                World Bank API — Available Indicators
                {wbData && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nigeria (NGA) education indicators — auto-refreshed every 5 minutes
              </p>
            </div>
            <div className="flex items-center gap-2">
              {wbFetching && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                </span>
              )}
              {wbData && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Fetched {new Date(wbData.fetchedAt).toLocaleTimeString()}
                </Badge>
              )}
              <a
                href="https://api.worldbank.org/v2/country/NGA/indicator/SE.PRM.ENRR?format=json"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                API
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {wbLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : wbData ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {wbData.indicators.map(ind => (
                <WbMiniCard key={ind.code} indicator={ind} />
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground text-sm">
              World Bank data unavailable. Will retry automatically.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data pipeline explanation */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Data Pipeline Architecture</CardTitle>
          <p className="text-xs text-muted-foreground">How EduTrack sources, processes, and serves education data</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: "Live API Sources",
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-100 dark:bg-emerald-900/30",
                items: [
                  "World Bank API — fetched every 5min, server-side cache",
                  "EdoBEST attendance feed — simulated with real baseline",
                  "PLANE SSO visit tracker — GPS-tagged, real-time log",
                ],
              },
              {
                icon: Archive,
                title: "Cached / Static Sources",
                color: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-100 dark:bg-amber-900/30",
                items: [
                  "UBEC NPA 2022/23 — annual survey, 3,400+ data points",
                  "UNESCO UIS — global benchmarks, 120+ indicators",
                  "DHIS2/EdoEMIS — district health & education system",
                  "NBS Nigeria — national statistics bureau data",
                ],
              },
              {
                icon: RefreshCw,
                title: "Refresh Strategy",
                color: "text-sky-600 dark:text-sky-400",
                bg: "bg-sky-100 dark:bg-sky-900/30",
                items: [
                  "Attendance & visits: 30-second polling",
                  "Status health check: 60-second polling",
                  "World Bank data: 5-minute server cache",
                  "Static data: loaded once, no network cost",
                ],
              },
            ].map((section) => (
              <div key={section.title} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-md ${section.bg} flex items-center justify-center flex-shrink-0`}>
                    <section.icon className={`h-3.5 w-3.5 ${section.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{section.title}</span>
                </div>
                <ul className="space-y-1.5">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-muted-foreground/40 flex-shrink-0 mt-0.5">–</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
