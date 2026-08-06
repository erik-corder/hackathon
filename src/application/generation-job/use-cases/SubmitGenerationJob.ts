import { randomUUID } from "node:crypto";

import { GenerationJob } from "@/domain/generation-job/GenerationJob";
import {
  toSubmitGenerationJobResponseDTO,
  type SubmitGenerationJobResponseDTO,
} from "@/application/generation-job/dto/GenerationJobDTO";
import type { GlbGenerationOverrides } from "@/application/generation-job/ports/GlbGenerationService";
import type { GenerationJobRepository } from "@/application/generation-job/ports/GenerationJobRepository";
import type { ProcessGenerationJob } from "@/application/generation-job/use-cases/ProcessGenerationJob";
import { ValidationError } from "@/application/generation-job/validation/errors";
import {
  resolveSeed,
  validateGenerationSettings,
  type RawGenerationSettings,
} from "@/application/generation-job/validation/generationSettingsValidation";
import { validateUpload } from "@/application/generation-job/validation/imageUploadValidation";

export interface SubmitGenerationJobInput {
  imageBuffer: Buffer;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Raw (unparsed) settings fields from the multipart request — all optional (FR-14/FR-15). */
  rawSettings?: RawGenerationSettings;
}

/**
 * Validates an uploaded image (server-side, authoritative — AC-12), persists a
 * new job in "processing" status, and kicks off `ProcessGenerationJob` as a
 * detached (not-awaited) task so this use-case — and therefore the route
 * handler calling it — returns within NFR-1's 2-second bound regardless of how
 * long the TRELLIS.2 call takes (AC-3).
 */
export class SubmitGenerationJob {
  constructor(
    private readonly repository: GenerationJobRepository,
    private readonly processGenerationJob: ProcessGenerationJob,
    private readonly maxUploadBytes: number,
  ) {}

  async execute(input: SubmitGenerationJobInput): Promise<SubmitGenerationJobResponseDTO> {
    const validationError = validateUpload({
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      maxUploadBytes: this.maxUploadBytes,
    });
    if (validationError) {
      throw validationError;
    }

    const settingsResult = validateGenerationSettings(input.rawSettings ?? {});
    if (settingsResult instanceof ValidationError) {
      throw settingsResult;
    }
    const { settings } = settingsResult;

    // Seed is always resolved — supplied verbatim, or freshly assigned when
    // omitted — so the value actually used is both sent to TRELLIS.2 and
    // echoed back to the caller for reproducibility (FR-16/AC-20). The other
    // three fields stay genuinely optional overrides: only included when the
    // caller actually supplied them, leaving TRELLIS.2's own defaults in place
    // otherwise (AC-18/AC-19).
    const seedUsed = resolveSeed(settings.seed);
    const overrides: GlbGenerationOverrides = {
      seed: seedUsed,
      ...(settings.resolution !== undefined ? { resolution: settings.resolution } : {}),
      ...(settings.decimationTarget !== undefined ? { decimationTarget: settings.decimationTarget } : {}),
      ...(settings.textureSize !== undefined ? { textureSize: settings.textureSize } : {}),
    };

    const now = new Date();
    const job = GenerationJob.createProcessing({
      id: randomUUID(),
      sourceImageName: input.fileName,
      sourceImageMimeType: input.mimeType,
      sourceImageSizeBytes: input.sizeBytes,
      now,
    });

    await this.repository.create(job);

    // Fire-and-forget: errors are handled entirely inside ProcessGenerationJob,
    // which never rejects out to this call site (see its own doc comment).
    void this.processGenerationJob.execute(job.id, input.imageBuffer, input.mimeType, overrides);

    return toSubmitGenerationJobResponseDTO(job, seedUsed);
  }
}
