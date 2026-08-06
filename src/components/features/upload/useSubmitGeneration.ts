"use client";

import { useCallback, useState } from "react";

import { submitGenerationJob } from "@/components/shared/api/generationJobsApi";
import { ApiError } from "@/components/shared/api/httpClient";
import type {
  GenerationSettingsValues,
  SubmitGenerationJobResponseView,
} from "@/components/shared/types/generationJob";

/** UX-only echo of the server's accepted types/size limit (NFR-1). The server
 * (`imageUploadValidation.ts`) remains the sole authority — see AC-12. */
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type SubmitStatus = "idle" | "validating" | "submitting" | "error";

export interface UseSubmitGenerationResult {
  status: SubmitStatus;
  error: string | null;
  job: SubmitGenerationJobResponseView | null;
  submit: (file: File, settings: GenerationSettingsValues) => Promise<void>;
}

/**
 * Owns the upload feature's business/data logic: client-side validation echo
 * (UX only) + calling `generationJobsApi.submitGenerationJob` with the
 * caller's generation settings (FR-14) + local submission state (now
 * including the `seedUsed` echoed back by the server, FR-16/AC-20).
 * `UploadPanel` (organism) only renders what this hook exposes — no business
 * logic in the organism body (`04-lld.md` Frontend Component Tree).
 */
export function useSubmitGeneration(
  onSubmitted?: (job: SubmitGenerationJobResponseView) => void,
): UseSubmitGenerationResult {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<SubmitGenerationJobResponseView | null>(null);

  const submit = useCallback(
    async (file: File, settings: GenerationSettingsValues) => {
      setStatus("validating");
      setError(null);

      if (file.size <= 0) {
        setStatus("error");
        setError("No image file was provided.");
        return;
      }
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        setStatus("error");
        setError("Unsupported file type. Please upload a JPG, PNG, or WebP image.");
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setStatus("error");
        setError(`File is too large. Maximum allowed size is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`);
        return;
      }

      setStatus("submitting");
      try {
        const submittedJob = await submitGenerationJob(file, settings);
        setJob(submittedJob);
        setStatus("idle");
        onSubmitted?.(submittedJob);
      } catch (err) {
        setStatus("error");
        setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    },
    [onSubmitted],
  );

  return { status, error, job, submit };
}
