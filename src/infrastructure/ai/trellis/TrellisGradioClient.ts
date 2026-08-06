import { Client, handle_file } from "@gradio/client";

import type {
  GlbGenerationRequest,
  GlbGenerationResult,
  GlbGenerationService,
} from "@/application/generation-job/ports/GlbGenerationService";
import {
  QuotaExceededError,
  TimeoutError,
  UpstreamGenerationError,
} from "@/application/generation-job/validation/errors";

import { DEFAULT_TRELLIS_GENERATION_PARAMS, type GradioFileReference } from "./TrellisGradioClient.types";

const IMAGE_TO_3D_ENDPOINT = "/image_to_3d";
const EXTRACT_GLB_ENDPOINT = "/extract_glb";

export interface TrellisGradioClientOptions {
  spaceId: string;
  hfToken?: string;
}

/**
 * Races `promise` against a `ms`-millisecond timer. Rejects with `onTimeout()`'s
 * error if the timer wins; otherwise settles with `promise`'s own result/error.
 * Pure/deterministic enough to unit-test with fake timers (AC-14).
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout: () => Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(onTimeout()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Infrastructure adapter implementing `GlbGenerationService` via a direct call
 * to the Hugging Face Space `microsoft/TRELLIS.2`'s Gradio API. The only module
 * in the codebase that imports `@gradio/client` (targets AC-10/FR-11).
 *
 * **Deviation from the plan's assumed shape (Risk R-5, resolved during
 * implementation — see `07-change-log.md` for the full note):** `view_api()`
 * called against the live Space shows there is no single "submit an image, get
 * a GLB back" endpoint. The Space's own UI instead drives a session-scoped,
 * two-named-endpoint sequence:
 *   1. `/image_to_3d`  — image + sampling parameters → renders a 3D preview and
 *      updates a hidden `gr.State` scoped to the caller's session.
 *   2. `/extract_glb`  — decimation/texture parameters (plus that same hidden
 *      state, addressed positionally) → returns the extracted GLB file
 *      reference.
 * Both calls are made here, in sequence, on the *same* `Client` instance — one
 * fresh instance (and therefore one fresh `session_hash`) per `generate()`
 * call, so two concurrent jobs never share server-side session state (LLD
 * edge case #8). This remains a direct, code-orchestrated call sequence, not
 * an `agents.md`-driven autonomous agent loop, so it stays within the "direct
 * Gradio client call" decision (spec Open Question 2).
 */
export class TrellisGradioClient implements GlbGenerationService {
  constructor(private readonly options: TrellisGradioClientOptions) {}

  async generate(request: GlbGenerationRequest, timeoutMs: number): Promise<GlbGenerationResult> {
    return withTimeout(
      this.generateInternal(request),
      timeoutMs,
      () => new TimeoutError("Generation timed out waiting for the TRELLIS.2 Space to respond."),
    );
  }

  private async generateInternal(request: GlbGenerationRequest): Promise<GlbGenerationResult> {
    try {
      const client = await Client.connect(
        this.options.spaceId,
        this.options.hfToken
          ? { token: this.options.hfToken as `hf_${string}`, with_null_state: true }
          : { with_null_state: true },
      );

      const imageBlob = new Blob([new Uint8Array(request.imageBuffer)], { type: request.mimeType });
      const params = DEFAULT_TRELLIS_GENERATION_PARAMS;
      const overrides = request.overrides;

      // Exactly these 4 positions are substituted when a user override is
      // present; the other 10 /image_to_3d-only sampling parameters always
      // come from params.* unchanged (FR-15/AC-18/AC-19).
      const seed = overrides?.seed ?? params.seed;
      const resolution = overrides?.resolution ?? params.resolution;
      const decimationTarget = overrides?.decimationTarget ?? params.decimation_target;
      const textureSize = overrides?.textureSize ?? params.texture_size;

      await client.predict(IMAGE_TO_3D_ENDPOINT, [
        handle_file(imageBlob),
        seed,
        resolution,
        params.ss_guidance_strength,
        params.ss_guidance_rescale,
        params.ss_sampling_steps,
        params.ss_rescale_t,
        params.shape_slat_guidance_strength,
        params.shape_slat_guidance_rescale,
        params.shape_slat_sampling_steps,
        params.shape_slat_rescale_t,
        params.tex_slat_guidance_strength,
        params.tex_slat_guidance_rescale,
        params.tex_slat_sampling_steps,
        params.tex_slat_rescale_t,
      ]);

      // /extract_glb's first input is the hidden gr.State populated by
      // /image_to_3d. Gradio resolves the null placeholder from the same
      // session_hash; the visible controls follow it positionally.
      const extractResult = await client.predict(EXTRACT_GLB_ENDPOINT, [
        null,
        decimationTarget,
        textureSize,
      ]);

      const outputs = extractResult.data as GradioFileReference[] | undefined;
      const glbFile = outputs?.[0];
      if (!glbFile) {
        throw new UpstreamGenerationError(
          "TRELLIS.2 response did not include a GLB file reference (unparsable output).",
        );
      }

      const fileUrl = this.resolveFileUrl(client, glbFile);
      const response = await client.fetch(fileUrl);
      if (!response.ok) {
        throw new UpstreamGenerationError(
          `Failed to download the generated GLB from TRELLIS.2 (HTTP ${response.status}).`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return { glbBuffer: Buffer.from(arrayBuffer) };
    } catch (error) {
      if (error instanceof UpstreamGenerationError) {
        throw error;
      }
      if (this.isQuotaOrRateLimitError(error)) {
        throw new QuotaExceededError(
          "TRELLIS.2 has reached its usage quota or rate limit. Please wait a few minutes and try again.",
        );
      }
      const message = error instanceof Error ? error.message : "Unknown error calling the TRELLIS.2 Space.";
      throw new UpstreamGenerationError(message);
    }
  }

  /**
   * Heuristic classifier for a TRELLIS.2 quota/rate-limit rejection (FR-20/
   * AC-24): true when the raw caught error carries an HTTP 429 status, or when
   * its message text matches a quota/rate-limit/"too many requests" shape.
   * **Not independently re-verified against a live quota-exhausted response
   * this run** (triggering that condition would require actually exhausting
   * the Space's shared quota) — flagged in `07-change-log.md` as a documented,
   * hybrid heuristic rather than a guess presented as verified fact.
   */
  private isQuotaOrRateLimitError(error: unknown): boolean {
    const status = this.extractHttpStatus(error);
    if (status === 429) return true;

    const message = this.extractMessage(error);
    return /quota|rate[\s-]?limit|too many requests/i.test(message);
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "";
  }

  private extractHttpStatus(error: unknown): number | undefined {
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status?: unknown }).status;
      return typeof status === "number" ? status : undefined;
    }
    return undefined;
  }

  private resolveFileUrl(client: Client, file: GradioFileReference): string {
    if (file.url) return file.url;
    if (!file.path) {
      throw new UpstreamGenerationError(
        "TRELLIS.2 response did not include a usable file reference for the generated GLB.",
      );
    }
    const root = client.config?.root ?? client.config?.root_url;
    if (!root) {
      throw new UpstreamGenerationError(
        "Unable to resolve the TRELLIS.2 Space root URL for downloading the generated GLB.",
      );
    }
    const apiPrefix = client.api_prefix ?? "";
    return `${root}${apiPrefix}/file=${file.path}`;
  }
}
