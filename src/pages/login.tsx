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
import { Clock, Sun, Moon } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative transition-colors duration-200">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground rounded-xl"
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
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 text-primary-foreground">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground font-sans">Horai</span>
        </div>

        <div className="glass-card p-8 shadow-md">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {twoFactor.required ? "Enter 2FA Code" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {twoFactor.required ? "A 6-digit code has been sent to your email" : "Sign in to your account"}
          </p>

          {twoFactor.required ? (
            <form onSubmit={onVerify} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-sm font-medium text-foreground">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="bg-input/50 border-border focus:border-primary/50 text-center text-2xl tracking-[0.5em] font-mono h-14"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2 transition-all"
                disabled={verifyMutation.isPending || code.length !== 6}
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify & Sign In"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs"
                onClick={() => setTwoFactor({ required: false, userId: null })}
              >
                Back to login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  data-testid="input-email"
                  className="bg-input/50 border-border focus:border-primary/50 transition-colors"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-password"
                  className="bg-input/50 border-border focus:border-primary/50 transition-colors"
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2 transition-all"
                disabled={loginMutation.isPending || isSubmitting}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{" "}
            <a
              href="/register"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
              data-testid="link-register"
              onClick={(e) => { e.preventDefault(); setLocation("/register"); }}
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
