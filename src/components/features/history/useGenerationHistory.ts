"use client";

import { useCallback, useEffect, useState } from "react";

import { listJobs } from "@/components/shared/api/generationJobsApi";
import { usePolling } from "@/components/shared/hooks/usePolling";
import type { GenerationJobView } from "@/components/shared/types/generationJob";

const POLL_INTERVAL_MS = 2000;

export interface UseGenerationHistoryResult {
  jobs: GenerationJobView[];
  selectedId: string | null;
  select: (id: string) => void;
  refresh: () => Promise<void>;
}

/**
 * Owns the history feature's business/data logic: initial fetch + polling
 * while any job is non-terminal + which job id is currently selected.
 * `HistoryList` (organism) only renders what this hook exposes.
 */
export function useGenerationHistory(): UseGenerationHistoryResult {
  const [jobs, setJobs] = useState<GenerationJobView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const items = await listJobs();
    setJobs(items);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listJobs().then((items) => {
      if (!cancelled) setJobs(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasNonTerminalJob = jobs.some((job) => job.status === "processing");
  usePolling(refresh, POLL_INTERVAL_MS, hasNonTerminalJob);

  const select = useCallback((id: string) => setSelectedId(id), []);

  return { jobs, selectedId, select, refresh };
}
