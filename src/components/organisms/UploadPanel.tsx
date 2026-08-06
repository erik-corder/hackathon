"use client";

import { FileDropzone } from "@/components/molecules/FileDropzone";
import { JobStatusIndicator } from "@/components/molecules/JobStatusIndicator";
import { useSubmitGeneration } from "@/components/features/upload/useSubmitGeneration";
import type {
  GenerationSettingsValues,
  SubmitGenerationJobResponseView,
} from "@/components/shared/types/generationJob";

export interface UploadPanelProps {
  /** The currently resolved generation settings (FR-14), included with the submit call. */
  settings: GenerationSettingsValues;
  /** Called once a job has been accepted — used by the page to refresh history immediately (AC-5/FR-4). */
  onSubmitted?: (job: SubmitGenerationJobResponseView) => void;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

/** Full upload UI, wires `useSubmitGeneration`. */
export function UploadPanel({ settings, onSubmitted }: UploadPanelProps) {
  const { status, error, job, submit } = useSubmitGeneration(onSubmitted);

  return (
    <section aria-labelledby="upload-panel-heading" className="flex flex-col gap-3">
      <h2 id="upload-panel-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Upload an image
      </h2>
      <FileDropzone
        onFileSelected={(file) => void submit(file, settings)}
        accept={ACCEPTED_TYPES}
        error={error}
        disabled={status === "submitting"}
      />
      {status === "submitting" ? (
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <JobStatusIndicator status="processing" />
          Submitting…
        </div>
      ) : null}
      {job ? (
        <div className="flex flex-col gap-1 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="truncate text-sm">{job.sourceImageName}</span>
            <JobStatusIndicator status={job.status} />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Seed used: {job.seedUsed}</span>
        </div>
      ) : null}
    </section>
  );
}
