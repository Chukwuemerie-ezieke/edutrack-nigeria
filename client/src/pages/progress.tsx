import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  LEARNING_OUTCOMES,
  SUBJECT_SCORES_BY_STATE,
  GENDER_PARITY,
  PROGRESSION_RATES,
} from "@/lib/data";

const CHART_COLORS = {
  edobest: "hsl(183, 98%, 22%)",
  statusQuo: "hsl(20, 73%, 34%)",
  maths: "hsl(183, 98%, 22%)",
  english: "hsl(43, 74%, 49%)",
  science: "hsl(103, 56%, 31%)",
  social: "hsl(20, 73%, 34%)",
};

function GpiBar({ value, state }: { value: number; state: string }) {
  const color = value >= 1 ? "hsl(103, 56%, 31%)" : value >= 0.9 ? "hsl(183, 98%, 22%)" : value >= 0.8 ? "hsl(43, 74%, 49%)" : "hsl(0, 72%, 50%)";
  const pct = Math.min(value / 1.1 * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{state}</span>
        <span className="tabular-nums font-bold text-xs" style={{ color }}>
          {value.toFixed(2)} GPI {value >= 1 ? "✓" : value < 0.85 ? "⚠" : ""}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Progress() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">Student Progress</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Learning outcomes, progression rates, and gender parity metrics
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
          EdoBEST & NALABE Data
        </Badge>
      </div>

      {/* Learning outcome impact cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {LEARNING_OUTCOMES.map((item) => (
          <Card key={item.subject} className="border border-border">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.subject} — P3 Assessment</p>
                  <div className="mt-3 flex items-end gap-6">
                    <div>
                      <p className="text-3xl font-bold tabular-nums text-primary">{item.edobest}%</p>
                      <p className="text-xs text-primary/70 mt-0.5">EdoBEST schools</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums text-muted-foreground">{item.statusQuo}%</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Status Quo</p>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Effect Size</p>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">{item.effectSize}</p>
                  <p className="text-xs text-muted-foreground">SD</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ~⅔ to ¾ extra year of instruction equivalent.
                  <span className="font-medium text-foreground"> Girls drove the largest gains.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject scores by state */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Assessment Scores by State</CardTitle>
            <p className="text-xs text-muted-foreground">Core subject average scores (%)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={SUBJECT_SCORES_BY_STATE} margin={{ top: 4, right: 16, bottom: 4, left: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="state"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 80]}
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
                <Bar dataKey="maths" name="Maths" fill={CHART_COLORS.maths} radius={[3, 3, 0, 0]} />
                <Bar dataKey="english" name="English" fill={CHART_COLORS.english} radius={[3, 3, 0, 0]} />
                <Bar dataKey="science" name="Science" fill={CHART_COLORS.science} radius={[3, 3, 0, 0]} />
                <Bar dataKey="social" name="Social Studies" fill={CHART_COLORS.social} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Parity */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Gender Parity Index (GPI)</CardTitle>
            <p className="text-xs text-muted-foreground">Female/Male NER ratio · 1.0 = parity · green = achieved</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {GENDER_PARITY.map((g) => (
                <GpiBar key={g.state} state={g.state} value={g.gpi} />
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                {GENDER_PARITY.map((g) => (
                  <div key={g.state} className="text-xs">
                    <span className="font-semibold text-foreground">{g.state}: </span>
                    <span className="text-muted-foreground">M {g.maleNER}% · F {g.femaleNER}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progression rates */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Grade-Level Progression Rates</CardTitle>
          <p className="text-xs text-muted-foreground">Students progressing to next grade (%) — national averages. Note JSS transition gap.</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={PROGRESSION_RATES} margin={{ top: 4, right: 24, bottom: 4, left: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="grade"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                domain={[40, 105]}
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
              <Bar dataKey="enrolled" name="Enrolled (indexed)" fill="hsl(183, 98%, 22%)" opacity={0.4} radius={[3, 3, 0, 0]} />
              <Bar dataKey="progressed" name="Progressed" fill="hsl(183, 98%, 22%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            JSS NER of 29% vs primary NER of 81% shows a significant transition gap — a key policy intervention area.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
