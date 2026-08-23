import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useRegister } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import {
  Clock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  DollarSign,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Valid email required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[^a-zA-Z0-9]/, "Password must include at least one special character"),
    confirmPassword: z.string(),
    role: z.enum(["organizer", "collaborator"], { required_error: "Select a role" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const registerMutation = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "collaborator",
    },
  });

  const role = watch("role");

  const onSubmit = async (data: FormData) => {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.user as any, res.token);
          const redirect = new URLSearchParams(window.location.search).get("redirect");
          setLocation(redirect ?? "/dashboard");
        },
        onError: (err: any) => {
          toast.error(err?.data?.message ?? err?.message ?? "Registration failed");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row transition-colors duration-200">
      {/* ── LEFT HERO PROMOTIONAL COLUMN (Desktop) ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-10 xl:p-14 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-r border-border">
        {/* Ambient glow effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25 text-primary-foreground font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-foreground font-sans">Horai</span>
              <span className="ml-2.5 text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold tracking-wide border border-primary/25">
                ENTERPRISE
              </span>
            </div>
          </div>
        </div>

        {/* Center Pitch & Visual Showcase */}
        <div className="my-auto py-8 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Thousands of High-Performance Teams</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
            Streamline Event Time Tracking & Financial Clarity.
          </h1>

          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Create your account in seconds. Whether you're an organizer coordinating production crews or a collaborator logging billable hours, Horai keeps every second and dollar transparent.
          </p>

          {/* Embedded Hero Image Showcase */}
          <div className="mt-6 relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-emerald-500/30 blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
              <img
                src="/hero-banner.jpg"
                alt="Horai Dashboard Showcase"
                className="w-full h-auto object-cover max-h-[290px] xl:max-h-[330px]"
                loading="eager"
              />
            </div>
          </div>

          {/* 3 Core Value Props */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-card/60 border border-border/80 backdrop-blur-sm shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-500 mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-foreground">Fast Onboarding</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Instant invite links & QR codes</p>
            </div>

            <div className="p-3 rounded-xl bg-card/60 border border-border/80 backdrop-blur-sm shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 mb-2">
                <MessageSquare className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-foreground">AI Bot Integration</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">WhatsApp & Discord assistant</p>
            </div>

            <div className="p-3 rounded-xl bg-card/60 border border-border/80 backdrop-blur-sm shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary mb-2">
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-foreground">Automated Payroll</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Zero manual math or spreadsheets</p>
            </div>
          </div>
        </div>

        {/* Footer Trust Badges */}
        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground border-t border-border/70 pt-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Bank-Grade 2FA Security</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>GDPR & Privacy Compliant</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT REGISTER FORM COLUMN ───────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-center items-center p-6 sm:p-10 md:p-12 relative min-h-screen">
        {/* Theme Toggle Top Right */}
        <div className="absolute top-6 right-6">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground rounded-xl border-border"
            title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </Button>
        </div>

        <div className="w-full max-w-md page-enter">
          {/* Mobile Logo Banner */}
          <div className="flex lg:hidden items-center gap-3 mb-6 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 text-primary-foreground">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground font-sans">Horai</span>
          </div>

          <div className="glass-card p-8 sm:p-10 shadow-xl border border-border">
            <div className="mb-6 text-center sm:text-left">
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Create Your Account</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Start tracking time and automating payouts with Horai
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground">Full Name</Label>
                <Input
                  placeholder="Jane Smith"
                  data-testid="input-name"
                  className="bg-input/50 border-border focus:border-primary h-10"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground">Email Address</Label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  data-testid="input-email"
                  className="bg-input/50 border-border focus:border-primary h-10"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    data-testid="input-password"
                    className="bg-input/50 border-border focus:border-primary h-10 pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground">Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    data-testid="input-confirm-password"
                    className="bg-input/50 border-border focus:border-primary h-10 pr-10"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-foreground">Role</Label>
                <Select
                  onValueChange={(v) => setValue("role", v as "organizer" | "collaborator")}
                  value={role}
                >
                  <SelectTrigger className="bg-input/50 border-border h-10" data-testid="select-role">
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organizer">Organizer — Manage organizations & teams</SelectItem>
                    <SelectItem value="collaborator">Collaborator — Join events & log hours</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 text-sm mt-3 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                disabled={registerMutation.isPending || isSubmitting}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account & Get Started"}
                {!registerMutation.isPending && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-primary hover:text-primary/80 font-semibold transition-colors inline-flex items-center gap-1 ml-1"
                  onClick={(e) => {
                    e.preventDefault();
                    setLocation("/login");
                  }}
                >
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
