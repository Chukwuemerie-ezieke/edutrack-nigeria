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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth, ROLE_LABELS } from "@/contexts/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { UserCog, Plus } from "lucide-react";

const inviteSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "subeb_admin", "head_teacher", "sso", "teacher"]),
  client_id: z.string().optional(),
  school_id: z.string().optional(),
});

type InviteValues = z.infer<typeof inviteSchema>;

const DEMO_USERS = [
  { id: "u1", full_name: "Adaeze Okonkwo", email: "adaeze@edutrack.ng", role: "subeb_admin", client_name: "Anambra State SUBEB", school_name: null, active: true },
  { id: "u2", full_name: "Emeka Nwosu", email: "emeka@school.edu.ng", role: "head_teacher", client_name: "Anambra State SUBEB", school_name: "Gov't Primary School Awka", active: true },
  { id: "u3", full_name: "Chinwe Obi", email: "chinwe@sso.ng", role: "sso", client_name: "Anambra State SUBEB", school_name: null, active: true },
  { id: "u4", full_name: "Tunde Adeleke", email: "tunde@school.edu.ng", role: "head_teacher", client_name: "Anambra State SUBEB", school_name: "Community School Onitsha", active: false },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "text-purple-700 border-purple-300 bg-purple-50 dark:bg-purple-950/40",
  subeb_admin: "text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/40",
  head_teacher: "text-teal-700 border-teal-300 bg-teal-50 dark:bg-teal-950/40",
  sso: "text-orange-700 border-orange-300 bg-orange-50 dark:bg-orange-950/40",
  teacher: "text-gray-700 border-gray-300 bg-gray-50 dark:bg-gray-950/40",
};

export default function ManageUsersPage() {
  const { profile, isDemoMode } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["manage-users", profile?.client_id],
    queryFn: async () => {
      if (!configured || !profile?.client_id) return DEMO_USERS;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, active, client_id, school_id, schools(name), clients(name)")
        .order("full_name");
      return (data || DEMO_USERS).map((u: Record<string, unknown>) => ({
        ...u,
        client_name: (u.clients as { name: string } | null)?.name || "—",
        school_name: (u.schools as { name: string } | null)?.name || null,
      }));
    },
    enabled: !!profile,
  });

  // Fetch clients (for super_admin)
  const { data: clients } = useQuery({
    queryKey: ["manage-clients"],
    queryFn: async () => {
      if (!configured) return [{ id: "demo-client", name: "Anambra State SUBEB (Demo)" }];
      const { data } = await supabase.from("clients").select("id, name").order("name");
      return data || [];
    },
    enabled: configured && profile?.role === "super_admin",
  });

  // Fetch schools
  const { data: schools } = useQuery({
    queryKey: ["manage-schools-for-users", profile?.client_id],
    queryFn: async () => {
      if (!configured || !profile?.client_id) return [];
      const { data } = await supabase
        .from("schools")
        .select("id, name")
        .eq("client_id", profile.client_id)
        .eq("active", true)
        .order("name");
      return data || [];
    },
    enabled: configured && !!profile?.client_id,
  });

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: "teacher",
      client_id: profile?.client_id || "",
      school_id: "",
    },
  });

  const watchRole = form.watch("role");

  const inviteMutation = useMutation({
    mutationFn: async (values: InviteValues) => {
      if (isDemoMode || !configured) {
        await new Promise(res => setTimeout(res, 600));
        return;
      }
      // In production: use Supabase Admin API to create user
      // For now, create profile (user must self-register)
      const tempPassword = `EduTrack${Math.random().toString(36).slice(2, 10)}!`;
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: values.email,
        password: tempPassword,
        user_metadata: {
          full_name: values.full_name,
          role: values.role,
        },
      });
      if (authError) throw authError;
      if (authUser?.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authUser.user.id,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone || null,
          role: values.role,
          client_id: values.client_id || profile?.client_id,
          school_id: values.school_id || null,
        });
        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      toast({
        title: "User invited",
        description: `An invitation has been sent to ${form.getValues("email")}.`,
      });
      setDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["manage-users"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to invite user", description: err.message, variant: "destructive" });
    },
  });

  const displayUsers = (users as typeof DEMO_USERS) || DEMO_USERS;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-[hsl(183_98%_22%)]" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Manage Users</h1>
            <p className="text-sm text-muted-foreground">
              {displayUsers.length} user{displayUsers.length !== 1 ? "s" : ""} in system
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
            onClick={() => setDialogOpen(true)}
            data-testid="button-invite-user"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Client</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">School</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No users yet. Click "Invite User" to add someone.
                  </TableCell>
                </TableRow>
              ) : (
                displayUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${ROLE_COLORS[user.role] || ROLE_COLORS.teacher}`}
                      >
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                      {user.client_name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                      {user.school_name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={user.active
                          ? "text-green-700 border-green-300 bg-green-50 dark:bg-green-950/40"
                          : "text-muted-foreground border-border bg-muted/30"
                        }
                      >
                        {user.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => inviteMutation.mutate(v))} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Adaeze Okonkwo" {...field} data-testid="input-user-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} data-testid="input-user-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="+234..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-user-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="subeb_admin">SUBEB Admin</SelectItem>
                        <SelectItem value="head_teacher">Head Teacher</SelectItem>
                        <SelectItem value="sso">SSO</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {profile?.role === "super_admin" && (
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(clients as { id: string; name: string }[] || []).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(watchRole === "head_teacher" || watchRole === "teacher") && (
                <FormField
                  control={form.control}
                  name="school_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select school" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(schools as { id: string; name: string }[] || []).map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); form.reset(); }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[hsl(183_98%_22%)] hover:bg-[hsl(183_98%_18%)] text-white"
                  disabled={inviteMutation.isPending}
                  data-testid="button-send-invite"
                >
                  {inviteMutation.isPending ? "Sending…" : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
