import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  School, Users, UserCheck, CalendarDays, MapPin, GraduationCap, ClipboardCheck,
} from "lucide-react";

// ─── Demo data (used when Supabase is not configured) ─────────────────────
const DEMO_SCHOOL = {
  id: "demo-school",
  name: "Gov't Primary School Awka",
  level: "primary",
  lga_name: "Awka South",
  client_name: "Anambra State SUBEB",
  total_students: 420,
  total_teachers: 14,
  active: true,
};

const DEMO_ATTENDANCE = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const day = d.getDay();
  const isWeekend = day === 0 || day === 6;
  return {
    date: d.toISOString().slice(0, 10),
    total_students_enrolled: 420,
    students_present: isWeekend ? 0 : 340 + Math.floor(Math.random() * 60),
    total_teachers: 14,
    teachers_present: isWeekend ? 0 : 11 + Math.floor(Math.random() * 3),
  };
});

const DEMO_TEACHERS = [
  { id: "t1", full_name: "Ngozi Eze", subject: "Mathematics", qualification: "B.Ed", is_qualified: true, training_completed: true },
  { id: "t2", full_name: "Chukwuma Okafor", subject: "English", qualification: "NCE", is_qualified: true, training_completed: true },
  { id: "t3", full_name: "Amina Bello", subject: "Basic Science", qualification: "B.Sc", is_qualified: true, training_completed: false },
  { id: "t4", full_name: "Obinna Nwachukwu", subject: "Social Studies", qualification: "SSCE", is_qualified: false, training_completed: false },
  { id: "t5", full_name: "Fatima Yusuf", subject: "Civic Education", qualification: "NCE", is_qualified: true, training_completed: true },
];

const DEMO_VISITS = [
  { id: "v1", visit_date: "2026-04-08", activity: "Routine Monitoring", observations: "Good classroom management observed", recommendations: "Increase reading materials", sso_name: "Chinwe Obi" },
  { id: "v2", visit_date: "2026-03-22", activity: "Teacher Support Visit", observations: "Two teachers absent without notice", recommendations: "Follow up on teacher absenteeism", sso_name: "Emeka Nwosu" },
  { id: "v3", visit_date: "2026-03-10", activity: "Infrastructure Check", observations: "Roof needs repair in Block C", recommendations: "Submit maintenance request to LGA", sso_name: "Chinwe Obi" },
];

// ─── Component ────────────────────────────────────────────────────────────
export default function MySchoolPage() {
  const { profile, isDemoMode } = useAuth();
  const configured = isSupabaseConfigured();
  const schoolId = profile?.school_id;

  // ── School info ─────────────────────────────────────────────────────────
  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ["my-school-info", schoolId],
    queryFn: async () => {
      if (!configured || !schoolId) return DEMO_SCHOOL;
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, level, active, total_students, total_teachers, lgas(name), clients(name)")
        .eq("id", schoolId)
        .single();
      if (error) throw error;
      return {
        ...data,
        lga_name: (data.lgas as { name: string } | null)?.name || "—",
        client_name: (data.clients as { name: string } | null)?.name || "—",
      };
    },
    enabled: !!profile,
  });

  // ── Attendance (last 14 days) ───────────────────────────────────────────
  const { data: attendance, isLoading: attLoading } = useQuery({
    queryKey: ["my-school-attendance", schoolId],
    queryFn: async () => {
      if (!configured || !schoolId) return DEMO_ATTENDANCE;
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const { data, error } = await supabase
        .from("daily_attendance")
        .select("date, total_students_enrolled, students_present, total_teachers, teachers_present")
        .eq("school_id", schoolId)
        .gte("date", since.toISOString().slice(0, 10))
        .order("date");
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  // ── Teachers ────────────────────────────────────────────────────────────
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ["my-school-teachers", schoolId],
    queryFn: async () => {
      if (!configured || !schoolId) return DEMO_TEACHERS;
      const { data, error } = await supabase
        .from("teachers")
        .select("id, full_name, subject, qualification, is_qualified, training_completed")
        .eq("school_id", schoolId)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile,
  });

  // ── Visits ──────────────────────────────────────────────────────────────
  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ["my-school-visits", schoolId],
    queryFn: async () => {
      if (!configured || !schoolId) return DEMO_VISITS;
      const { data, error } = await supabase
        .from("visits")
        .select("id, visit_date, activity, observations, recommendations, profiles!sso_id(full_name)")
        .eq("school_id", schoolId)
        .order("visit_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map((v: Record<string, unknown>) => ({
        ...v,
        sso_name: (v.profiles as { full_name: string } | null)?.full_name || "—",
      }));
    },
    enabled: !!profile,
  });

  // ── Computed stats ──────────────────────────────────────────────────────
  const weekdayAttendance = (attendance || []).filter(a => {
    const d = new Date(a.date);
    return d.getDay() !== 0 && d.getDay() !== 6;
  });
  const avgStudentRate = weekdayAttendance.length > 0
    ? Math.round(weekdayAttendance.reduce((s, a) => s + (a.students_present / (a.total_students_enrolled || 1)) * 100, 0) / weekdayAttendance.length)
    : 0;
  const avgTeacherRate = weekdayAttendance.length > 0
    ? Math.round(weekdayAttendance.reduce((s, a) => s + (a.teachers_present / (a.total_teachers || 1)) * 100, 0) / weekdayAttendance.length)
    : 0;
  const qualifiedCount = (teachers || []).filter(t => t.is_qualified).length;
  const trainedCount = (teachers || []).filter(t => t.training_completed).length;

  const chartData = (attendance || []).map(a => ({
    date: a.date.slice(5), // MM-DD
    studentRate: a.total_students_enrolled ? Math.round((a.students_present / a.total_students_enrolled) * 100) : 0,
    teacherRate: a.total_teachers ? Math.round((a.teachers_present / a.total_teachers) * 100) : 0,
  }));

  const schoolData = school || DEMO_SCHOOL;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <School className="h-5 w-5 text-[hsl(183_98%_22%)]" />
          <div>
            {schoolLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <>
                <h1 className="text-lg font-bold text-foreground">{schoolData.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {schoolData.lga_name} · {schoolData.client_name}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-xs">
              Demo Mode
            </Badge>
          )}
          {schoolData.active && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/40 text-xs">
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* School Info KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Students" value={schoolData.total_students ?? 0} loading={schoolLoading} />
        <KpiCard icon={UserCheck} label="Teachers" value={schoolData.total_teachers ?? 0} loading={schoolLoading} />
        <KpiCard icon={CalendarDays} label="Avg Student Att." value={`${avgStudentRate}%`} loading={attLoading} />
        <KpiCard icon={ClipboardCheck} label="Avg Teacher Att." value={`${avgTeacherRate}%`} loading={attLoading} />
      </div>

      {/* Attendance Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[hsl(183_98%_22%)]" />
            Attendance — Last 14 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No attendance data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="studentRate" stroke="hsl(183, 60%, 40%)" strokeWidth={2} name="Students" dot={{ r: 2 }} />
                <Line type="monotone" dataKey="teacherRate" stroke="hsl(270, 60%, 55%)" strokeWidth={2} name="Teachers" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance Log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[hsl(183_98%_22%)]" />
            Recent Attendance Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Enrolled</TableHead>
                  <TableHead className="font-semibold">Present</TableHead>
                  <TableHead className="font-semibold">Rate</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Teachers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (attendance || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No records yet.</TableCell>
                  </TableRow>
                ) : (
                  [...(attendance || [])].reverse().slice(0, 10).map((a, i) => {
                    const rate = a.total_students_enrolled ? Math.round((a.students_present / a.total_students_enrolled) * 100) : 0;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{a.date}</TableCell>
                        <TableCell>{a.total_students_enrolled}</TableCell>
                        <TableCell>{a.students_present}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={rate >= 80 ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-950/40" : rate >= 60 ? "text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/40" : "text-red-700 border-red-300 bg-red-50 dark:bg-red-950/40"}>
                            {rate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{a.teachers_present}/{a.total_teachers}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Teachers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[hsl(183_98%_22%)]" />
            Teachers
            {!teachersLoading && teachers && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({qualifiedCount}/{teachers.length} qualified · {trainedCount} trained)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Qualification</TableHead>
                  <TableHead className="font-semibold">Qualified</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">Trained</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachersLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (teachers || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No teachers registered.</TableCell>
                  </TableRow>
                ) : (
                  (teachers || []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.full_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.subject || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{t.qualification || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={t.is_qualified ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-950/40" : "text-red-700 border-red-300 bg-red-50 dark:bg-red-950/40"}>
                          {t.is_qualified ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className={t.training_completed ? "text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/40" : "text-muted-foreground border-border bg-muted/30"}>
                          {t.training_completed ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Visits */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[hsl(183_98%_22%)]" />
            Recent SSO Visits
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Activity</TableHead>
                  <TableHead className="font-semibold hidden sm:table-cell">SSO</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Observations</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Recommendations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (visits || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No visits recorded.</TableCell>
                  </TableRow>
                ) : (
                  (visits || []).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium whitespace-nowrap">{v.visit_date}</TableCell>
                      <TableCell className="text-sm">{v.activity}</TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{v.sso_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden md:table-cell max-w-[200px] truncate">{v.observations || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden md:table-cell max-w-[200px] truncate">{v.recommendations || "—"}</TableCell>
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

// ─── Small KPI card ───────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, loading }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-[hsl(183_98%_22%)]/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-[hsl(183_98%_22%)]" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-5 w-12" />
          ) : (
            <p className="text-lg font-bold text-foreground">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
