import { HistoryListItem } from "@/components/molecules/HistoryListItem";
import type { GenerationJobView } from "@/components/shared/types/generationJob";

export interface HistoryListProps {
  jobs: GenerationJobView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Full history UI. Driven entirely by props sourced from a single, page-level
 * `useGenerationHistory()` call (see `src/app/page.tsx`) — this keeps the job
 * list a single source of truth shared with `UploadPanel`'s post-submit
 * refresh and `GlbViewer`'s selection, per `04-lld.md` §5's invalidation note.
 */
export function HistoryList({ jobs, selectedId, onSelect }: HistoryListProps) {
  return (
    <section aria-labelledby="history-list-heading" className="flex flex-col gap-2">
      <h2 id="history-list-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        History
      </h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No generations yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {jobs.map((job) => (
            <HistoryListItem key={job.id} job={job} isSelected={job.id === selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </section>
  );
}
