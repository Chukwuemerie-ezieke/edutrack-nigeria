import { useState } from "react";
import { useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Zap } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function EduTrackFullLogo() {
  return (
    <svg
      aria-label="EduTrack Nigeria"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12"
    >
      <path
        d="M24 2L42 12V36L24 46L6 36V12L24 2Z"
        fill="hsl(183 60% 22%)"
        opacity="0.3"
      />
      <path
        d="M24 4L40 13.5V34.5L24 44L8 34.5V13.5L24 4Z"
        stroke="hsl(183 60% 45%)"
        strokeWidth="1.5"
        fill="none"
      />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fontFamily="'General Sans', sans-serif"
        fontWeight="700"
        fontSize="14"
        fill="hsl(183 60% 75%)"
        letterSpacing="-0.5"
      >
        ET
      </text>
    </svg>
  );
}

export default function LoginPage() {
  const [, navigate] = useHashLocation();
  const { signIn, profile, isDemoMode } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const getRedirectPath = (role: string) => {
    switch (role) {
      case "head_teacher": return "/log-attendance";
      case "principal": return "/log-attendance";
      case "aeo": return "/";
      case "sso": return "/log-visit";
      default: return "/";
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: signInError } = await signIn(values.email, values.password);
      if (signInError) {
        setError(signInError);
      } else {
        // Navigate based on role (we'll use profile after sign in)
        // For demo mode, profile is already set to super_admin
        navigate("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Banner */}
      <div className="bg-[hsl(183_98%_22%)] px-4 py-3 text-white text-center">
        <p className="text-xs font-medium tracking-wide opacity-90">
          HARMONY DIGITAL CONSULTS LTD — Empowering Education Through Data
        </p>
      </div>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-center gap-2">
          <Zap className="h-4 w-4 text-amber-600" />
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Demo Mode — No Supabase credentials configured. Click "Access Demo" to explore the dashboard.
          </span>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo + Title */}
          <div className="flex flex-col items-center mb-8">
            <EduTrackFullLogo />
            <h1 className="mt-4 text-xl font-bold text-foreground tracking-tight">
              EduTrack Nigeria
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              School Operational Excellence Platform
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Sign in to your account
            </h2>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            className="pl-9"
                            data-testid="input-email"
                            autoComplete="email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-9 pr-10"
                            data-testid="input-password"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end">
                  <a
                    href="mailto:support@harmonydigitalconsults.com?subject=EduTrack Password Reset"
                    className="text-xs text-[hsl(183_98%_30%)] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[hsl(183_98%_22%)] hover:bg-[hsl(183_98%_18%)] text-white"
                  disabled={isSubmitting}
                  data-testid="button-sign-in"
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </Form>

            {isDemoMode && (
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
                  onClick={handleDemoAccess}
                  data-testid="button-demo-access"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Access Demo Dashboard
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <span className="font-medium text-foreground">Harmony Digital Consults Ltd</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              © 2024 · All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
