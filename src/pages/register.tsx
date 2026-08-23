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
import { ThemeParticles } from "@/components/theme-particles";
import heroImage from "@/assets/hero-banner.jpg";
import { Clock, Eye, EyeOff, Sun, Moon, ArrowRight } from "lucide-react";

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
    <div className="h-screen max-h-screen w-screen overflow-hidden flex items-center justify-center p-3 sm:p-6 lg:p-8 relative select-none bg-gradient-to-br from-[#eef5f5] via-[#e5efef] to-[#d8e8e7] dark:from-[#070c0e] dark:via-[#0b1417] dark:to-[#0f2125] text-foreground transition-colors duration-300">
      {/* Dynamic theme-matching particles background */}
      <ThemeParticles />

      {/* Ambient background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#107a7f_1px,transparent_1px)] [background-size:24px_24px] opacity-25 dark:opacity-15 pointer-events-none" />

      {/* Floating subtle ambient glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#107a7f]/20 dark:bg-[#107a7f]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#145357]/20 dark:bg-[#145357]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground rounded-xl border-border bg-card/80 backdrop-blur-md shadow-sm"
          title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-primary" />
          )}
        </Button>
      </div>

      {/* ── UNIFIED SINGLE CARD CONTAINER ─────────────────────────────────── */}
      <div className="w-full max-w-5xl max-h-[94vh] lg:h-[515px] rounded-3xl overflow-hidden border border-slate-300/80 dark:border-teal-900/40 shadow-2xl shadow-teal-950/20 bg-white/95 dark:bg-[#0c1417]/95 backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 relative z-10 page-enter">
        {/* ── LEFT SHOWCASE SECTION (Inside the same card) ────────────────── */}
        <div className="hidden lg:flex lg:col-span-7 h-[515px] relative overflow-hidden bg-slate-950 items-center justify-center border-r border-slate-200/80 dark:border-teal-900/30">
          <img
            src={heroImage}
            alt="Horai Platform Preview"
            className="w-full h-full object-cover object-top"
            loading="eager"
          />
        </div>

        {/* ── RIGHT REGISTER FORM SECTION (Inside the same card) ────────────── */}
        <div className="lg:col-span-5 p-5 sm:p-6 lg:p-7 flex flex-col justify-center bg-transparent h-full">
          {/* Mobile-only Logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-4 justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md text-primary-foreground">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-sans">Horai</span>
          </div>

          <div className="mb-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Create Account</h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              Start tracking time and automating payouts with Horai
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium text-foreground">Full Name</Label>
              <Input
                placeholder="Jane Smith"
                data-testid="input-name"
                className="bg-input/50 border-border focus:border-primary h-9 text-xs"
                {...register("name")}
              />
              {errors.name && <p className="text-[10px] text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-0.5">
              <Label className="text-xs font-medium text-foreground">Email Address</Label>
              <Input
                type="email"
                placeholder="name@company.com"
                data-testid="input-email"
                className="bg-input/50 border-border focus:border-primary h-9 text-xs"
                {...register("email")}
              />
              {errors.email && <p className="text-[10px] text-destructive">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    data-testid="input-password"
                    className="bg-input/50 border-border focus:border-primary h-9 text-xs pr-8"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-0.5">
                <Label className="text-xs font-medium text-foreground">Confirm</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    data-testid="input-confirm-password"
                    className="bg-input/50 border-border focus:border-primary h-9 text-xs pr-8"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-[10px] text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="space-y-0.5">
              <Label className="text-xs font-medium text-foreground">Role</Label>
              <Select
                onValueChange={(v) => setValue("role", v as "organizer" | "collaborator")}
                value={role}
              >
                <SelectTrigger className="bg-input/50 border-border h-9 text-xs" data-testid="select-role">
                  <SelectValue placeholder="Choose your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organizer">Organizer — Manage organizations & teams</SelectItem>
                  <SelectItem value="collaborator">Collaborator — Join events & log hours</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-[10px] text-destructive">{errors.role.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 text-xs mt-2 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
              disabled={registerMutation.isPending || isSubmitting}
              data-testid="button-register"
            >
              {registerMutation.isPending ? "Creating Account..." : "Create Account & Get Started"}
              {!registerMutation.isPending && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-teal-900/30 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-primary hover:text-primary/80 font-semibold transition-colors inline-flex items-center gap-0.5 ml-1"
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
  );
}
