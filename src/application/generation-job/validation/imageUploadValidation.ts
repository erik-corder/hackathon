import { ValidationError } from "./errors";

/** Accepted source image MIME types (FR-2, AC-1, AC-2). */
export const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Default max upload size (20 MB), overridable via env (see `env.ts`). */
export const DEFAULT_MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export interface UploadValidationInput {
  mimeType: string;
  sizeBytes: number;
  maxUploadBytes?: number;
}

function formatMaxSizeMb(maxUploadBytes: number): string {
  return (maxUploadBytes / (1024 * 1024)).toFixed(0);
}

/**
 * Pure, server-side-authoritative validation of an uploaded image's declared MIME
 * type and size (FR-2). Runs inside `SubmitGenerationJob.execute` before any
 * `GlbGenerationService` call is made (AC-12) — client-side checks in
 * `useSubmitGeneration` are a UX convenience only and are never trusted alone.
 */
export function validateUpload(input: UploadValidationInput): ValidationError | null {
  const maxUploadBytes = input.maxUploadBytes ?? DEFAULT_MAX_UPLOAD_BYTES;

  if (input.sizeBytes <= 0) {
    return new ValidationError("No image file was provided.", "image");
  }

  if (!ACCEPTED_IMAGE_MIME_TYPES.includes(input.mimeType as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number])) {
    return new ValidationError(
      "Unsupported file type. Please upload a JPG, PNG, or WebP image.",
      "image",
    );
  }

  if (input.sizeBytes > maxUploadBytes) {
    return new ValidationError(
      `File is too large. Maximum allowed size is ${formatMaxSizeMb(maxUploadBytes)} MB.`,
      "image",
    );
  }

  return null;
}
