import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type UserRole = "super_admin" | "subeb_admin" | "aeo" | "head_teacher" | "principal" | "sso" | "teacher";

export interface UserProfile {
  id: string;
  client_id: string | null;
  school_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo user for when Supabase is not configured
const DEMO_PROFILE: UserProfile = {
  id: "demo-user",
  client_id: "00000000-0000-0000-0000-000000000001",
  school_id: null,
  full_name: "Demo Administrator",
  email: "demo@edutrack.ng",
  phone: null,
  role: "super_admin",
  active: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = !isSupabaseConfigured();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      setProfile(data as UserProfile);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, auto-set the demo profile
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (isDemoMode) {
      // Demo mode: accept any credentials
      setProfile(DEMO_PROFILE);
      return { error: null };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Login failed" };
    }
  };

  const signOut = async () => {
    if (!isDemoMode) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    if (isDemoMode) {
      // In demo mode, re-set demo profile after "sign out" on next load
      // We clear it to simulate sign-out
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, isDemoMode, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Role hierarchy helper
export const ROLE_LEVELS: Record<UserRole, number> = {
  teacher: 1,
  sso: 2,
  head_teacher: 3,
  principal: 3,
  aeo: 3.5,
  subeb_admin: 4,
  super_admin: 5,
};

export function hasRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[minRole];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  subeb_admin: "SUBEB Admin",
  head_teacher: "Head Teacher",
  sso: "SSO",
  teacher: "Teacher",
};
