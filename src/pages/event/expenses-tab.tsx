import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetExpenses,
  useSubmitExpense,
  useDeleteExpense,
  useReviewExpense,
  getGetExpensesQueryKey,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Car,
  Package,
  MoreHorizontal,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Receipt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ExpensesTabProps {
  event: any;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  driving: Car,
  material: Package,
  other: MoreHorizontal,
};

export default function ExpensesTab({ event }: ExpensesTabProps) {
  const { user, isOrganizer } = useAuth();
  const queryClient = useQueryClient();

  // my_rsvp is set by backend for collaborators; fall back to scanning invitations list by ID or email
  const myRsvpValue = event.my_rsvp ?? event.invitations?.find((i: any) => i.user_id === user?.id || i.email === user?.email)?.status;
  const isAccepted = isOrganizer || myRsvpValue === "accepted";

  const { data: expenses, isLoading } = useGetExpenses(event.id, {
    query: { queryKey: getGetExpensesQueryKey(event.id) },
  });

  const submitMutation = useSubmitExpense();
  const deleteMutation = useDeleteExpense();
  const reviewMutation = useReviewExpense();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "material" as "driving" | "material" | "other",
    hours_driven: "",
    is_passenger: false,
    amount_usd: "",
    description: "",
    receipt_note: "",
  });
  const [expenseError, setExpenseError] = useState("");

  const [reviewForms, setReviewForms] = useState<Record<string, { comment: string }>>({});

  const handleSubmit = () => {
    setExpenseError("");
    const base = {
      type: form.type,
      receipt_note: form.receipt_note || undefined,
      submitted_at: new Date().toISOString(),
    };

    let data: any = base;
    if (form.type === "driving") {
      if (!form.hours_driven) { toast.error("Hours driven required"); return; }
      const hrs = parseFloat(form.hours_driven);
      const duplicate = expenses?.find(
        (e: any) =>
          e.user_id === user?.id &&
          e.type === "driving" &&
          e.hours_driven === hrs &&
          e.is_passenger === form.is_passenger &&
          e.status !== "rejected",
      );
      if (duplicate) {
        setExpenseError(
          `You already have a ${form.is_passenger ? "passenger " : ""}driving expense for ${hrs}h with status "${duplicate.status}"`,
        );
        return;
      }
      data = { ...base, hours_driven: hrs, is_passenger: form.is_passenger };
    } else {
      if (!form.amount_usd) { toast.error("Amount required"); return; }
      if (!form.description.trim()) { toast.error("Description required"); return; }
      const amt = parseFloat(form.amount_usd);
      const duplicate = expenses?.find(
        (e: any) =>
          e.user_id === user?.id &&
          e.type === form.type &&
          e.description?.trim().toLowerCase() === form.description.trim().toLowerCase() &&
          e.amount_usd === amt &&
          e.status !== "rejected",
      );
      if (duplicate) {
        setExpenseError(
          `You already submitted an identical expense ("${form.description}" — $${amt.toFixed(2)}) with status "${duplicate.status}"`,
        );
        return;
      }
      data = { ...base, amount_usd: amt, description: form.description };
    }

    submitMutation.mutate(
      { id: event.id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey(event.id) });
          setShowForm(false);
          setForm({ type: "material", hours_driven: "", is_passenger: false, amount_usd: "", description: "", receipt_note: "" });
          setExpenseError("");
          toast.success("Expense submitted");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to submit expense"),
      },
    );
  };

  const handleDelete = (expenseId: string) => {
    deleteMutation.mutate(
      { id: expenseId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey(event.id) });
          toast.success("Expense deleted");
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to delete expense"),
      },
    );
  };

  const handleReview = (expenseId: string, status: "approved" | "rejected") => {
    const comment = reviewForms[expenseId]?.comment ?? "";
    reviewMutation.mutate(
      { id: expenseId, data: { status, organizer_comment: comment || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey(event.id) });
          toast.success(`Expense ${status}`);
        },
        onError: (err: any) => toast.error(err?.data?.message ?? "Failed to review expense"),
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* Submit form */}
      {isAccepted && (
        <div className="glass-card overflow-hidden">
          <button
            className="w-full px-4 py-3 flex items-center justify-between border-b border-border hover:bg-muted/20 transition-colors"
            onClick={() => setShowForm(!showForm)}
            data-testid="button-toggle-expense-form"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Submit Expense</span>
            </div>
            {showForm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showForm && (
            <div className="px-4 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Expense type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))}>
                  <SelectTrigger className="bg-input/50 border-border" data-testid="select-expense-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driving">Driving</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.type === "driving" ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hours driven</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="2.5"
                      value={form.hours_driven}
                      onChange={(e) => setForm((f) => ({ ...f, hours_driven: e.target.value }))}
                      className="bg-input/50 border-border"
                      data-testid="input-hours-driven"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is-passenger"
                      checked={form.is_passenger}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, is_passenger: !!v }))}
                      data-testid="checkbox-is-passenger"
                    />
                    <Label htmlFor="is-passenger" className="text-sm cursor-pointer">I was a passenger</Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Amount ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="25.00"
                      value={form.amount_usd}
                      onChange={(e) => setForm((f) => ({ ...f, amount_usd: e.target.value }))}
                      className="bg-input/50 border-border"
                      data-testid="input-expense-amount"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="e.g. Extension cables"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="bg-input/50 border-border"
                      data-testid="input-expense-description"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Receipt note <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  placeholder="e.g. Receipt #4521"
                  value={form.receipt_note}
                  onChange={(e) => setForm((f) => ({ ...f, receipt_note: e.target.value }))}
                  className="bg-input/50 border-border"
                />
              </div>

              {expenseError && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {expenseError}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-expense"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Expense"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setExpenseError(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expenses list */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Expenses</span>
            <span className="text-xs text-muted-foreground">({expenses?.length ?? 0})</span>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : !expenses?.length ? (
          <div className="p-8 text-center">
            <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No expenses submitted yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {expenses.map((expense: any) => {
              const Icon = TYPE_ICONS[expense.type] ?? MoreHorizontal;
              return (
                <div key={expense.id} className="px-4 py-4 space-y-2" data-testid={`row-expense-${expense.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{expense.user_name}</p>
                          <StatusBadge status={expense.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{expense.type}</p>
                        {expense.type === "driving" && (
                          <p className="text-xs text-foreground mt-0.5">
                            {expense.hours_driven}h driven
                            {expense.is_passenger && " (passenger)"}
                          </p>
                        )}
                        {expense.amount_usd != null && (
                          <p className="text-xs font-semibold text-accent mt-0.5">${Number(expense.amount_usd).toFixed(2)}</p>
                        )}
                        {expense.description && (
                          <p className="text-xs text-muted-foreground">{expense.description}</p>
                        )}
                        {expense.organizer_comment && (
                          <p className="text-xs text-muted-foreground italic mt-1">"{expense.organizer_comment}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {expense.user_id === user?.id && expense.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(expense.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-expense-${expense.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Organizer review */}
                  {isOrganizer && expense.status === "pending" && (
                    <div className="pl-10 space-y-2">
                      <Input
                        placeholder="Comment (optional)"
                        value={reviewForms[expense.id]?.comment ?? ""}
                        onChange={(e) =>
                          setReviewForms((f) => ({
                            ...f,
                            [expense.id]: { comment: e.target.value },
                          }))
                        }
                        className="bg-input/50 border-border h-8 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 text-xs border-destructive/40 text-destructive hover:text-destructive"
                          onClick={() => handleReview(expense.id, "rejected")}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-reject-expense-${expense.id}`}
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-600/90 text-white"
                          onClick={() => handleReview(expense.id, "approved")}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-approve-expense-${expense.id}`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
