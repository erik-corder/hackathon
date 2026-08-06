import type { GenerationJob } from "@/domain/generation-job/GenerationJob";

export interface GenerationJobDTO {
  id: string;
  status: "processing" | "complete" | "failed";
  sourceImageName: string;
  glbAvailable: boolean;
  errorMessage: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Maps a Domain entity to the Application → API DTO shape. `glbAvailable` is
 * derived (true only when the job is complete and a GLB path is recorded) rather
 * than exposing the internal file path to the API/frontend layers.
 */
export function toGenerationJobDTO(job: GenerationJob): GenerationJobDTO {
  const props = job.toProps();
  return {
    id: props.id,
    status: props.status,
    sourceImageName: props.sourceImageName,
    glbAvailable: props.status === "complete" && props.glbFilePath !== null,
    errorMessage: props.errorMessage,
    createdAt: props.createdAt.toISOString(),
    updatedAt: props.updatedAt.toISOString(),
  };
}

export interface SubmitGenerationJobResponseDTO extends GenerationJobDTO {
  /** The seed actually used for this generation request (user-supplied or freshly
   * assigned) — FR-16/AC-20. Present only on the synchronous POST /api/generate
   * response; never persisted, never returned by GET /jobs or GET /jobs/{id}
   * (spec Out-of-Scope: no settings audit trail). */
  seedUsed: number;
}

/** Maps a Domain entity + the seed resolved for this request to the
 * `POST /api/generate` response DTO (FR-16/AC-20). */
export function toSubmitGenerationJobResponseDTO(
  job: GenerationJob,
  seedUsed: number,
): SubmitGenerationJobResponseDTO {
  return { ...toGenerationJobDTO(job), seedUsed };
}
