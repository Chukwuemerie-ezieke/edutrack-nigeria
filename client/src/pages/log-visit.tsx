import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  MapPinPlus, Navigation, Clock, MapPin, CheckCircle2
} from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "lesson_observation", label: "Lesson Observation" },
  { value: "coaching_session", label: "Coaching Session" },
  { value: "ht_interview", label: "HT Interview" },
  { value: "enrollment_check", label: "Enrollment Check" },
  { value: "infrastructure_audit", label: "Infrastructure Audit" },
  { value: "material_delivery", label: "Material Delivery" },
  { value: "other", label: "Other" },
];

const visitSchema = z.object({
  school_id: z.string().min(1, "Select a school"),
  activity: z.enum([
    "lesson_observation",
    "coaching_session",
    "ht_interview",
    "enrollment_check",
    "infrastructure_audit",
    "material_delivery",
    "other",
  ], { required_error: "Select an activity" }),
  gps_lat: z.coerce.number().optional(),
  gps_lng: z.coerce.number().optional(),
  observations: z.string().optional(),
  recommendations: z.string().optional(),
  teacher_observed: z.string().optional(),
  photo_url: z.string().optional(),
});

type VisitValues = z.infer<typeof visitSchema>;

// Demo schools for demo mode
const DEMO_SCHOOLS = [
  { id: "demo-1", name: "Government Primary School Awka", lga: "Awka South" },
  { id: "demo-2", name: "Community School Onitsha Central", lga: "Onitsha North" },
  { id: "demo-3", name: "St. Joseph Primary School Nnewi", lga: "Nnewi North" },
  { id: "demo-4", name: "Aguata Basic School", lga: "Aguata" },
];

// Demo recent visits
const DEMO_VISITS = [
  { id: "v1", school: "Government Primary School Awka", activity: "Lesson Observation", time: "09:14 AM" },
  { id: "v2", school: "Community School Onitsha Central", activity: "Coaching Session", time: "11:32 AM" },
];

export default function LogVisitPage() {
  const { profile, isDemoMode } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch schools
  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ["visit-schools", profile?.client_id],
    queryFn: async () => {
      if (!configured || !profile?.client_id) return DEMO_SCHOOLS;
      const { data } = await supabase
        .from("schools")
        .select("id, name, lga_id, lgas(name)")
        .eq("client_id", profile.client_id)
        .eq("active", true)
        .order("name");
      return data || DEMO_SCHOOLS;
    },
    enabled: !!profile,
  });

  // Today's visits by this SSO
  const { data: todaysVisits } = useQuery({
    queryKey: ["todays-visits", profile?.id],
    queryFn: async () => {
      if (!configured || !profile?.id) return DEMO_VISITS;
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("visits")
        .select("id, school_id, activity, arrival_time, schools(name)")
        .eq("sso_id", profile.id)
        .eq("visit_date", today)
        .order("arrival_time", { ascending: false });
      return data || [];
    },
    enabled: !!profile,
  });

  const form = useForm<VisitValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      school_id: "",
      activity: undefined,
      gps_lat: undefined,
      gps_lng: undefined,
      observations: "",
      recommendations: "",
      teacher_observed: "",
      photo_url: "",
    },
  });

  const watchActivity = form.watch("activity");

  // Auto-capture GPS
  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGpsCoords(coords);
        form.setValue("gps_lat", coords.lat);
        form.setValue("gps_lng", coords.lng);
        setGpsStatus("success");
      },
      () => {
        setGpsStatus("error");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    captureGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation({
    mutationFn: async (values: VisitValues) => {
      if (isDemoMode || !configured) {
        await new Promise(res => setTimeout(res, 800));
        return;
      }
      const payload = {
        client_id: profile!.client_id,
        school_id: values.school_id,
        sso_id: profile!.id,
        visit_date: format(new Date(), "yyyy-MM-dd"),
        arrival_time: new Date().toISOString(),
        activity: values.activity,
        gps_lat: values.gps_lat || null,
        gps_lng: values.gps_lng || null,
        observations: values.observations || null,
        recommendations: values.recommendations || null,
        teacher_observed: values.teacher_observed || null,
        photo_url: values.photo_url || null,
      };
      const { error } = await supabase.from("visits").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Visit logged successfully",
        description: "Your school support visit has been recorded.",
      });
      form.reset({
        school_id: "",
        activity: undefined,
        gps_lat: gpsCoords?.lat,
        gps_lng: gpsCoords?.lng,
        observations: "",
        recommendations: "",
        teacher_observed: "",
        photo_url: "",
      });
      queryClient.invalidateQueries({ queryKey: ["todays-visits"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to log visit",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: VisitValues) => mutation.mutate(values);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPinPlus className="h-5 w-5 text-[hsl(183_98%_22%)]" />
            <h1 className="text-lg font-bold text-foreground">Log School Visit</h1>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{format(new Date(), "EEEE, d MMMM yyyy · HH:mm")}</span>
          </div>
        </div>
        {isDemoMode && (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 flex-shrink-0">
            Demo Mode
          </Badge>
        )}
      </div>

      {/* GPS Status Bar */}
      <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${
        gpsStatus === "success"
          ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800"
          : gpsStatus === "error"
          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
          : "bg-muted/50 border-border"
      }`}>
        {gpsStatus === "success" ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-800 dark:text-green-300">GPS captured</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                {gpsCoords?.lat.toFixed(6)}, {gpsCoords?.lng.toFixed(6)}
              </p>
            </div>
          </>
        ) : gpsStatus === "loading" ? (
          <>
            <Navigation className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Getting your location…</p>
          </>
        ) : gpsStatus === "error" ? (
          <>
            <MapPin className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-amber-700 dark:text-amber-400">Location unavailable</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">You can enter coordinates manually</p>
            </div>
            <Button size="sm" variant="outline" onClick={captureGps} className="text-xs h-7">
              Retry
            </Button>
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Requesting location…</p>
          </>
        )}
      </div>

      {/* Visit Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Visit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* School */}
              <FormField
                control={form.control}
                name="school_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-school">
                          <SelectValue placeholder={schoolsLoading ? "Loading schools…" : "Select a school"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(isDemoMode || !configured ? DEMO_SCHOOLS : (schools as typeof DEMO_SCHOOLS) || DEMO_SCHOOLS).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Activity Type */}
              <FormField
                control={form.control}
                name="activity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-activity">
                          <SelectValue placeholder="Select activity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* GPS coordinates (manual override) */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="gps_lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 6.3350"
                          {...field}
                          value={field.value ?? ""}
                          onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          data-testid="input-gps-lat"
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gps_lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 6.2433"
                          {...field}
                          value={field.value ?? ""}
                          onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          data-testid="input-gps-lng"
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observations */}
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observations <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What did you observe during this visit?"
                        rows={3}
                        className="resize-none"
                        {...field}
                        data-testid="input-observations"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recommendations */}
              <FormField
                control={form.control}
                name="recommendations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommendations <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any recommendations or follow-up actions..."
                        rows={3}
                        className="resize-none"
                        {...field}
                        data-testid="input-recommendations"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Teacher Observed (conditional) */}
              {watchActivity === "lesson_observation" && (
                <FormField
                  control={form.control}
                  name="teacher_observed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher Observed</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Full name of teacher observed"
                          {...field}
                          data-testid="input-teacher-observed"
                        />
                      </FormControl>
                      <FormDescription>Required for lesson observations</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Photo URL */}
              <FormField
                control={form.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        data-testid="input-photo"
                        className="cursor-pointer"
                        onChange={(e) => {
                          // For now, just store the filename as placeholder
                          const file = e.target.files?.[0];
                          if (file) {
                            field.onChange(`pending_upload:${file.name}`);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Photo proof of visit (upload coming soon)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[hsl(183_98%_22%)] hover:bg-[hsl(183_98%_18%)] text-white"
                disabled={mutation.isPending}
                data-testid="button-submit-visit"
              >
                {mutation.isPending ? "Logging visit…" : "Log Visit"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Today's Visits */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today's Visits ({isDemoMode ? DEMO_VISITS.length : (todaysVisits?.length || 0)})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {(isDemoMode ? DEMO_VISITS : (todaysVisits as typeof DEMO_VISITS) || []).map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between py-2.5 px-3 bg-muted/40 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{visit.school}</p>
                  <p className="text-xs text-muted-foreground">
                    {ACTIVITY_OPTIONS.find(a => a.value === visit.activity)?.label || visit.activity}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground font-mono flex-shrink-0 ml-3">
                  {visit.time}
                </div>
              </div>
            ))}
            {!isDemoMode && (!todaysVisits || todaysVisits.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No visits logged today yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
