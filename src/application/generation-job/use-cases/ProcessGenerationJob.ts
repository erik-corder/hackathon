import type { GenerationJobRepository } from "@/application/generation-job/ports/GenerationJobRepository";
import type { GlbFileStorage } from "@/application/generation-job/ports/GlbFileStorage";
import type {
  GlbGenerationOverrides,
  GlbGenerationRequest,
  GlbGenerationService,
} from "@/application/generation-job/ports/GlbGenerationService";

/**
 * Calls the external GLB generation service (timeout-wrapped by the adapter
 * itself, see `TrellisGradioClient`), stores the result, and updates the job's
 * persisted status to "complete" or "failed" (FR-3, FR-5, FR-10, NFR-3).
 *
 * This use-case never throws: it is invoked detached (fire-and-forget) from
 * `SubmitGenerationJob`, so any failure — including a domain-invariant violation
 * from an already-terminal job — is caught and, where possible, persisted as a
 * failure; it is never allowed to become an unhandled rejection (AC-9).
 */
export class ProcessGenerationJob {
  constructor(
    private readonly repository: GenerationJobRepository,
    private readonly glbGenerationService: GlbGenerationService,
    private readonly glbFileStorage: GlbFileStorage,
    private readonly timeoutMs: number,
  ) {}

  async execute(
    jobId: string,
    imageBuffer: Buffer,
    mimeType: string,
    overrides?: GlbGenerationOverrides,
  ): Promise<void> {
    try {
      const request: GlbGenerationRequest = overrides
        ? { imageBuffer, mimeType, overrides }
        : { imageBuffer, mimeType };
      const result = await this.glbGenerationService.generate(request, this.timeoutMs);
      const { filePath, sizeBytes } = await this.glbFileStorage.save(jobId, result.glbBuffer);

      const job = await this.repository.findById(jobId);
      if (!job) return; // Job row no longer exists; nothing to update.

      const updated = job.markComplete(filePath, sizeBytes, new Date());
      await this.repository.update(updated);
    } catch (error) {
      await this.markFailedSafely(jobId, error);
    }
  }

  private async markFailedSafely(jobId: string, error: unknown): Promise<void> {
    const message =
      error instanceof Error ? error.message : "Unknown error during 3D asset generation.";
    try {
      const job = await this.repository.findById(jobId);
      if (!job) return;
      const updated = job.markFailed(message, new Date());
      await this.repository.update(updated);
    } catch {
      // Never throw out of this method (LLD §3): if even the failure-persist
      // step fails (e.g. job already terminal, or a transient DB error), the
      // job simply remains in its last known state rather than crashing the
      // detached async task / the server process (NFR-3).
    }
  }
}
