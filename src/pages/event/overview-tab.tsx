import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateEvent,
  useCompleteEvent,
  useSetEventLead,
  useInviteToEvent,
  useRsvpEvent,
  useJoinRequest,
  useReviewRequest,
  getGetEventQueryKey,
} from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import StatusBadge from "@/components/status-badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  DollarSign,
  Calendar,
  Star,
  Users,
  CheckCircle2,
  XCircle,
  Edit2,
  UserPlus,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface OverviewTabProps {
  event: any;
  members: any[];
}

export default function OverviewTab({ event, members }: OverviewTabProps) {
  const { user, isOrganizer } = useAuth();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: event.title,
    description: event.description ?? "",
    event_date: event.event_date ? event.event_date.slice(0, 16) : "",
    hourly_rate: String(event.hourly_rate),
    status: event.status,
  });
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);

  const updateMutation = useUpdateEvent();
  const completeMutation = useCompleteEvent();
  const setLeadMutation = useSetEventLead();
  const inviteMutation = useInviteToEvent();
  const rsvpMutation = useRsvpEvent();

  const joinMutation = useJoinRequest();
  const reviewMutation = useReviewRequest();

  const invitedIds = new Set(event.invitations?.map((i: any) => i.user_id || i.userId) ?? []);
  const acceptedInvitations = event.invitations?.filter((i: any) => i.status === "accepted") ?? [];
  const pendingRequests = event.invitations?.filter((i: any) => i.status === "requested") ?? [];
  const uninvitedMembers = members.filter((m) => !invitedIds.has(m.id));

  const myRsvp = event.my_rsvp ?? event.invitations?.find((i: any) => i.user_id === user?.id || i.email === user?.email)?.status ?? null;
  const isLead = event.lead_collaborator_id === user?.id;

  const handleSaveEdit = () => {
    updateMutation.mutate(
      {
        id: event.id,
        data: {
          title: editForm.title,
          description: editForm.description || undefined,
          event_date: new Date(editForm.event_date).toISOString(),
          hourly_rate: parseFloat(editForm.hourly_rate),
          status: editForm.status as any,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(event.id) });
          setEditOpen(false);
          toast.success("Event updated");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to update event"),
      },
    );
  };

  const handleSetLead = (userId: string) => {
    console.log("Setting lead collaborator to:", userId);
    if (!userId || userId === "invalid") {
      toast.error("Invalid collaborator selected");
      return;
    }
    setLeadMutation.mutate(
      { id: event.id, data: { lead_collaborator_id: userId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(event.id) });
          toast.success("Lead collaborator updated");
        },
        onError: (err: any) => {
          console.error("Set lead error:", err);
          toast.error(err?.data?.message ?? "Failed to set lead");
        },
      },
    );
  };

  const handleInvite = () => {
    if (!selectedInvitees.length) return;
    inviteMutation.mutate(
      {
        id: event.id,
        data: { user_ids: selectedInvitees, invited_at: new Date().toISOString() },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(event.id) });
          setInviteOpen(false);
          setSelectedInvitees([]);
          toast.success("Invitations sent");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to send invites"),
      },
    );
  };

  const handleRsvp = (status: "accepted" | "declined") => {
    rsvpMutation.mutate(
      { id: event.id, data: { status, responded_at: new Date().toISOString() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(event.id) });
          toast.success(`RSVP ${status}`);
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to RSVP"),
      },
    );
  };

  const handleComplete = () => {
    completeMutation.mutate(
      { id: event.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(event.id) });
          toast.success("Event marked as complete");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Cannot complete — pending expenses exist"),
      },
    );
  };

  const toggleInvitee = (id: string) => {
    setSelectedInvitees((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleInviteSelf = () => {
    joinMutation.mutate(
      { id: event.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(event.id) });
          toast.success("Request to join sent");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to send request"),
      },
    );
  };

  const handleReviewRequest = (userId: string, status: "accepted" | "rejected") => {
    reviewMutation.mutate(
      { id: event.id, userId, status },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(event.id) });
          toast.success(`Request ${status}`);
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to review request"),
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* Event info card */}
      <div className="glass-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground">{event.title}</h2>
              <StatusBadge status={event.status} />
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(event.event_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-3.5 h-3.5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rate</p>
                  <p className="text-sm font-medium text-foreground">${event.hourly_rate}/hr</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lead</p>
                  <p className="text-sm font-medium text-foreground">
                    {event.lead_collaborator_name || members.find(m => m.id === event.lead_collaborator_id)?.name || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(isOrganizer || acceptedInvitations.some((i: any) => (i.user_id === user?.id || i.email === user?.email))) && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {isOrganizer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-border"
                  onClick={() => setEditOpen(true)}
                  data-testid="button-edit-event"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-primary/40 text-primary hover:text-primary"
                onClick={() => setInviteOpen(true)}
                data-testid="button-invite-collaborators"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Invite
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Self-join or Requested status for uninvited/pending users */}
      {!isOrganizer && (myRsvp === null || myRsvp === "requested") && (
        <div className={`glass-card p-5 flex items-center justify-between gap-4 ${
          myRsvp === "requested" ? "border-amber-500/30 bg-amber-500/5" : "border-primary/30 bg-primary/5"
        }`}>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {myRsvp === "requested" ? "Join Request Sent" : "Not part of this event?"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {myRsvp === "requested" 
                ? "Your request is waiting for approval from the organizer or lead." 
                : "You can request to join this event to start tracking time and expenses."}
            </p>
          </div>
          {myRsvp === "requested" ? (
            <div className="flex items-center gap-2 text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Pending Approval</span>
            </div>
          ) : (
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90" 
              onClick={() => handleInviteSelf()}
              disabled={joinMutation.isPending}
            >
              <UserPlus className="w-4 h-4" />
              Request to Join
            </Button>
          )}
        </div>
      )}

      {/* Review Join Requests — only for Organizer and Lead */}
      {(isOrganizer || isLead) && pendingRequests.length > 0 && (
        <div className="glass-card overflow-hidden border-amber-500/30">
          <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-500 uppercase tracking-wider">Pending Join Requests</span>
          </div>
          <div className="divide-y divide-border">
            {pendingRequests.map((req: any) => {
              const member = members.find(m => m.email === req.email);
              const targetUserId = req.user_id || req.userId || req.id || member?.id;

              return (
                <div key={req.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xs text-amber-500 font-bold">
                      {req.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => handleReviewRequest(targetUserId, "rejected")}
                      disabled={reviewMutation.isPending}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-7 bg-emerald-600 hover:bg-emerald-600/90 text-white"
                      onClick={() => handleReviewRequest(targetUserId, "accepted")}
                      disabled={reviewMutation.isPending}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collaborator RSVP — only show while pending */}
      {!isOrganizer && myRsvp === "pending" && (
        <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Invitation Received</p>
              <p className="text-xs text-muted-foreground mt-0.5">Please accept or decline this event invitation.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-destructive/40 text-destructive hover:text-destructive"
                onClick={() => handleRsvp("declined")}
                disabled={rsvpMutation.isPending}
                data-testid="button-decline-rsvp"
              >
                <XCircle className="w-3.5 h-3.5" />
                Decline
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-600/90 text-white"
                onClick={() => handleRsvp("accepted")}
                disabled={rsvpMutation.isPending}
                data-testid="button-accept-rsvp"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Organizer actions */}
      {isOrganizer && (
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Lead Collaborator</p>
          </div>
          {acceptedInvitations.length > 0 ? (
            <Select
              value={event.lead_collaborator_id ?? ""}
              onValueChange={handleSetLead}
            >
              <SelectTrigger className="bg-input/50 border-border" data-testid="select-lead">
                <SelectValue placeholder="Select lead collaborator" />
              </SelectTrigger>
              <SelectContent>
                {acceptedInvitations.map((inv: any) => {
                  // Fallback: match by email in the members list if user_id is missing
                  const member = members.find(m => m.email === inv.email);
                  const val = inv.user_id || inv.userId || member?.id;
                  
                  return (
                    <SelectItem key={inv.id} value={val || "invalid"}>
                      {inv.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">No accepted collaborators yet</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {event.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-emerald-600/40 text-emerald-400 hover:text-emerald-400 flex-1"
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                data-testid="button-complete-event"
              >
                {completeMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Invitations table */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Invitations</span>
            <span className="text-xs text-muted-foreground">({event.invitations?.length ?? 0})</span>
          </div>
        </div>
        {!event.invitations?.length ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No invitations sent yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {event.invitations.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3" data-testid={`row-invitation-${inv.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                    {inv.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="bg-input/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="bg-input/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Event date</Label>
              <Input type="datetime-local" value={editForm.event_date} onChange={(e) => setEditForm((f) => ({ ...f, event_date: e.target.value }))} className="bg-input/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Hourly rate ($/hr)</Label>
              <Input type="number" value={editForm.hourly_rate} onChange={(e) => setEditForm((f) => ({ ...f, hourly_rate: e.target.value }))} className="bg-input/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-input/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Collaborators</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {uninvitedMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All org members have been invited</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {uninvitedMembers.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      selectedInvitees.includes(m.id) ? "bg-primary/15 border border-primary/30" : "hover:bg-muted/40 border border-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInvitees.includes(m.id)}
                      onChange={() => toggleInvitee(m.id)}
                      className="sr-only"
                    />
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                      {m.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    {selectedInvitees.includes(m.id) && (
                      <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !selectedInvitees.length}
              data-testid="button-send-invites"
            >
              {inviteMutation.isPending ? "Sending..." : `Invite ${selectedInvitees.length || ""} ${selectedInvitees.length === 1 ? "Person" : "People"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
