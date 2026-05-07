import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetEventSessions,
  useStartSession,
  useStopSession,
  useGetTimeEntries,
  useAddTimeEntry,
  useDeleteTimeEntry,
  getGetEventSessionsQueryKey,
  getGetTimeEntriesQueryKey,
} from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Play,
  Square,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Timer,
  Tag,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeTabProps {
  event: any;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatElapsed(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TimeTab({ event }: TimeTabProps) {
  const { user, isOrganizer } = useAuth();
  const queryClient = useQueryClient();
  const isLead = event.lead_collaborator_id === user?.id;
  const canLogForOthers = isOrganizer || isLead;

  const acceptedCollaborators = event.invitations?.filter((i: any) => i.status === "accepted") ?? [];

  const isAccepted = event.my_rsvp === "accepted" || 
    event.invitations?.some((i: any) => (i.user_id === user?.id || i.email === user?.email) && i.status === "accepted");

  const { data: sessionsData, isLoading: sessionsLoading } = useGetEventSessions(event.id, {
    query: { queryKey: getGetEventSessionsQueryKey(event.id) },
  });
  const { data: timeEntries, isLoading: entriesLoading } = useGetTimeEntries(event.id, {
    query: { queryKey: getGetTimeEntriesQueryKey(event.id) },
  });

  const startMutation = useStartSession();
  const stopMutation = useStopSession();
  const addEntryMutation = useAddTimeEntry();
  const deleteEntryMutation = useDeleteTimeEntry();

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sessionTitle, setSessionTitle] = useState("");
  const [manualForm, setManualForm] = useState({ hours: "", minutes: "", notes: "", userId: user?.id || "" });
  const [showManual, setShowManual] = useState(false);
  const [timeEntryError, setTimeEntryError] = useState("");

  const activeSession = sessionsData?.sessions?.find((s: any) => !s.stopped_at);

  useEffect(() => {
    if (activeSession) {
      const startMs = new Date(activeSession.started_at).getTime();
      intervalRef.current = setInterval(() => {
        setElapsed(Date.now() - startMs);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeSession?.id]);

  const handleStart = () => {
    startMutation.mutate(
      { 
        id: event.id, 
        data: { 
          started_at: new Date().toISOString(),
          title: sessionTitle.trim() || undefined
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventSessionsQueryKey(event.id) });
          setSessionTitle("");
          toast.success("Session started");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to start session"),
      },
    );
  };

  const handleStop = () => {
    stopMutation.mutate(
      { id: event.id, data: { stopped_at: new Date().toISOString() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventSessionsQueryKey(event.id) });
          toast.success("Session stopped");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to stop session"),
      },
    );
  };

  const handleAddEntry = () => {
    const hrs = parseInt(manualForm.hours) || 0;
    const mins = parseInt(manualForm.minutes) || 0;
    const totalMins = hrs * 60 + mins;

    if (totalMins <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }

    setTimeEntryError("");
    const notesTrimmed = manualForm.notes.trim().toLowerCase();
    const duplicate = timeEntries?.find(
      (e: any) =>
        e.user_id === user?.id &&
        e.minutes_worked === totalMins &&
        (e.notes?.trim().toLowerCase() ?? "") === notesTrimmed,
    );
    if (duplicate) {
      const durationStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      setTimeEntryError(
        `You already logged ${durationStr}${manualForm.notes.trim() ? ` with note "${manualForm.notes.trim()}"` : " with no notes"}`,
      );
      return;
    }
    addEntryMutation.mutate(
      {
        id: event.id,
        data: {
          minutes_worked: totalMins,
          notes: manualForm.notes || undefined,
          entry_at: new Date().toISOString(),
          user_id: canLogForOthers ? (manualForm.userId || undefined) : undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTimeEntriesQueryKey(event.id) });
          setManualForm({ hours: "", minutes: "", notes: "", userId: user?.id || "" });
          setShowManual(false);
          setTimeEntryError("");
          toast.success("Time entry added");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to add entry"),
      },
    );
  };

  const handleDeleteEntry = (entryId: string) => {
    deleteEntryMutation.mutate(
      { id: entryId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTimeEntriesQueryKey(event.id) });
          toast.success("Entry deleted");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to delete entry"),
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* Session control — organizer or lead only */}
      {(isLead || isOrganizer) && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-0.5">Session Control</p>
              <p className="text-xs text-muted-foreground">
                {isOrganizer ? "Organizer access" : "Lead collaborator access"}
              </p>
              
              {!activeSession && (
                <div className="mt-3 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <Input
                    placeholder="Task title (e.g. Unloading)"
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="h-9 pl-9 bg-input/50 text-sm border-border focus:border-primary/50"
                  />
                </div>
              )}

              {activeSession && (
                <div className="mt-2 space-y-1">
                  {activeSession.title && (
                    <p className="text-sm font-medium text-emerald-400/80 flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      {activeSession.title}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-2xl font-mono font-bold text-emerald-400" data-testid="text-elapsed">
                      {formatElapsed(elapsed)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {activeSession ? (
              <Button
                className="gap-2 bg-red-600 hover:bg-red-600/90 text-white glow-primary h-10"
                onClick={handleStop}
                disabled={stopMutation.isPending}
                data-testid="button-stop-session"
              >
                {stopMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                Stop Session
              </Button>
            ) : (
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-600/90 text-white h-10 px-6"
                onClick={handleStart}
                disabled={startMutation.isPending}
                data-testid="button-start-session"
              >
                {startMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Session
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Sessions</span>
          </div>
          {sessionsData && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Total: <strong className="text-foreground">{Number(sessionsData.total_hours ?? 0).toFixed(2)}h</strong></span>
            </div>
          )}
        </div>
        {sessionsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : !sessionsData?.sessions?.length ? (
          <div className="p-8 text-center">
            <Timer className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No sessions recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessionsData.sessions.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between px-4 py-3" data-testid={`row-session-${session.id}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(session.started_at), "MMM d, h:mm a")}
                      {session.stopped_at && (
                        <span className="text-muted-foreground"> → {format(new Date(session.stopped_at), "h:mm a")}</span>
                      )}
                      {!session.stopped_at && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">Live</span>
                      )}
                    </p>
                  </div>
                  {session.title && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground italic">{session.title}</span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-mono font-medium text-foreground">
                  {session.duration_minutes != null ? formatDuration(session.duration_minutes) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual time entries */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Manual Time Entries</span>
          </div>
          {isAccepted && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setShowManual(!showManual)}
              data-testid="button-add-time-entry"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Entry
            </Button>
          )}
        </div>

        {showManual && isAccepted && (
          <div className="px-4 py-4 border-b border-border bg-muted/20 space-y-4">
            {canLogForOthers && (
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  Collaborator
                </Label>
                <Select
                  value={manualForm.userId}
                  onValueChange={(v) => setManualForm(f => ({ ...f, userId: v }))}
                >
                  <SelectTrigger className="bg-input/50 h-8 text-sm">
                    <SelectValue placeholder="Select collaborator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={user?.id || ""}>Myself ({user?.name})</SelectItem>
                    {acceptedCollaborators.filter((c: any) => c.user_id !== user?.id && c.userId !== user?.id).map((c: any) => (
                      <SelectItem key={c.id} value={c.user_id || c.userId}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Hours</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="2"
                  value={manualForm.hours}
                  onChange={(e) => setManualForm((f) => ({ ...f, hours: e.target.value }))}
                  className="bg-input/50 h-8 text-sm"
                  data-testid="input-hours-worked"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Minutes</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="30"
                  value={manualForm.minutes}
                  onChange={(e) => setManualForm((f) => ({ ...f, minutes: e.target.value }))}
                  className="bg-input/50 h-8 text-sm"
                  data-testid="input-minutes-worked"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs">Notes (optional)</Label>
                <Input
                  placeholder="e.g. Setup time"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm((f) => ({ ...f, notes: e.target.value }))}
                  className="bg-input/50 h-8 text-sm"
                />
              </div>
            </div>
            {timeEntryError && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {timeEntryError}
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddEntry} disabled={addEntryMutation.isPending || (!manualForm.hours && !manualForm.minutes)} data-testid="button-submit-time-entry">
                {addEntryMutation.isPending ? "Adding..." : "Add Entry"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowManual(false); setTimeEntryError(""); }}>Cancel</Button>
            </div>
          </div>
        )}

        {entriesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : !timeEntries?.length ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No manual entries yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {timeEntries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3" data-testid={`row-time-entry-${entry.id}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{entry.user_name}</p>
                    <span className="text-xs font-mono text-accent font-semibold">{formatDuration(entry.minutes_worked)}</span>
                  </div>
                  {entry.notes && <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>}
                  <p className="text-xs text-muted-foreground">{format(new Date(entry.entry_at), "MMM d, h:mm a")}</p>
                </div>
                {entry.user_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteEntry(entry.id)}
                    data-testid={`button-delete-entry-${entry.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
