/**
 * Raw shapes returned by the Hugging Face Space `microsoft/TRELLIS.2`'s Gradio
 * API, plus the request parameters this adapter sends. Verified directly
 * against the live Space's `view_api()` output on 2026-08-05 (recorded in
 * `07-change-log.md`) — the Space is a two-named-endpoint session pipeline, not
 * a single-call API (see the deviation note in `TrellisGradioClient.ts`).
 *
 * **Override mechanism (this run, FR-14/FR-15):** `seed`, `resolution`,
 * `decimation_target`, and `texture_size` may be overridden per-request via
 * `GlbGenerationRequest.overrides` (Application-layer, camelCase field names).
 * `TrellisGradioClient.generateInternal` computes each of the 4 substituted
 * values as `overrides?.<field> ?? params.<field>` and slots them into the
 * exact same positions below — this type's own shape is unchanged; only the
 * *source* of 4 of its 16 values may now be a request override instead of
 * always this file's own `DEFAULT_TRELLIS_GENERATION_PARAMS`. Bounds for
 * `seed`/`decimation_target`/`texture_size` (enforced in
 * `generationSettingsValidation.ts`, not here) were re-verified against the
 * live Space's `/config` output on 2026-08-06 (see `07-change-log.md`).
 */

/** A Gradio file-output reference (e.g. the `Model3d`/`Downloadbutton` outputs of `/extract_glb`). */
export interface GradioFileReference {
  url?: string;
  path?: string;
}

/**
 * Parameters accepted by the `/image_to_3d` and `/extract_glb` named
 * endpoints. Field names mirror the Space's own `parameter_name`s exactly (snake
 * case) so the mapping in `TrellisGradioClient.ts` is a straight passthrough.
 */
export interface TrellisGenerationParams {
  seed: number;
  resolution: "512" | "1024" | "1536";
  ss_guidance_strength: number;
  ss_guidance_rescale: number;
  ss_sampling_steps: number;
  ss_rescale_t: number;
  shape_slat_guidance_strength: number;
  shape_slat_guidance_rescale: number;
  shape_slat_sampling_steps: number;
  shape_slat_rescale_t: number;
  tex_slat_guidance_strength: number;
  tex_slat_guidance_rescale: number;
  tex_slat_sampling_steps: number;
  tex_slat_rescale_t: number;
  decimation_target: number;
  texture_size: number;
}

/**
 * Defaults copied verbatim from the Space's own `view_api()`
 * `parameter_default` values (its own UI's out-of-the-box behaviour), so this
 * app's "direct single-shot" call matches what a user clicking through the
 * Space's own UI would get.
 */
export const DEFAULT_TRELLIS_GENERATION_PARAMS: TrellisGenerationParams = {
  seed: 0,
  resolution: "1024",
  ss_guidance_strength: 7.5,
  ss_guidance_rescale: 0.7,
  ss_sampling_steps: 12,
  ss_rescale_t: 5,
  shape_slat_guidance_strength: 7.5,
  shape_slat_guidance_rescale: 0.5,
  shape_slat_sampling_steps: 12,
  shape_slat_rescale_t: 3,
  tex_slat_guidance_strength: 1,
  tex_slat_guidance_rescale: 0,
  tex_slat_sampling_steps: 12,
  tex_slat_rescale_t: 3,
  decimation_target: 300_000,
  texture_size: 2048,
};
