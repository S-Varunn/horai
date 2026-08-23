import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useLogin, useVerify2FA } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/use-theme";
import { ThemeParticles } from "@/components/theme-particles";
import heroImage from "@/assets/hero-banner.jpg";
import { Clock, Sun, Moon, ArrowRight } from "lucide-react";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const loginMutation = useLogin();
  const verifyMutation = useVerify2FA();

  const [twoFactor, setTwoFactor] = useState<{ required: boolean; userId: string | null }>({
    required: false,
    userId: null,
  });
  const [code, setCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res: any) => {
          if (res.status === "2fa_required") {
            setTwoFactor({ required: true, userId: res.userId });
            toast.info("2FA code sent to your email");
            return;
          }
          login(res.user as any, res.token);
          const redirect = new URLSearchParams(window.location.search).get("redirect");
          setLocation(redirect ?? "/dashboard");
        },
        onError: (err: any) => {
          toast.error(err?.data?.message ?? err?.message ?? "Login failed");
        },
      },
    );
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    verifyMutation.mutate(
      { userId: twoFactor.userId!, code },
      {
        onSuccess: (res: any) => {
          login(res.user as any, res.token);
          const redirect = new URLSearchParams(window.location.search).get("redirect");
          setLocation(redirect ?? "/dashboard");
        },
        onError: (err: any) => {
          toast.error(err?.data?.message ?? "Invalid 2FA code");
        },
      },
    );
  };

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex items-center justify-center p-3 sm:p-6 lg:p-8 relative select-none bg-gradient-to-br from-[#eef5f5] via-[#e5efef] to-[#d8e8e7] dark:from-[#070c0e] dark:via-[#0b1417] dark:to-[#0f2125] text-foreground transition-colors duration-300">
      {/* Dynamic theme-matching particles background */}
      <ThemeParticles />

      {/* Ambient background grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#107a7f_1px,transparent_1px)] [background-size:24px_24px] opacity-25 dark:opacity-15 pointer-events-none" />

      {/* Floating subtle ambient colored glows */}
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
      <div className="w-full max-w-5xl max-h-[90vh] lg:h-[430px] rounded-3xl overflow-hidden border border-slate-300/80 dark:border-teal-900/40 shadow-2xl shadow-teal-950/20 bg-white/95 dark:bg-[#0c1417]/95 backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 relative z-10 page-enter">
        {/* ── LEFT SHOWCASE SECTION (Inside the same card) ────────────────── */}
        <div className="hidden lg:flex lg:col-span-7 h-[430px] relative overflow-hidden bg-slate-950 items-center justify-center border-r border-slate-200/80 dark:border-teal-900/30">
          <img
            src={heroImage}
            alt="Horai Platform Preview"
            className="w-full h-full object-cover object-top"
            loading="eager"
          />
        </div>

        {/* ── RIGHT AUTH FORM SECTION (Inside the same card) ──────────────── */}
        <div className="lg:col-span-5 p-6 sm:p-7 xl:p-8 flex flex-col justify-center bg-transparent h-full">
          {/* Mobile-only Logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-5 justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md text-primary-foreground">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-sans">Horai</span>
          </div>

          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {twoFactor.required ? "Enter 2FA Code" : "Welcome Back"}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              {twoFactor.required
                ? "A 6-digit verification code was sent to your email"
                : "Sign in to access your organizations & timesheets"}
            </p>
          </div>

          {twoFactor.required ? (
            <form onSubmit={onVerify} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-medium text-foreground">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="bg-input/50 border-border focus:border-primary text-center text-xl tracking-[0.5em] font-mono h-12"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 text-xs mt-1 transition-all shadow-md shadow-primary/20"
                disabled={verifyMutation.isPending || code.length !== 6}
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs text-muted-foreground hover:text-foreground h-8"
                onClick={() => setTwoFactor({ required: false, userId: null })}
              >
                Back to login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  data-testid="input-email"
                  className="bg-input/50 border-border focus:border-primary h-10 text-xs transition-colors"
                  {...register("email")}
                />
                {errors.email && <p className="text-[11px] text-destructive mt-0.5">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-password"
                  className="bg-input/50 border-border focus:border-primary h-10 text-xs transition-colors"
                  {...register("password")}
                />
                {errors.password && <p className="text-[11px] text-destructive mt-0.5">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 text-xs mt-2 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
                disabled={loginMutation.isPending || isSubmitting}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In to Horai"}
                {!loginMutation.isPending && <ArrowRight className="w-3.5 h-3.5" />}
              </Button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-teal-900/30 text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-primary hover:text-primary/80 font-semibold transition-colors inline-flex items-center gap-0.5 ml-1"
                data-testid="link-register"
                onClick={(e) => {
                  e.preventDefault();
                  setLocation("/register");
                }}
              >
                Create one now
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
