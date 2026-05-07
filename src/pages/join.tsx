import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useJoinOrg, getGetOrgsQueryKey } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Clock, Building2, Loader2, LogIn } from "lucide-react";

export default function JoinPage() {
  const { invite_code } = useParams<{ invite_code: string }>();
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const joinMutation = useJoinOrg();

  const redirect = encodeURIComponent(`/join/${invite_code}`);

  const handleJoin = () => {
    if (!token) {
      setLocation(`/login?redirect=${redirect}`);
      return;
    }
    joinMutation.mutate(
      { inviteCode: invite_code },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getGetOrgsQueryKey() });
          toast.success(`Joined ${res.organization.name}`);
          setLocation(`/orgs/${res.organization.id}`);
        },
        onError: (err: any) => {
          toast.error(err?.data?.message ?? "Failed to join organization");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md page-enter text-center">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">TimeCrew</span>
        </div>

        <div className="glass-card p-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">You're invited</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You've been invited to join an organization on TimeCrew.
          </p>

          {!token ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Sign in to accept the invite.</p>
              <Button
                onClick={() => setLocation("/login")}
                className="w-full bg-primary hover:bg-primary/90"
                data-testid="button-login-to-join"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign in to join
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation(`/register?redirect=${redirect}`)}
                className="w-full border-border"
                data-testid="button-register-to-join"
              >
                Create account
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="button-join-org"
            >
              {joinMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
              ) : (
                "Join Organization"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
