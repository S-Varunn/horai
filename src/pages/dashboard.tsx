import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  useGetOrgs,
  getGetOrgsQueryKey,
  useCreateOrg,
  useJoinOrg,
  useToggle2FA,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Building2, Plus, Link, Users, Calendar, ChevronRight, Loader2, ShieldCheck, ShieldAlert, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function DashboardPage() {
  const { isOrganizer } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgNameError, setOrgNameError] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  
  const getTabFromUrl = () => new URLSearchParams(window.location.search).get("tab") || "organizations";
  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  useEffect(() => {
    const handleUrlChange = () => {
      setActiveTab(getTabFromUrl());
    };

    // Listen for both browser back/forward and manual pushState calls
    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("locationchange", handleUrlChange);
    
    // Check periodically as a fallback for router-only changes
    const interval = setInterval(handleUrlChange, 100);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("locationchange", handleUrlChange);
      clearInterval(interval);
    };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLocation(`/dashboard?tab=${value}`);
  };

  const { user } = useAuth() as any;
  const toggle2FAMutation = useToggle2FA();
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.two_factor_enabled ?? false);

  const { data: orgs, isLoading } = useGetOrgs();

  const createOrgMutation = useCreateOrg();
  const joinOrgMutation = useJoinOrg();

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    const duplicate = orgs?.find(
      (o) => o.name.trim().toLowerCase() === orgName.trim().toLowerCase(),
    );
    if (duplicate) {
      setOrgNameError(`You already belong to an organization named "${duplicate.name}"`);
      return;
    }
    createOrgMutation.mutate(
      { data: { name: orgName.trim() } },
      {
        onSuccess: (org) => {
          queryClient.invalidateQueries({ queryKey: getGetOrgsQueryKey() });
          setCreateOpen(false);
          setOrgName("");
          setOrgNameError("");
          setLocation(`/orgs/${org.id}`);
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to create organization"),
      },
    );
  };

  const handleToggle2FA = (enabled: boolean) => {
    toggle2FAMutation.mutate(
      { enabled },
      {
        onSuccess: () => {
          setIs2FAEnabled(enabled);
          toast.success(`2FA ${enabled ? "enabled" : "disabled"}`);
        },
        onError: (err: any) => {
          toast.error(err?.data?.message ?? "Failed to update 2FA settings");
        },
      },
    );
  };

  const handleJoinOrg = async () => {
    const raw = inviteInput.trim();
    if (!raw) return;
    const code = raw.includes("/join/") ? raw.split("/join/").pop()!.trim() : raw;
    joinOrgMutation.mutate(
      { inviteCode: code },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getGetOrgsQueryKey() });
          setJoinOpen(false);
          setInviteInput("");
          toast.success(`Joined ${res.organization.name}`);
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to join organization"),
      },
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {activeTab === "security" ? "Security Settings" : "Organizations"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeTab === "security" 
                ? "Manage your account security and 2FA" 
                : (isOrganizer ? "Manage your organizations and teams" : "Your organizations and events")}
            </p>
          </div>
          {activeTab === "organizations" && (
            isOrganizer ? (
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-primary hover:bg-primary/90 gap-2 shrink-0"
                data-testid="button-create-org"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">New Organization</span>
                <span className="xs:hidden">New</span>
              </Button>
            ) : (
              <Button
                onClick={() => setJoinOpen(true)}
                variant="outline"
                className="gap-2 border-border shrink-0"
                data-testid="button-join-org"
              >
                <Link className="w-4 h-4" />
                <span className="hidden xs:inline">Join Organization</span>
                <span className="xs:hidden">Join</span>
              </Button>
            )
          )}
        </div>

        {/* Tabs for Organizations and Security */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="hidden sm:flex bg-muted/40 border border-border">
            <TabsTrigger value="organizations" className="gap-2">
              <Building2 className="w-3.5 h-3.5" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !orgs?.length ? (
              <div className="glass-card p-12 text-center">
                <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-foreground font-medium">No organizations yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isOrganizer
                    ? "Create your first organization to get started"
                    : "Ask an organizer for an invite link to join"}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setLocation(`/orgs/${org.id}`)}
                    className="glass-card p-5 text-left hover:border-primary/40 hover-elevate transition-all group"
                    data-testid={`card-org-${org.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{org.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{org.owner_name}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span data-testid={`text-member-count-${org.id}`}>{org.member_count} members</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span data-testid={`text-event-count-${org.id}`}>{org.event_count} events</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  is2FAEnabled ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                }`}>
                  {is2FAEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Two-Factor Authentication (2FA)</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add an extra layer of security to your account by requiring a code sent to your email during login.
                      </p>
                    </div>
                    <Switch
                      checked={is2FAEnabled}
                      onCheckedChange={handleToggle2FA}
                      disabled={toggle2FAMutation.isPending}
                    />
                  </div>
                  
                  <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      How it works
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-2 list-disc ml-4">
                      <li>Once enabled, signing in will require a 6-digit code.</li>
                      <li>The code will be sent to your registered email address: <strong>{user?.email}</strong></li>
                      <li>Codes are valid for a limited time and can only be used once.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create org dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Organization name</Label>
            <Input
              value={orgName}
              onChange={(e) => { setOrgName(e.target.value); setOrgNameError(""); }}
              placeholder="e.g. Event Productions LLC"
              className={`bg-input/50 ${orgNameError ? "border-destructive focus:border-destructive" : ""}`}
              data-testid="input-org-name"
              onKeyDown={(e) => e.key === "Enter" && handleCreateOrg()}
            />
            {orgNameError && (
              <p className="text-xs text-destructive mt-1">{orgNameError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setOrgNameError(""); }}>Cancel</Button>
            <Button
              onClick={handleCreateOrg}
              disabled={createOrgMutation.isPending || !orgName.trim()}
              data-testid="button-submit-create-org"
            >
              {createOrgMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join org dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Invite link or code</Label>
            <Input
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="Paste invite URL or code"
              className="bg-input/50"
              data-testid="input-invite-code"
              onKeyDown={(e) => e.key === "Enter" && handleJoinOrg()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinOpen(false)}>Cancel</Button>
            <Button
              onClick={handleJoinOrg}
              disabled={joinOrgMutation.isPending || !inviteInput.trim()}
              data-testid="button-submit-join-org"
            >
              {joinOrgMutation.isPending ? "Joining..." : "Join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
