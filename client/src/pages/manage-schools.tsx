import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Building2, Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

const schoolSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  lga_id: z.string().optional(),
  school_type: z.enum(["public", "private"]),
  level: z.enum(["eccde", "primary", "jss", "sss"]),
  address: z.string().optional(),
  gps_lat: z.coerce.number().optional(),
  gps_lng: z.coerce.number().optional(),
  total_students: z.coerce.number().min(0),
  total_teachers: z.coerce.number().min(0),
  classrooms: z.coerce.number().min(0),
  has_fence: z.boolean().default(false),
  has_lab: z.boolean().default(false),
  has_toilet: z.boolean().default(true),
  has_water: z.boolean().default(false),
});

type SchoolValues = z.infer<typeof schoolSchema>;

const DEMO_SCHOOLS = [
  { id: "d1", name: "Gov't Primary School Awka Central", lga_name: "Awka South", school_type: "public", level: "primary", total_students: 487, total_teachers: 14, active: true },
  { id: "d2", name: "Community School Onitsha Main", lga_name: "Onitsha North", school_type: "public", level: "primary", total_students: 623, total_teachers: 18, active: true },
  { id: "d3", name: "St. Joseph's Primary School", lga_name: "Nnewi North", school_type: "private", level: "primary", total_students: 312, total_teachers: 11, active: true },
  { id: "d4", name: "Aguata Basic School", lga_name: "Aguata", school_type: "public", level: "eccde", total_students: 145, total_teachers: 5, active: true },
  { id: "d5", name: "Ekwusigo Community JSS", lga_name: "Ekwusigo", school_type: "public", level: "jss", total_students: 289, total_teachers: 9, active: false },
  { id: "d6", name: "Government Junior Secondary School Awka", lga_name: "Awka South", school_type: "public", level: "jss", total_students: 356, total_teachers: 12, active: true },
  { id: "d7", name: "Community Senior Secondary School Onitsha", lga_name: "Onitsha North", school_type: "public", level: "sss", total_students: 445, total_teachers: 16, active: true },
  { id: "d8", name: "Model ECCDE Centre Nnewi", lga_name: "Nnewi North", school_type: "public", level: "eccde", total_students: 85, total_teachers: 4, active: true },
];

const DEMO_LGAS = [
  { id: "l1", name: "Awka South" },
  { id: "l2", name: "Onitsha North" },
  { id: "l3", name: "Nnewi North" },
  { id: "l4", name: "Aguata" },
  { id: "l5", name: "Ekwusigo" },
];

const LEVEL_LABELS: Record<string, string> = {
  eccde: "ECCDE",
  primary: "Primary",
  jss: "JSS",
  sss: "SSS",
};

export default function ManageSchoolsPage() {
  const { profile, isDemoMode } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<(typeof DEMO_SCHOOLS)[0] | null>(null);

  // Fetch schools
  const { data: schools, isLoading } = useQuery({
    queryKey: ["manage-schools", profile?.client_id],
    queryFn: async () => {
      if (!configured || !profile?.client_id) return DEMO_SCHOOLS;
      const { data } = await supabase
        .from("schools")
        .select("id, name, lga_id, school_type, level, total_students, total_teachers, active, lgas(name)")
        .eq("client_id", profile.client_id)
        .order("name");
      return (data || DEMO_SCHOOLS).map((s: Record<string, unknown>) => ({
        ...s,
        lga_name: (s.lgas as { name: string } | null)?.name || "—",
      }));
    },
    enabled: !!profile,
  });

  // Fetch LGAs
  const { data: lgas } = useQuery({
    queryKey: ["manage-lgas", profile?.client_id],
    queryFn: async () => {
      if (!configured || !profile?.client_id) return DEMO_LGAS;
      const { data } = await supabase
        .from("lgas")
        .select("id, name")
        .eq("client_id", profile.client_id)
        .order("name");
      return data || DEMO_LGAS;
    },
    enabled: !!profile,
  });

  const form = useForm<SchoolValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
      lga_id: "",
      school_type: "public",
      level: "primary",
      address: "",
      gps_lat: undefined,
      gps_lng: undefined,
      total_students: 0,
      total_teachers: 0,
      classrooms: 0,
      has_fence: false,
      has_lab: false,
      has_toilet: true,
      has_water: false,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: SchoolValues) => {
      if (isDemoMode || !configured) {
        await new Promise(res => setTimeout(res, 600));
        return;
      }
      const payload = {
        ...values,
        client_id: profile!.client_id,
        lga_id: values.lga_id || null,
        address: values.address || null,
        gps_lat: values.gps_lat || null,
        gps_lng: values.gps_lng || null,
      };
      if (editingSchool) {
        const { error } = await supabase.from("schools").update(payload).eq("id", editingSchool.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("schools").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editingSchool ? "School updated" : "School added",
        description: `${form.getValues("name")} has been ${editingSchool ? "updated" : "added"} successfully.`,
      });
      setDialogOpen(false);
      setEditingSchool(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["manage-schools"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save school", description: err.message, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      if (isDemoMode || !configured) {
        await new Promise(res => setTimeout(res, 400));
        return;
      }
      const { error } = await supabase.from("schools").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { active }) => {
      toast({ title: active ? "School activated" : "School deactivated" });
      queryClient.invalidateQueries({ queryKey: ["manage-schools"] });
    },
  });

  const openAdd = () => {
    setEditingSchool(null);
    form.reset();
    setDialogOpen(true);
  };

  const openEdit = (school: (typeof DEMO_SCHOOLS)[0]) => {
    setEditingSchool(school);
    form.reset({
      name: school.name,
      school_type: school.school_type as "public" | "private",
      level: school.level as "eccde" | "primary" | "jss" | "sss",
      total_students: school.total_students,
      total_teachers: school.total_teachers,
      has_fence: false,
      has_lab: false,
      has_toilet: true,
      has_water: false,
      classrooms: 0,
    });
    setDialogOpen(true);
  };

  const displaySchools = isLoading
    ? []
    : (schools as typeof DEMO_SCHOOLS) || DEMO_SCHOOLS;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[hsl(183_98%_22%)]" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Manage Schools</h1>
            <p className="text-sm text-muted-foreground">
              {displaySchools.length} school{displaySchools.length !== 1 ? "s" : ""} registered
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 hidden sm:flex">
              Demo Mode
            </Badge>
          )}
          <Button
            className="bg-[hsl(183_98%_22%)] hover:bg-[hsl(183_98%_18%)] text-white"
            onClick={openAdd}
            data-testid="button-add-school"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add School
          </Button>
        </div>
      </div>

      {/* Schools Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">LGA</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Type</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Level</TableHead>
                <TableHead className="font-semibold text-right hidden sm:table-cell">Students</TableHead>
                <TableHead className="font-semibold text-right hidden sm:table-cell">Teachers</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displaySchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No schools registered yet. Click "Add School" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                displaySchools.map((school) => (
                  <TableRow key={school.id} data-testid={`row-school-${school.id}`}>
                    <TableCell className="font-medium max-w-[200px]">
                      <span className="truncate block">{school.name}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">
                      {school.lga_name || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="capitalize text-sm">{school.school_type}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {LEVEL_LABELS[school.level] || school.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums hidden sm:table-cell">
                      {school.total_students.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums hidden sm:table-cell">
                      {school.total_teachers}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={school.active
                          ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-950/40"
                          : "text-muted-foreground border-border bg-muted/30"
                        }
                      >
                        {school.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(school)}
                          data-testid={`button-edit-school-${school.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toggleActiveMutation.mutate({ id: school.id, active: !school.active })}
                          data-testid={`button-toggle-school-${school.id}`}
                          title={school.active ? "Deactivate" : "Activate"}
                        >
                          {school.active
                            ? <ToggleRight className="h-4 w-4 text-green-600" />
                            : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchool ? "Edit School" : "Add New School"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => saveMutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Government Primary School Awka" {...field} data-testid="input-school-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="lga_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LGA</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select LGA" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(lgas as typeof DEMO_LGAS || DEMO_LGAS).map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="school_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eccde">ECCDE</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="jss">JSS</SelectItem>
                        <SelectItem value="sss">SSS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="gps_lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPS Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 6.2104"
                          {...field}
                          value={field.value ?? ""}
                          onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
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
                      <FormLabel>GPS Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="e.g. 7.0679"
                          {...field}
                          value={field.value ?? ""}
                          onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "total_students" as const, label: "Students" },
                  { name: "total_teachers" as const, label: "Teachers" },
                  { name: "classrooms" as const, label: "Classrooms" },
                ].map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            className="font-mono tabular-nums"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {/* Infrastructure checkboxes */}
              <div>
                <p className="text-sm font-medium mb-3">Infrastructure</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "has_fence" as const, label: "Perimeter Fence" },
                    { name: "has_lab" as const, label: "Laboratory" },
                    { name: "has_toilet" as const, label: "Toilet Facilities" },
                    { name: "has_water" as const, label: "Water Supply" },
                  ].map(({ name, label }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value as boolean}
                              onCheckedChange={field.onChange}
                              data-testid={`checkbox-${name}`}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">{label}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDialogOpen(false); setEditingSchool(null); form.reset(); }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[hsl(183_98%_22%)] hover:bg-[hsl(183_98%_18%)] text-white"
                  disabled={saveMutation.isPending}
                  data-testid="button-save-school"
                >
                  {saveMutation.isPending ? "Saving…" : editingSchool ? "Update School" : "Add School"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
