import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { NATIONAL_OVERVIEW, MONTHLY_ATTENDANCE, STATE_DATA } from "@/lib/data";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardKpis {
  client_id: string;
  client_name: string;
  state: string;
  total_schools: number;
  total_teachers: number;
  total_students: number;
  schools_reported_today: number;
  visits_today: number;
  visits_this_month: number;
}

export interface AttendanceSummaryRow {
  client_id: string;
  school_id: string;
  school_name: string;
  lga_name: string | null;
  days_reported: number;
  avg_student_attendance_pct: number;
  avg_teacher_attendance_pct: number;
  total_students_present: number;
  last_report_date: string;
}

export interface VisitSummaryRow {
  client_id: string;
  school_id: string;
  school_name: string;
  total_visits: number;
  unique_ssos: number;
  last_visit_date: string;
  activities: string[];
}

export interface School {
  id: string;
  client_id: string;
  lga_id: string | null;
  name: string;
  school_type: "public" | "private";
  level: "eccde" | "primary" | "jss" | "sss";
  address: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  total_students: number;
  total_teachers: number;
  has_fence: boolean;
  has_lab: boolean;
  has_toilet: boolean;
  has_water: boolean;
  classrooms: number;
  active: boolean;
}

export interface Lga {
  id: string;
  client_id: string;
  name: string;
  state: string;
}

// ─── Static fallback data ────────────────────────────────────────────────────

const DEMO_KPIS: DashboardKpis = {
  client_id: "demo",
  client_name: "Anambra State SUBEB (Demo)",
  state: "Anambra",
  total_schools: NATIONAL_OVERVIEW.totalSchools,
  total_teachers: NATIONAL_OVERVIEW.totalTeachers,
  total_students: NATIONAL_OVERVIEW.totalEnrollment,
  schools_reported_today: 847,
  visits_today: 23,
  visits_this_month: 1522,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDbData() {
  const { profile, isDemoMode } = useAuth();
  const configured = isSupabaseConfigured();

  const kpisQuery = useQuery({
    queryKey: ["db-kpis", profile?.client_id],
    queryFn: async (): Promise<DashboardKpis | null> => {
      if (!configured || !profile) return null;
      const { data, error } = await supabase
        .from("v_dashboard_kpis")
        .select("*")
        .eq("client_id", profile.client_id || "")
        .single();
      if (error) return null;
      return data as DashboardKpis;
    },
    enabled: configured && !!profile,
    staleTime: 60_000,
  });

  const attendanceSummaryQuery = useQuery({
    queryKey: ["db-attendance-summary", profile?.client_id],
    queryFn: async (): Promise<AttendanceSummaryRow[]> => {
      if (!configured || !profile) return [];
      const { data, error } = await supabase
        .from("v_attendance_summary")
        .select("*")
        .eq("client_id", profile.client_id || "")
        .order("last_report_date", { ascending: false });
      if (error) return [];
      return (data as AttendanceSummaryRow[]) || [];
    },
    enabled: configured && !!profile,
    staleTime: 60_000,
  });

  const visitSummaryQuery = useQuery({
    queryKey: ["db-visit-summary", profile?.client_id],
    queryFn: async (): Promise<VisitSummaryRow[]> => {
      if (!configured || !profile) return [];
      const { data, error } = await supabase
        .from("v_visit_summary")
        .select("*")
        .eq("client_id", profile.client_id || "")
        .order("last_visit_date", { ascending: false });
      if (error) return [];
      return (data as VisitSummaryRow[]) || [];
    },
    enabled: configured && !!profile,
    staleTime: 60_000,
  });

  const schoolsQuery = useQuery({
    queryKey: ["db-schools", profile?.client_id],
    queryFn: async (): Promise<School[]> => {
      if (!configured || !profile) return [];
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("client_id", profile.client_id || "")
        .order("name");
      if (error) return [];
      return (data as School[]) || [];
    },
    enabled: configured && !!profile,
    staleTime: 120_000,
  });

  const lgasQuery = useQuery({
    queryKey: ["db-lgas", profile?.client_id],
    queryFn: async (): Promise<Lga[]> => {
      if (!configured || !profile) return [];
      const { data, error } = await supabase
        .from("lgas")
        .select("*")
        .eq("client_id", profile.client_id || "")
        .order("name");
      if (error) return [];
      return (data as Lga[]) || [];
    },
    enabled: configured && !!profile,
    staleTime: 300_000,
  });

  const isRealData = configured && !!profile && !isDemoMode;

  return {
    isRealData,
    isDemoMode: isDemoMode || !configured,
    clientName: isRealData ? kpisQuery.data?.client_name : DEMO_KPIS.client_name,
    kpis: isRealData ? (kpisQuery.data ?? DEMO_KPIS) : DEMO_KPIS,
    kpisLoading: kpisQuery.isLoading,
    attendanceSummary: isRealData ? attendanceSummaryQuery.data ?? [] : [],
    attendanceLoading: attendanceSummaryQuery.isLoading,
    visitSummary: isRealData ? visitSummaryQuery.data ?? [] : [],
    visitLoading: visitSummaryQuery.isLoading,
    schools: schoolsQuery.data ?? [],
    schoolsLoading: schoolsQuery.isLoading,
    lgas: lgasQuery.data ?? [],
    lgasLoading: lgasQuery.isLoading,
    // Static data always available for charts
    staticMonthlyAttendance: MONTHLY_ATTENDANCE,
    staticStateData: STATE_DATA,
    staticOverview: NATIONAL_OVERVIEW,
  };
}
