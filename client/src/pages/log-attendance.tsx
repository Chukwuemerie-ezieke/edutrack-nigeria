import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { CalendarDays, CheckCircle2, ClipboardEdit, School } from "lucide-react";

const attendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  total_students_enrolled: z.coerce.number().min(0, "Must be ≥ 0"),
  students_present: z.coerce.number().min(0, "Must be ≥ 0"),
  total_teachers: z.coerce.number().min(0, "Must be ≥ 0"),
  teachers_present: z.coerce.number().min(0, "Must be ≥ 0"),
  teachers_present_morning: z.coerce.number().min(0).optional(),
  teachers_present_midday: z.coerce.number().min(0).optional(),
  teachers_present_afternoon: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
}).refine(d => d.students_present <= d.total_students_enrolled, {
  message: "Present cannot exceed enrolled",
  path: ["students_present"],
}).refine(d => d.teachers_present <= d.total_teachers, {
  message: "Present cannot exceed total",
  path: ["teachers_present"],
});

type AttendanceValues = z.infer<typeof attendanceSchema>;

// Demo data for chart
const DEMO_CHART_DATA = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    date: format(d, "EEE"),
    attendance: Math.round(72 + Math.random() * 20),
  };
});

export default function LogAttendancePage() {
  const { profile, isDemoMode } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const today = format(new Date(), "yyyy-MM-dd");
  const [submitted, setSubmitted] = useState(false);

  // Fetch school info
  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ["school", profile?.school_id],
    queryFn: async () => {
      if (isDemoMode || !configured) {
        return { id: "demo-school", name: "Demo School (All Levels)", total_students: 420, total_teachers: 14 };
      }
      if (!profile?.school_id) return null;
      const { data } = await supabase
        .from("schools")
        .select("*")
        .eq("id", profile.school_id)
        .single();
      return data;
    },
    enabled: !!profile,
  });

  // Check if already submitted today
  const { data: existingRecord } = useQuery({
    queryKey: ["attendance-today", profile?.school_id, today],
    queryFn: async () => {
      if (isDemoMode || !configured || !profile?.school_id) return null;
      const { data } = await supabase
        .from("daily_attendance")
        .select("id, *")
        .eq("school_id", profile.school_id)
        .eq("date", today)
        .single();
      return data as { id: string } | null;
    },
    enabled: configured && !!profile?.school_id,
  });

  // Last 7 days chart data
  const { data: chartData } = useQuery({
    queryKey: ["attendance-chart", profile?.school_id],
    queryFn: async () => {
      if (!configured || !profile?.school_id) return DEMO_CHART_DATA;
      const sevenDaysAgo = format(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      );
      const { data } = await supabase
        .from("daily_attendance")
        .select("date, students_present, total_students_enrolled")
        .eq("school_id", profile.school_id)
        .gte("date", sevenDaysAgo)
        .order("date");
      if (!data || data.length === 0) return DEMO_CHART_DATA;
      return data.map((r: { date: string; students_present: number; total_students_enrolled: number }) => ({
        date: format(new Date(r.date), "EEE"),
        attendance: r.total_students_enrolled > 0
          ? Math.round((r.students_present / r.total_students_enrolled) * 100)
          : 0,
      }));
    },
    enabled: !!profile?.school_id,
  });

  const form = useForm<AttendanceValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      date: today,
      total_students_enrolled: school?.total_students || 0,
      students_present: 0,
      total_teachers: school?.total_teachers || 0,
      teachers_present: 0,
      teachers_present_morning: undefined,
      teachers_present_midday: undefined,
      teachers_present_afternoon: undefined,
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: AttendanceValues) => {
      if (isDemoMode || !configured) {
        // Demo mode: simulate success
        await new Promise(res => setTimeout(res, 800));
        return;
      }
      const payload = {
        client_id: profile!.client_id,
        school_id: profile!.school_id,
        submitted_by: profile!.id,
        date: values.date,
        total_students_enrolled: values.total_students_enrolled,
        students_present: values.students_present,
        total_teachers: values.total_teachers,
        teachers_present: values.teachers_present,
        teachers_present_morning: values.teachers_present_morning || 0,
        teachers_present_midday: values.teachers_present_midday || 0,
        teachers_present_afternoon: values.teachers_present_afternoon || 0,
        notes: values.notes || null,
      };

      if (existingRecord?.id) {
        const { error } = await supabase
          .from("daily_attendance")
          .update(payload)
          .eq("id", existingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("daily_attendance")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Attendance logged successfully",
        description: `Attendance for ${format(new Date(form.getValues("date")), "EEEE, d MMMM yyyy")} has been saved.`,
      });
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-chart"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to save attendance",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AttendanceValues) => mutation.mutate(values);

  const studentPct = form.watch("total_students_enrolled") > 0
    ? Math.round((form.watch("students_present") / form.watch("total_students_enrolled")) * 100)
    : 0;

  const teacherPct = form.watch("total_teachers") > 0
    ? Math.round((form.watch("teachers_present") / form.watch("total_teachers")) * 100)
    : 0;

  const schoolName = school?.name || (profile?.school_id ? "Your School" : "Demo School");

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardEdit className="h-5 w-5 text-[hsl(183_98%_22%)]" />
            <h1 className="text-lg font-bold text-foreground">Log Attendance</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <School className="h-3.5 w-3.5" />
              <span>{schoolLoading ? "Loading…" : schoolName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{format(new Date(), "EEEE, d MMMM yyyy")}</span>
            </div>
          </div>
        </div>
        {isDemoMode && (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 flex-shrink-0">
            Demo Mode
          </Badge>
        )}
      </div>

      {/* Already submitted banner */}
      {(existingRecord || submitted) && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Attendance already submitted for today
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              You can update it below.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Attendance Form</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        max={today}
                        data-testid="input-attendance-date"
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      Today or yesterday for late submissions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Students Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Student Attendance</h3>
                  {form.watch("total_students_enrolled") > 0 && (
                    <Badge
                      variant="outline"
                      className={
                        studentPct >= 80
                          ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-950/40"
                          : studentPct >= 60
                          ? "text-yellow-700 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/40"
                          : "text-red-700 border-red-300 bg-red-50 dark:bg-red-950/40"
                      }
                    >
                      {studentPct}% attendance
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="total_students_enrolled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Enrolled</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            data-testid="input-total-students"
                            className="font-mono tabular-nums"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="students_present"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Present Today</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            data-testid="input-students-present"
                            className="font-mono tabular-nums"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Teachers Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Teacher Attendance</h3>
                  {form.watch("total_teachers") > 0 && (
                    <Badge
                      variant="outline"
                      className={
                        teacherPct >= 90
                          ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-950/40"
                          : teacherPct >= 70
                          ? "text-yellow-700 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/40"
                          : "text-red-700 border-red-300 bg-red-50 dark:bg-red-950/40"
                      }
                    >
                      {teacherPct}% attendance
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="total_teachers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Teachers</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            data-testid="input-total-teachers"
                            className="font-mono tabular-nums"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teachers_present"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Present Today</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            data-testid="input-teachers-present"
                            className="font-mono tabular-nums"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Time-of-day breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "teachers_present_morning" as const, label: "Morning (7:30)" },
                    { name: "teachers_present_midday" as const, label: "Midday (1:45)" },
                    { name: "teachers_present_afternoon" as const, label: "Afternoon (2:30)" },
                  ].map(({ name, label }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">{label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="—"
                              {...field}
                              value={field.value ?? ""}
                              onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                              data-testid={`input-${name}`}
                              className="font-mono tabular-nums text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any observations, issues, or context..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[hsl(183_98%_22%)] hover:bg-[hsl(183_98%_18%)] text-white"
                disabled={mutation.isPending}
                data-testid="button-submit-attendance"
              >
                {mutation.isPending ? "Saving…" : existingRecord || submitted ? "Update Attendance" : "Submit Attendance"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 7-day chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium">
            Last 7 Days — Student Attendance %
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData || DEMO_CHART_DATA} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Attendance"]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                }}
              />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="hsl(183, 98%, 22%)"
                strokeWidth={2}
                dot={{ fill: "hsl(183, 98%, 22%)", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
