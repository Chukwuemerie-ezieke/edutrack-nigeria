import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import {
  READINESS_RADAR,
  NALABE_SCORES,
  READINESS_BY_STATE,
  READINESS_TREND,
} from "@/lib/data";
import { TrendingUp, TrendingDown } from "lucide-react";

function GradeChip({ grade }: { grade: string }) {
  const cls = grade === "Good"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : grade === "Fair"
    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>{grade}</span>;
}

export default function Readiness() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">School Readiness</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Readiness scores, NALABE assessment, and improvement tracking
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
          NALABE · UBEC Report
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "National Avg Score", value: "67/100", note: "Up from 52 in 2019" },
          { label: "Highest State", value: "82", note: "Anambra" },
          { label: "Lowest State", value: "45", note: "Borno" },
          { label: "YoY Improvement", value: "+4.0 pts", note: "Average across 12 states", good: true },
        ].map((m) => (
          <Card key={m.label} className="border border-border">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-2xl font-bold tabular-nums mt-1 ${m.good ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Readiness Domain Scores</CardTitle>
            <p className="text-xs text-muted-foreground">National average score by readiness domain (0–100)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={READINESS_RADAR} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(183, 98%, 22%)"
                  fill="hsl(183, 98%, 22%)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v: number) => [`${v}/100`, "Score"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* State readiness comparison */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Readiness Score by State</CardTitle>
            <p className="text-xs text-muted-foreground">Current score vs previous year</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-1">
              {READINESS_BY_STATE.sort((a, b) => b.score - a.score).map((s) => (
                <div key={s.state} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{s.state}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">prev: {s.prev}</span>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs font-semibold tabular-nums">+{s.change}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-primary min-w-[3rem] text-right">{s.score}/100</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.score}%`,
                        background: s.score >= 75 ? "hsl(103, 56%, 31%)" : s.score >= 60 ? "hsl(183, 98%, 22%)" : "hsl(43, 74%, 49%)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NALABE Assessment Table */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">NALABE Assessment Scores</CardTitle>
          <p className="text-xs text-muted-foreground">National Learning Achievement Baseline — subject breakdown (benchmark: 70%)</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Subject</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Score</th>
                  <th className="text-right py-2 pr-4 font-medium text-muted-foreground text-xs uppercase tracking-wide">Benchmark</th>
                  <th className="text-right py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Grade</th>
                </tr>
              </thead>
              <tbody>
                {NALABE_SCORES.map((row, i) => (
                  <tr key={row.subject} className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
                    <td className="py-2.5 pr-4 font-medium text-foreground">{row.subject}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums font-semibold">
                      <span className={row.score >= 70 ? "text-emerald-600 dark:text-emerald-400" : row.score >= 55 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive"}>
                        {row.score}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">{row.benchmark}%</td>
                    <td className="py-2.5 text-right"><GradeChip grade={row.grade} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Readiness Trend */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">National Readiness Score Trend</CardTitle>
          <p className="text-xs text-muted-foreground">5-year improvement trajectory (2019–2023)</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={READINESS_TREND} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[45, 75]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(v: number) => [`${v}/100`, "Readiness Score"]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(183, 98%, 22%)"
                strokeWidth={2.5}
                dot={{ fill: "hsl(183, 98%, 22%)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
