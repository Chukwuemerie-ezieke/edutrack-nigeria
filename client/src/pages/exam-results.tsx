import { useState, useMemo } from "react";
import { GraduationCap, ArrowUpDown, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { SUBJECT_SCORES_BY_STATE, GENDER_PARITY, STATE_DATA } from "@/lib/data";

const TERMS = ["2025 Term 1", "2025 Term 2", "2025 Term 3", "2026 Term 1"];

type SortKey = "maths" | "english" | "science" | "overall";
type SortDir = "asc" | "desc";

// Derive school-level performance from state data (demo)
const SCHOOL_PERFORMANCE = SUBJECT_SCORES_BY_STATE.flatMap(s => [
  {
    school: `Govt Primary School ${s.state} Central`,
    lga: `${s.state} Central LGA`,
    state: s.state,
    maths: +(s.maths + 8).toFixed(1),
    english: +(s.english + 5).toFixed(1),
    science: +(s.science + 6).toFixed(1),
    overall: +((s.maths + s.english + s.science) / 3 + 6).toFixed(1),
    trend: "↑",
  },
  {
    school: `LEA Primary School ${s.state} South`,
    lga: `${s.state} South LGA`,
    state: s.state,
    maths: +(s.maths - 5).toFixed(1),
    english: +(s.english - 3).toFixed(1),
    science: +(s.science - 4).toFixed(1),
    overall: +((s.maths + s.english + s.science) / 3 - 4).toFixed(1),
    trend: "→",
  },
]);

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600 dark:text-green-400 font-semibold";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400 font-semibold";
  return "text-red-600 dark:text-red-400 font-semibold";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300";
  if (score >= 50) return "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300";
  return "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300";
}

export default function ExamResultsPage() {
  const { isDemoMode } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState("2025 Term 3");
  const [selectedState, setSelectedState] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // KPIs derived from data
  const avgMaths = (SUBJECT_SCORES_BY_STATE.reduce((s, d) => s + d.maths, 0) / SUBJECT_SCORES_BY_STATE.length).toFixed(1);
  const avgEnglish = (SUBJECT_SCORES_BY_STATE.reduce((s, d) => s + d.english, 0) / SUBJECT_SCORES_BY_STATE.length).toFixed(1);
  const passRate = (SUBJECT_SCORES_BY_STATE.filter(d => (d.maths + d.english + d.science) / 3 >= 50).length / SUBJECT_SCORES_BY_STATE.length * 100).toFixed(0);
  const genderGap = (
    GENDER_PARITY.reduce((s, d) => s + d.maleNER, 0) / GENDER_PARITY.length -
    GENDER_PARITY.reduce((s, d) => s + d.femaleNER, 0) / GENDER_PARITY.length
  ).toFixed(1);

  const filteredScores = selectedState === "all"
    ? SUBJECT_SCORES_BY_STATE
    : SUBJECT_SCORES_BY_STATE.filter(d => d.state === selectedState);

  const filteredSchools = useMemo(() => {
    let rows = selectedState === "all"
      ? SCHOOL_PERFORMANCE
      : SCHOOL_PERFORMANCE.filter(s => s.state === selectedState);

    rows = [...rows].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "desc" ? -diff : diff;
    });

    return rows;
  }, [selectedState, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const SUBJECT_COLORS = {
    maths: "#01696F",
    english: "#D4A017",
    science: "#3b82f6",
    social: "#8b5cf6",
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#01696F]/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-[#01696F]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Exam Results &amp; Learning Outcomes</h1>
            <p className="text-sm text-muted-foreground">
              Subject performance analysis across schools and states
              {isDemoMode && <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300 text-xs">Demo Mode</Badge>}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="h-8 w-36 text-xs" data-testid="select-term">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="h-8 w-32 text-xs" data-testid="select-state">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {STATE_DATA.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Avg Maths Score", value: `${avgMaths}%`, sub: "National average", color: "text-[#01696F]" },
          { label: "Avg English Score", value: `${avgEnglish}%`, sub: "National average", color: "text-[#D4A017]" },
          { label: "Overall Pass Rate", value: `${passRate}%`, sub: "Score ≥ 50%", color: "text-green-600" },
          { label: "Gender Gap (NER)", value: `${genderGap}pp`, sub: "Male vs Female", color: "text-blue-600" },
        ].map(card => (
          <Card key={card.label} className="p-3 md:p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </Card>
        ))}
      </div>

      {/* Subject Performance by State — Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Subject Performance by State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredScores} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="state"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="maths" name="Maths" fill={SUBJECT_COLORS.maths} radius={[3, 3, 0, 0]} />
                <Bar dataKey="english" name="English" fill={SUBJECT_COLORS.english} radius={[3, 3, 0, 0]} />
                <Bar dataKey="science" name="Science" fill={SUBJECT_COLORS.science} radius={[3, 3, 0, 0]} />
                <Bar dataKey="social" name="Social Studies" fill={SUBJECT_COLORS.social} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* School Performance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">School Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs pl-4">School</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">LGA</TableHead>
                  <TableHead
                    className="text-xs text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("maths")}
                    data-testid="sort-maths"
                  >
                    <span className="flex items-center justify-center gap-1">
                      Maths <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("english")}
                    data-testid="sort-english"
                  >
                    <span className="flex items-center justify-center gap-1">
                      English <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-center cursor-pointer hover:text-foreground hidden md:table-cell"
                    onClick={() => handleSort("science")}
                    data-testid="sort-science"
                  >
                    <span className="flex items-center justify-center gap-1">
                      Science <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("overall")}
                    data-testid="sort-overall"
                  >
                    <span className="flex items-center justify-center gap-1">
                      Overall <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead className="text-xs text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map(school => (
                  <TableRow key={school.school} data-testid={`row-school-${school.school.replace(/\s+/g, "-")}`}>
                    <TableCell className="text-xs pl-4">
                      <div className="font-medium">{school.school}</div>
                      <div className="text-muted-foreground sm:hidden">{school.lga}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{school.lga}</TableCell>
                    <TableCell className={`text-xs text-center ${scoreColor(school.maths)}`}>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] ${scoreBg(school.maths)}`}>{school.maths}%</span>
                    </TableCell>
                    <TableCell className={`text-xs text-center ${scoreColor(school.english)}`}>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] ${scoreBg(school.english)}`}>{school.english}%</span>
                    </TableCell>
                    <TableCell className={`text-xs text-center hidden md:table-cell ${scoreColor(school.science)}`}>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] ${scoreBg(school.science)}`}>{school.science}%</span>
                    </TableCell>
                    <TableCell className={`text-xs text-center ${scoreColor(school.overall)}`}>
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${scoreBg(school.overall)}`}>{school.overall}%</span>
                    </TableCell>
                    <TableCell className="text-xs text-center">{school.trend}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gender Parity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Gender Parity Analysis — Net Enrollment Rate by State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {GENDER_PARITY.filter(d => selectedState === "all" || d.state === selectedState).map(d => (
            <div key={d.state} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium w-20 flex-shrink-0">{d.state}</span>
                <div className="flex items-center gap-2 flex-1 mx-3">
                  {/* Male bar */}
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="h-2 rounded-full bg-muted relative overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#01696F]"
                        style={{ width: `${d.maleNER}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#01696F]">M: {d.maleNER}%</span>
                  </div>
                  {/* Female bar */}
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="h-2 rounded-full bg-muted relative overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#D4A017]"
                        style={{ width: `${d.femaleNER}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#D4A017]">F: {d.femaleNER}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 w-20 justify-end flex-shrink-0">
                  <span className="text-muted-foreground">GPI: </span>
                  <span className={d.gpi >= 0.95 ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
                    {d.gpi.toFixed(2)}
                  </span>
                  {d.gpi >= 0.95 && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            GPI ≥ 0.95 indicates gender parity in enrollment. <CheckCircle2 className="inline h-3 w-3 text-green-500" /> marks states that have achieved parity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
