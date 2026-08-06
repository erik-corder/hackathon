export type JobStatus = "processing" | "complete" | "failed";

/**
 * Frontend view-model type. Intentionally decoupled from the backend's
 * `GenerationJobDTO` (even though the shapes currently match) so Domain/
 * Application types never leak into UI code (`04-lld.md` §2).
 */
export interface GenerationJobView {
  id: string;
  status: JobStatus;
  sourceImageName: string;
  glbAvailable: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJobListResponseView {
  items: GenerationJobView[];
  total: number;
}

export interface ApiErrorView {
  code: string;
  message: string;
  details?: string[];
}

/** The four user-configurable TRELLIS.2 generation settings (FR-14). */
export interface GenerationSettingsValues {
  resolution: "512" | "1024" | "1536";
  seed: number;
  decimationTarget: number;
  textureSize: number;
}

/** `POST /api/generate`'s response shape — everything `GenerationJobView` has,
 * plus the seed actually used for this specific request (FR-16/AC-20). Not
 * returned by any `GET` endpoint. */
export interface SubmitGenerationJobResponseView extends GenerationJobView {
  seedUsed: number;
}
