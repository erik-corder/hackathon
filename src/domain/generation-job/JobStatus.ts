/**
 * Domain value object for a generation job's lifecycle status.
 *
 * Only one non-terminal status ("processing") exists in this design because the
 * TRELLIS.2 integration is a direct, single-shot Gradio call rather than a queued
 * worker pipeline — there is no observable difference between "queued" and
 * "processing" without a real queue (see 03-hld.md §4 Alternatives Considered).
 */
export type JobStatus = "processing" | "complete" | "failed";

export const TERMINAL_STATUSES: readonly JobStatus[] = ["complete", "failed"];

export function isTerminal(status: JobStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
