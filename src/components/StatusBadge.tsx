import { STATUS_LABELS, type JobStatus } from "@/lib/jobs";
import { cn } from "@/lib/utils";

const styles: Record<JobStatus, string> = {
  saved: "bg-status-saved-soft text-status-saved",
  applied: "bg-status-applied-soft text-status-applied",
  interview: "bg-status-interview-soft text-status-interview",
  rejected: "bg-status-rejected-soft text-status-rejected",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        styles[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
