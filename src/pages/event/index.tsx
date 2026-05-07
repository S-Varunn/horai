import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import {
  useGetEvent,
  useGetOrgMembers,
  getGetEventQueryKey,
} from "@/lib/api-client";
import Layout from "@/components/layout";
import StatusBadge from "@/components/status-badge";
import OverviewTab from "./overview-tab";
import TimeTab from "./time-tab";
import ExpensesTab from "./expenses-tab";
import SummaryTab from "./summary-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Clock,
  Receipt,
  BarChart3,
} from "lucide-react";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: event, isLoading } = useGetEvent(id, {
    query: { queryKey: getGetEventQueryKey(id) },
  });

  const { data: members = [] } = useGetOrgMembers(event?.org_id ?? "", {
    query: { enabled: !!event?.org_id, queryKey: ["orgMembers", event?.org_id ?? ""] },
  });

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
