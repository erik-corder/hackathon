"use client";

import { useEffect, useState } from "react";

import { getJob, glbUrlFor } from "@/components/shared/api/generationJobsApi";
import { usePolling } from "@/components/shared/hooks/usePolling";

const POLL_INTERVAL_MS = 2000;

export interface UseGlbUrlResult {
  url: string | null;
  ready: boolean;
}

interface ResolvedReadiness {
  jobId: string;
  ready: boolean;
}

/**
 * Owns the viewer feature's business/data logic: resolves the selected job id
 * into a GLB URL, gated on the job's `glbAvailable` flag (re-fetched/polled
 * directly here so the viewer becomes ready as soon as a still-processing
 * selection completes, without depending on `useGenerationHistory`'s own poll
 * cadence). `GlbViewer` (organism) only renders what this hook exposes.
 *
 * `resolved` is tagged with the `jobId` it was fetched for, so switching the
 * selection is reflected as "not ready" immediately (derived below) without
 * a synchronous `setState` call inside the effect itself.
 */
export function useGlbUrl(jobId: string | null): UseGlbUrlResult {
  const [resolved, setResolved] = useState<ResolvedReadiness | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    getJob(jobId).then((job) => {
      if (!cancelled) setResolved({ jobId, ready: job.glbAvailable });
    });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const ready = jobId !== null && resolved?.jobId === jobId ? resolved.ready : false;

  usePolling(
    async () => {
      if (!jobId) return;
      const job = await getJob(jobId);
      setResolved({ jobId, ready: job.glbAvailable });
    },
    POLL_INTERVAL_MS,
    Boolean(jobId) && !ready,
  );

  return { url: jobId && ready ? glbUrlFor(jobId) : null, ready };
}
