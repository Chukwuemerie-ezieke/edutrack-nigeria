import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import {
  TEACHER_PERFORMANCE_METRICS,
  MONTHLY_TEACHER_PERFORMANCE,
  CORPORAL_PUNISHMENT,
} from "@/lib/data";

const CHART_COLORS = {
  edobest: "hsl(183, 98%, 22%)",
  statusQuo: "hsl(20, 73%, 34%)",
};

export default function Teachers() {
  const radarData = TEACHER_PERFORMANCE_METRICS.slice(0, 6).map(m => ({
    subject: m.metric.replace(" Usage", "").replace(" Received", ""),
    EdoBEST: m.edobest,
    "Status Quo": m.statusQuo,
  }));

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">Teacher Performance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Teacher metrics from EdoBEST programme — P3 cohort data
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
          EdoBEST Effect Report
        </Badge>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Training Attendance", edobest: "96.7%", vs: "11.1%", delta: "+85.6pp" },
          { label: "Electronic Device Usage", edobest: "100%", vs: "0%", delta: "+100pp" },
          { label: "Students Working Hard", edobest: "98.2%", vs: "62.9%", delta: "+35.3pp" },
          { label: "Corporal Punishment", edobest: "6.7%", vs: "14.8%", delta: "-8.1pp", inverse: true },
        ].map((m) => (
          <Card key={m.label} className="border border-border">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold tabular-nums mt-1 text-primary">{m.edobest}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">Status Quo: {m.vs}</p>
                <span className={`text-xs font-semibold ${m.inverse ? "text-emerald-600 dark:text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {m.delta}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison bar chart */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Performance Metrics Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">EdoBEST vs Status Quo schools (%)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={TEACHER_PERFORMANCE_METRICS}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 130 }}
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="metric"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
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
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{v}</span>} />
                <Bar dataKey="edobest" name="EdoBEST" fill={CHART_COLORS.edobest} radius={[0, 4, 4, 0]} />
                <Bar dataKey="statusQuo" name="Status Quo" fill={CHART_COLORS.statusQuo} radius={[0, 4, 4, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar chart */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Teacher Practice Radar</CardTitle>
            <p className="text-xs text-muted-foreground">Multi-dimensional comparison of teaching practices</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Radar
                  name="EdoBEST"
                  dataKey="EdoBEST"
                  stroke={CHART_COLORS.edobest}
                  fill={CHART_COLORS.edobest}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Status Quo"
                  dataKey="Status Quo"
                  stroke={CHART_COLORS.statusQuo}
                  fill={CHART_COLORS.statusQuo}
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{v}</span>} />
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
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly performance trend */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Monthly Teacher Performance Trend</CardTitle>
          <p className="text-xs text-muted-foreground">Punctuality, lesson delivery quality, and feedback rates — EdoBEST schools</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={MONTHLY_TEACHER_PERFORMANCE} margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[60, 100]}
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
                formatter={(v: number) => [`${v}%`, ""]}
              />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{v}</span>} />
              <Line type="monotone" dataKey="punctuality" name="Punctuality" stroke="hsl(183, 98%, 22%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="delivery" name="Lesson Delivery" stroke="hsl(43, 74%, 49%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="feedback" name="Feedback Rate" stroke="hsl(103, 56%, 31%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Corporal punishment */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Positive Discipline Practices</CardTitle>
          <p className="text-xs text-muted-foreground">Reduction in corporal punishment — EdoBEST impact</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Corporal punishment observed:</p>
              {CORPORAL_PUNISHMENT.map(c => (
                <div key={c.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${c.label === "EdoBEST" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {c.value}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.value * 5}%`,
                        background: c.label === "EdoBEST" ? "hsl(103, 56%, 31%)" : "hsl(0, 72%, 50%)",
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                EdoBEST reduced corporal punishment by 54.7% compared to status quo schools.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Praise and positive reinforcement:</p>
              {[
                { label: "EdoBEST", praise: 96.7 },
                { label: "Status Quo", praise: 48.1 },
              ].map(c => (
                <div key={c.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${c.label === "EdoBEST" ? "text-primary" : "text-muted-foreground"}`}>
                      {c.praise}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${c.praise}%`,
                        background: c.label === "EdoBEST" ? "hsl(183, 98%, 22%)" : "hsl(var(--muted-foreground))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
