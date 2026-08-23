import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetEvent,
  useGetOrgMembers,
  useDeleteEvent,
  useCompleteEvent,
  getGetEventQueryKey,
  getGetEventSummaryQueryKey,
} from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout";
import StatusBadge from "@/components/status-badge";
import OverviewTab from "./overview-tab";
import TimeTab from "./time-tab";
import ExpensesTab from "./expenses-tab";
import SummaryTab from "./summary-tab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Clock,
  Receipt,
  BarChart3,
  Trash2,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isOrganizer } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useGetEvent(id, {
    query: { queryKey: getGetEventQueryKey(id) },
  });

  const { data: members = [] } = useGetOrgMembers(event?.org_id ?? "", {
    query: { enabled: !!event?.org_id, queryKey: ["orgMembers", event?.org_id ?? ""] },
  });

  const deleteMutation = useDeleteEvent();
  const completeMutation = useCompleteEvent();

  const handleCompleteEvent = () => {
    if (!event) return;
    completeMutation.mutate(
      { id: event.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetEventSummaryQueryKey(id) });
          toast.success("Event marked as complete");
        },
        onError: (err: any) => {
          toast.error(err?.data?.message ?? err?.message ?? "Cannot complete — pending expenses exist");
        },
      }
    );
  };

  const handleDeleteEvent = () => {
    if (!event) return;
    deleteMutation.mutate(
      { id: event.id },
      {
        onSuccess: () => {
          toast.success("Event deleted successfully");
          if (event?.org_id) {
            setLocation(`/orgs/${event.org_id}`);
          } else {
            setLocation("/dashboard");
          }
        },
        onError: (err: any) => {
          toast.error(err?.message ?? "Failed to delete event");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-foreground font-medium">Event not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => setLocation("/dashboard")} className="hover:text-foreground transition-colors">
            Dashboard
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => setLocation(`/orgs/${event.org_id}`)} className="hover:text-foreground transition-colors">
            Organization
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{event.title}</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(new Date(event.event_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          {/* Actions Dropdown (Organizer only) */}
          {isOrganizer && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg border-border hover:bg-accent shrink-0"
                    title="Event Options"
                    data-testid="button-event-options"
                  >
                    <MoreVertical className="w-4 h-4 text-foreground" />
                    <span className="sr-only">Event Options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-lg">
                  {event.status !== "completed" && (
                    <DropdownMenuItem
                      onClick={handleCompleteEvent}
                      disabled={completeMutation.isPending}
                      className="gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 dark:focus:text-emerald-400 cursor-pointer font-medium"
                      data-testid="menu-mark-completed"
                    >
                      {completeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      Mark Completed
                    </DropdownMenuItem>
                  )}
                  {event.status !== "completed" && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer font-medium"
                    data-testid="menu-delete-event"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                    Delete Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Delete Confirmation Alert Dialog */}
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the event <strong>"{event.title}"</strong>, along with all associated timesheets, logged hours, expenses, and invitations. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDeleteEvent}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Event"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="sticky top-[56px] z-40 bg-background/95 backdrop-blur-md py-2 -mx-4 px-4 border-b border-border sm:border-none sm:bg-transparent sm:backdrop-blur-none sm:relative sm:top-0 sm:py-0 sm:mx-0 sm:px-0">
            <TabsList className="bg-muted/40 border border-border w-full justify-start overflow-x-auto no-scrollbar flex-nowrap h-10">
              <TabsTrigger value="overview" className="gap-2 shrink-0" data-testid="tab-overview">
                <LayoutGrid className="w-3.5 h-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="time" className="gap-2 shrink-0" data-testid="tab-time">
                <Clock className="w-3.5 h-3.5" />
                Time
              </TabsTrigger>
              <TabsTrigger value="expenses" className="gap-2 shrink-0" data-testid="tab-expenses">
                <Receipt className="w-3.5 h-3.5" />
                Expenses
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-2 shrink-0" data-testid="tab-summary">
                <BarChart3 className="w-3.5 h-3.5" />
                Summary
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <OverviewTab event={event} members={members} />
          </TabsContent>

          <TabsContent value="time">
            <TimeTab event={event} />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab event={event} />
          </TabsContent>

          <TabsContent value="summary">
            <SummaryTab event={event} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
