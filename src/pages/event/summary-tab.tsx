import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetEventSummary,
  useSetTip,
  useGetExpenses,
  getGetEventSummaryQueryKey,
  getGetExpensesQueryKey,
} from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Clock,
  Car,
  Package,
  Gift,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Receipt,
} from "lucide-react";

interface SummaryTabProps {
  event: any;
}

function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatHours(minutes: number) {
  const h = (minutes / 60).toFixed(2);
  return `${h}h`;
}

export default function SummaryTab({ event }: SummaryTabProps) {
  const { user, isOrganizer } = useAuth();
  const queryClient = useQueryClient();
  const setTipMutation = useSetTip();

  const { data: summary, isLoading: isSummaryLoading } = useGetEventSummary(event.id, {
    query: { queryKey: getGetEventSummaryQueryKey(event.id) },
  });
  const { data: expenses = [], isLoading: isExpensesLoading } = useGetExpenses(event.id, {
    query: { queryKey: getGetExpensesQueryKey(event.id) },
  });

  const isLoading = isSummaryLoading || isExpensesLoading;

  const [tipForms, setTipForms] = useState<Record<string, { amount: string; notes: string }>>({});

  const handleSetTip = (userId: string) => {
    const form = tipForms[userId];
    const amount = parseFloat(form?.amount ?? "0");
    if (!amount || amount < 0) { toast.error("Enter a valid tip amount"); return; }
    setTipMutation.mutate(
      {
        id: event.id,
        userId,
        data: { tip_amount: amount, notes: form?.notes || undefined },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetEventSummaryQueryKey(event.id) });
          toast.success("Tip saved");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to save tip"),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) return null;

  const visibleCollaborators = isOrganizer 
    ? summary.collaborators 
    : summary.collaborators.filter((c: any) => c.user.id === user?.id);

  return (
    <div className="space-y-5">
      {/* Finalized banner */}
      {summary.event.status === "completed" && (
        <div className="rounded-xl border border-emerald-600/40 bg-emerald-500/10 px-5 py-4 flex items-center gap-3" data-testid="banner-finalized">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-400">FINALIZED</p>
            <p className="text-xs text-emerald-400/70">This event is complete. All payouts are locked.</p>
          </div>
        </div>
      )}

      {/* Per-collaborator breakdown */}
      {visibleCollaborators.map((collab: any) => {
        const b = collab.breakdown;
        const userId = collab.user.id;
        const tipForm = tipForms[userId] ?? { amount: String(b.tip > 0 ? b.tip : ""), notes: b.tip_notes ?? "" };

        return (
          <div key={userId} className="glass-card overflow-hidden" data-testid={`card-summary-${userId}`}>
            <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-sm text-primary font-bold">
                  {collab.user.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{collab.user.name}</p>
                  <p className="text-xs text-muted-foreground">{collab.user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Owed</p>
                <p className="text-xl font-bold text-accent" data-testid={`text-total-owed-${userId}`}>
                  {formatMoney(b.total_owed)}
                </p>
              </div>
            </div>

            <div className="px-4 py-4 space-y-3">
              {/* Breakdown rows */}
              <div className="space-y-4">
                {/* 1. WAGE */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>Wage</span>
                    </div>
                    <div className="text-xs text-muted-foreground ml-5">
                      {formatHours(b.total_minutes)} worked @ {formatMoney(b.hourly_rate)}/hr
                    </div>
                  </div>
                  <span className="font-medium text-foreground">{formatMoney(b.base_pay)}</span>
                </div>

                {/* 2. DRIVING (if any) */}
                {b.driving.driving_pay > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-foreground font-semibold">
                        <Car className="w-3.5 h-3.5 text-primary" />
                        <span>Driving</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-5">
                        {b.driving.driver_hours > 0 && `${b.driving.driver_hours}h as driver`}
                        {b.driving.passenger_hours > 0 && `${b.driving.driver_hours > 0 ? " + " : ""}${b.driving.passenger_hours}h as passenger`}
                      </div>
                    </div>
                    <span className="font-medium text-foreground">{formatMoney(b.driving.driving_pay)}</span>
                  </div>
                )}

                {/* 3. EXPENSES / REIMBURSEMENTS */}
                {(b.other_expenses > 0 || expenses.some((e: any) => e.user_id === userId && e.status === "pending")) && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-foreground font-semibold">
                        <Receipt className="w-3.5 h-3.5 text-primary" />
                        <span>Expenses</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-5 space-y-1">
                        {b.other_expenses > 0 && (
                          <div className="text-emerald-400/80">Approved Reimbursement: {formatMoney(b.other_expenses)}</div>
                        )}
                        {expenses.filter((e: any) => e.user_id === userId && e.status === "pending").length > 0 && (
                          <div className="text-yellow-500/80">
                            Pending Approval: {formatMoney(
                              expenses
                                .filter((e: any) => e.user_id === userId && e.status === "pending")
                                .reduce((acc: number, curr: any) => acc + (Number(curr.amount_usd) || 0), 0)
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-foreground">{formatMoney(b.other_expenses)}</span>
                  </div>
                )}

                {/* 4. TIP (if any) */}
                {b.tip > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-foreground font-semibold">
                        <Gift className="w-3.5 h-3.5 text-accent" />
                        <span>Tip</span>
                      </div>
                      {b.tip_notes && (
                        <div className="text-xs text-muted-foreground ml-5 italic">
                          "{b.tip_notes}"
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-accent">{formatMoney(b.tip)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-accent">{formatMoney(b.total_owed)}</span>
              </div>

              {/* Tip input — organizer only */}
              {isOrganizer && summary.event.status !== "completed" && (
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Tip</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Amount ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={tipForm.amount}
                        onChange={(e) =>
                          setTipForms((f) => ({
                            ...f,
                            [userId]: { ...tipForm, amount: e.target.value },
                          }))
                        }
                        className="bg-input/50 border-border h-8 text-sm"
                        data-testid={`input-tip-amount-${userId}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Note (optional)</Label>
                      <Input
                        placeholder="Great work!"
                        value={tipForm.notes}
                        onChange={(e) =>
                          setTipForms((f) => ({
                            ...f,
                            [userId]: { ...tipForm, notes: e.target.value },
                          }))
                        }
                        className="bg-input/50 border-border h-8 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs border-primary/40 text-primary hover:text-primary"
                    onClick={() => handleSetTip(userId)}
                    disabled={setTipMutation.isPending}
                    data-testid={`button-save-tip-${userId}`}
                  >
                    <Gift className="w-3 h-3" />
                    Save Tip
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Grand total — organizer only */}
      {isOrganizer && (
        <div className="glass-card p-5 border-primary/30 glow-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grand Total</p>
                <p className="text-xs text-muted-foreground">{summary.collaborators.length} collaborators</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary" data-testid="text-grand-total">
              {formatMoney(summary.grand_total)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
