import { JobStatusIndicator } from "@/components/molecules/JobStatusIndicator";
import type { GenerationJobView } from "@/components/shared/types/generationJob";

export interface HistoryListItemProps {
  job: GenerationJobView;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

/** One history row (timestamp, status, select action) — purely presentational, driven by props. */
export function HistoryListItem({ job, isSelected, onSelect }: HistoryListItemProps) {
  return (
    <li>
      <button
        type="button"
        aria-current={isSelected ? "true" : undefined}
        aria-label={`${job.sourceImageName}, ${job.status}, submitted ${formatTimestamp(job.createdAt)}`}
        onClick={() => onSelect(job.id)}
        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50 ${
          isSelected
            ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{job.sourceImageName}</span>
          <span className="text-xs opacity-70">{formatTimestamp(job.createdAt)}</span>
        </span>
        <JobStatusIndicator status={job.status} />
      </button>
    </li>
  );
}
