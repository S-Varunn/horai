import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useGetOrg,
  useGetOrgMembers,
  useGetOrgEvents,
  useGetInviteLinks,
  useCreateEvent,
  useCreateInviteLink,
  useRevokeInviteLink,
  getGetOrgQueryKey,
  getGetOrgEventsQueryKey,
  getGetInviteLinksQueryKey,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import StatusBadge from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  Users,
  Link2,
  Plus,
  Copy,
  Trash2,
  Loader2,
  ChevronRight,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function OrgPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isOrganizer } = useAuth();
  const queryClient = useQueryClient();

  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_date: "",
    hourly_rate: "",
  });
  const [eventTitleError, setEventTitleError] = useState("");

  const { data: org, isLoading: orgLoading, error: orgError } = useGetOrg(id, {
    query: { queryKey: getGetOrgQueryKey(id), retry: 1 },
  });
  const { data: members, isLoading: membersLoading } = useGetOrgMembers(id);
  const { data: events, isLoading: eventsLoading } = useGetOrgEvents(id);
  const { data: inviteLinks, isLoading: linksLoading } = useGetInviteLinks(id, {
    query: { enabled: isOrganizer, queryKey: getGetInviteLinksQueryKey(id) },
  });

  const createEventMutation = useCreateEvent();
  const createLinkMutation = useCreateInviteLink();
  const revokeLinkMutation = useRevokeInviteLink();

  const handleCreateEvent = () => {
    if (!eventForm.title.trim() || !eventForm.event_date || !eventForm.hourly_rate) return;
    const duplicate = events?.find(
      (e) => e.title.trim().toLowerCase() === eventForm.title.trim().toLowerCase(),
    );
    if (duplicate) {
      setEventTitleError(`An event named "${duplicate.title}" already exists in this organization`);
      return;
    }
    createEventMutation.mutate(
      {
        orgId: id,
        data: {
          title: eventForm.title.trim(),
          description: eventForm.description || undefined,
          event_date: new Date(eventForm.event_date).toISOString(),
          hourly_rate: parseFloat(eventForm.hourly_rate),
        },
      },
      {
        onSuccess: (event) => {
          queryClient.invalidateQueries({ queryKey: getGetOrgEventsQueryKey(id) });
          setCreateEventOpen(false);
          setEventForm({ title: "", description: "", event_date: "", hourly_rate: "" });
          setEventTitleError("");
          setLocation(`/events/${event.id}`);
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to create event"),
      },
    );
  };

  const handleGenerateLink = () => {
    createLinkMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInviteLinksQueryKey(id) });
          toast.success("Invite link generated");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to generate link"),
      },
    );
  };

  const handleRevokeLink = (linkId: string) => {
    revokeLinkMutation.mutate(
      { id, linkId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInviteLinksQueryKey(id) });
          toast.success("Link revoked");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to revoke link"),
      },
    );
  };

  const buildFrontendInviteUrl = (inviteCode: string) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    return `${window.location.origin}${base}/join/${inviteCode}`;
  };

  const copyLink = (inviteCode: string) => {
    navigator.clipboard.writeText(buildFrontendInviteUrl(inviteCode));
    toast.success("Copied to clipboard");
  };

  if (orgLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!org) {
    return (
      <Layout>
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-foreground font-medium">Organization not found</p>
          {orgError && (
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {(orgError as any)?.message ?? "Could not load organization"}
            </p>
          )}
          <button
            onClick={() => setLocation("/dashboard")}
            className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            ← Back to dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Org header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <button onClick={() => setLocation("/dashboard")} className="hover:text-foreground transition-colors">
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">{org.name}</span>
          </div>
          <div className="flex items-start justify-between mt-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Owner: {org.owner_name}</p>
            </div>
            {isOrganizer && (
              <Button
                onClick={() => setCreateEventOpen(true)}
                className="bg-primary hover:bg-primary/90 gap-2"
                data-testid="button-create-event"
              >
                <Plus className="w-4 h-4" />
                New Event
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList className="bg-muted/40 border border-border">
            <TabsTrigger value="events" className="gap-2" data-testid="tab-events">
              <Calendar className="w-3.5 h-3.5" />
              Events
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2" data-testid="tab-members">
              <Users className="w-3.5 h-3.5" />
              Members
            </TabsTrigger>
            {isOrganizer && (
              <TabsTrigger value="invite-links" className="gap-2" data-testid="tab-invite-links">
                <Link2 className="w-3.5 h-3.5" />
                Invite Links
              </TabsTrigger>
            )}
          </TabsList>

          {/* Events tab */}
          <TabsContent value="events" className="space-y-3">
            {eventsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : !events?.length ? (
              <div className="glass-card p-10 text-center">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-foreground font-medium">No events yet</p>
                {isOrganizer && (
                  <p className="text-sm text-muted-foreground mt-1">Create your first event to get started</p>
                )}
              </div>
            ) : (
              events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setLocation(`/events/${event.id}`)}
                  className="w-full glass-card p-4 text-left hover:border-primary/40 hover-elevate transition-all group"
                  data-testid={`card-event-${event.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{event.title}</p>
                        <StatusBadge status={event.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(event.event_date), "MMM d, yyyy h:mm a")}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${event.hourly_rate}/hr
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          {event.invitation_count} invited
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))
            )}
          </TabsContent>

          {/* Members tab */}
          <TabsContent value="members" className="space-y-2">
            {membersLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : !members?.length ? (
              <div className="glass-card p-10 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-foreground font-medium">No members yet</p>
              </div>
            ) : (
              <div className="glass-card divide-y divide-border overflow-hidden">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-4 py-3" data-testid={`row-member-${member.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs text-primary font-semibold flex-shrink-0">
                        {member.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        member.role === "organizer"
                          ? "bg-primary/15 text-primary"
                          : "bg-accent/15 text-accent"
                      }`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {format(new Date(member.joined_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invite Links tab */}
          {isOrganizer && (
            <TabsContent value="invite-links" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateLink}
                  disabled={createLinkMutation.isPending}
                  className="bg-primary hover:bg-primary/90 gap-2"
                  data-testid="button-generate-link"
                >
                  {createLinkMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Generate New Link
                </Button>
              </div>

              {linksLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : !inviteLinks?.length ? (
                <div className="glass-card p-10 text-center">
                  <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-foreground font-medium">No invite links yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Generate a link to invite collaborators</p>
                </div>
              ) : (
                <div className="glass-card divide-y divide-border overflow-hidden">
                  {inviteLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between px-4 py-3 gap-3" data-testid={`row-link-${link.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-foreground truncate">{buildFrontendInviteUrl(link.invite_code)}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {link.expires_at ? (
                            <span className="text-xs text-muted-foreground">
                              Expires {format(new Date(link.expires_at), "MMM d, yyyy")}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No expiry</span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            link.is_active
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-slate-500/15 text-slate-400"
                          }`}>
                            {link.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyLink(link.invite_code)}
                          data-testid={`button-copy-link-${link.id}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRevokeLink(link.id)}
                          disabled={revokeLinkMutation.isPending}
                          data-testid={`button-revoke-link-${link.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Create event dialog */}
      <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Event title</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => { setEventForm((f) => ({ ...f, title: e.target.value })); setEventTitleError(""); }}
                placeholder="e.g. Spring Concert Setup"
                className={`bg-input/50 ${eventTitleError ? "border-destructive focus:border-destructive" : ""}`}
                data-testid="input-event-title"
              />
              {eventTitleError && (
                <p className="text-xs text-destructive mt-1">{eventTitleError}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={eventForm.description}
                onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description"
                className="bg-input/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Event date & time</Label>
              <Input
                type="datetime-local"
                value={eventForm.event_date}
                onChange={(e) => setEventForm((f) => ({ ...f, event_date: e.target.value }))}
                className="bg-input/50"
                data-testid="input-event-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hourly rate ($/hr)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={eventForm.hourly_rate}
                onChange={(e) => setEventForm((f) => ({ ...f, hourly_rate: e.target.value }))}
                placeholder="25.00"
                className="bg-input/50"
                data-testid="input-hourly-rate"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateEventOpen(false); setEventTitleError(""); }}>Cancel</Button>
            <Button
              onClick={handleCreateEvent}
              disabled={createEventMutation.isPending || !eventForm.title || !eventForm.event_date || !eventForm.hourly_rate}
              data-testid="button-submit-create-event"
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
