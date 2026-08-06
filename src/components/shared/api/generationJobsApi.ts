import { request } from "@/components/shared/api/httpClient";
import type {
  GenerationJobListResponseView,
  GenerationJobView,
  GenerationSettingsValues,
  SubmitGenerationJobResponseView,
} from "@/components/shared/types/generationJob";

/** Uploads an image and starts a generation job, including the user's
 * resolution/seed/decimationTarget/textureSize settings (FR-1, FR-3, FR-14). */
export async function submitGenerationJob(
  file: File,
  settings: GenerationSettingsValues,
): Promise<SubmitGenerationJobResponseView> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("resolution", settings.resolution);
  formData.append("seed", String(settings.seed));
  formData.append("decimationTarget", String(settings.decimationTarget));
  formData.append("textureSize", String(settings.textureSize));
  return request<SubmitGenerationJobResponseView>("/generate", { method: "POST", body: formData });
}

/** Lists all generation jobs, newest first (FR-7). */
export async function listJobs(): Promise<GenerationJobView[]> {
  const response = await request<GenerationJobListResponseView>("/jobs");
  return response.items;
}

/** Fetches a single job's current status/details (FR-8). */
export async function getJob(id: string): Promise<GenerationJobView> {
  return request<GenerationJobView>(`/jobs/${id}`);
}

/** Returns the URL for a job's GLB binary, for use as a viewer source or download link (FR-6, FR-9). */
export function glbUrlFor(id: string, options?: { download?: boolean }): string {
  const query = options?.download ? "?download=true" : "";
  return `/api/jobs/${id}/glb${query}`;
}
