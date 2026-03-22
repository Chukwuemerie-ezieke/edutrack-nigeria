import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  CLASSROOM_DATA,
  INFRASTRUCTURE_METRICS,
  PTR_BY_STATE,
  TEXTBOOK_AVAILABILITY,
} from "@/lib/data";

function InfraBar({ metric, value, pct, total }: { metric: string; value: number; pct: number; total: number }) {
  const color = pct >= 80 ? "hsl(103, 56%, 31%)" : pct >= 60 ? "hsl(183, 98%, 22%)" : pct >= 40 ? "hsl(43, 74%, 49%)" : "hsl(0, 72%, 50%)";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{metric}</span>
        <div className="flex items-center gap-3 text-right">
          <span className="text-xs text-muted-foreground tabular-nums">{value.toLocaleString()} / {total.toLocaleString()}</span>
          <span className="tabular-nums font-bold text-xs min-w-[3rem] text-right" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Resources() {
  const classroomChart = CLASSROOM_DATA.map(c => ({
    category: c.category,
    Public: c.public,
    Private: c.private,
  }));

  const ptrChart = PTR_BY_STATE.map(p => ({
    state: p.state,
    "State PTR": p.ptr,
    "National Avg": p.national,
  }));

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">Resources</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Classroom availability, infrastructure, and learning resource distribution
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
          UBEC NPA 2022/23
        </Badge>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Classrooms", value: "1.27M", note: "All levels combined" },
          { label: "Pupil–Furniture Ratio", value: "4–5:1", note: "National average" },
          { label: "JSS Labs Availability", value: "46%", note: "Of JSS schools" },
          { label: "JSS Toilet Availability", value: "85%", note: "Of JSS schools" },
        ].map((m) => (
          <Card key={m.label} className="border border-border">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold tabular-nums mt-1 text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classroom distribution */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Classrooms by Level & Ownership</CardTitle>
            <p className="text-xs text-muted-foreground">Public vs Private classroom count (thousands)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={classroomChart} margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
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
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{v}</span>} />
                <Bar dataKey="Public" fill="hsl(183, 98%, 22%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Private" fill="hsl(20, 73%, 34%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PTR by state */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Pupil–Teacher Ratio by State</CardTitle>
            <p className="text-xs text-muted-foreground">State PTR vs national average (35:1)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ptrChart} margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="state"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
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
                  formatter={(v: number) => [`${v}:1`, ""]}
                />
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{v}</span>} />
                <Bar dataKey="State PTR" fill="hsl(183, 98%, 22%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="National Avg" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">School Infrastructure Metrics</CardTitle>
          <p className="text-xs text-muted-foreground">Availability as percentage of public schools</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {INFRASTRUCTURE_METRICS.map((m) => (
              <InfraBar
                key={m.metric}
                metric={m.metric}
                value={m.value}
                pct={m.pct}
                total={m.total}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Textbook availability */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Textbook Availability by State</CardTitle>
          <p className="text-xs text-muted-foreground">% of students with access to core textbooks per subject</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={TEXTBOOK_AVAILABILITY} margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="state"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
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
              <Bar dataKey="maths" name="Maths" fill="hsl(183, 98%, 22%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="english" name="English" fill="hsl(43, 74%, 49%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="science" name="Science" fill="hsl(103, 56%, 31%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
