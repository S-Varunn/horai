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
import { Clock, Eye, EyeOff, Sun, Moon } from "lucide-react";

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
      role: "collaborator"
    }
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
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 text-primary-foreground">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground font-sans">Horai</span>
        </div>

        <div className="glass-card p-8 shadow-md">
          <h1 className="text-2xl font-bold text-foreground mb-1">Create account</h1>
          <p className="text-muted-foreground text-sm mb-6">Get started with Horai</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Full name</Label>
              <Input
                placeholder="Jane Smith"
                data-testid="input-name"
                className="bg-input/50 border-border focus:border-primary/50"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                data-testid="input-email"
                className="bg-input/50 border-border focus:border-primary/50"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  data-testid="input-password"
                  className="bg-input/50 border-border focus:border-primary/50 pr-10"
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

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  data-testid="input-confirm-password"
                  className="bg-input/50 border-border focus:border-primary/50 pr-10"
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

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Role</Label>
              <Select
                onValueChange={(v) => setValue("role", v as "organizer" | "collaborator")}
                value={role}
              >
                <SelectTrigger className="bg-input/50 border-border" data-testid="select-role">
                  <SelectValue placeholder="Choose your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organizer">Organizer — manage events & teams</SelectItem>
                  <SelectItem value="collaborator">Collaborator — join events & log time</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2"
              disabled={registerMutation.isPending || isSubmitting}
              data-testid="button-register"
            >
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Have an account?{" "}
            <a
              href="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
              onClick={(e) => { e.preventDefault(); setLocation("/login"); }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
