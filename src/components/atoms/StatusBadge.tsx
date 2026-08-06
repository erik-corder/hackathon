import type { JobStatus } from "@/components/shared/types/generationJob";

const STATUS_LABEL: Record<JobStatus, string> = {
  processing: "Processing",
  complete: "Complete",
  failed: "Failed",
};

const STATUS_CLASSES: Record<JobStatus, string> = {
  processing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  complete: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export interface StatusBadgeProps {
  status: JobStatus;
}

/** Colored status pill atom — pure presentation, driven entirely by props. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
