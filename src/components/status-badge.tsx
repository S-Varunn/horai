import { cn } from "@/lib/utils";

type StatusVariant =
  | "pending" | "requested" | "accepted" | "declined"
  | "draft" | "scheduled" | "active" | "completed"
  | "approved" | "rejected";

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

const labels: Record<StatusVariant, string> = {
  pending: "Pending",
  requested: "Requested",
  accepted: "Accepted",
  declined: "Declined",
  draft: "Draft",
  scheduled: "Scheduled",
  active: "Active",
  completed: "Completed",
  approved: "Approved",
  rejected: "Rejected",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        `status-${status}`,
        className
      )}
      data-testid={`status-${status}`}
    >
      {labels[status]}
    </span>
  );
}
