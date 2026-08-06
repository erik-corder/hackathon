/**
 * The four TRELLIS.2 generation parameters a user may override for a given
 * request (FR-14/FR-15). Application-owned, camelCase names — deliberately not
 * `TrellisGenerationParams`'s own snake_case shape (that type lives in
 * Infrastructure; importing it here would invert the Clean Architecture
 * dependency direction). Every field is optional: an absent field leaves the
 * corresponding Infrastructure-layer default untouched.
 */
export interface GlbGenerationOverrides {
  resolution?: "512" | "1024" | "1536";
  seed?: number;
  decimationTarget?: number;
  textureSize?: number;
}

export interface GlbGenerationRequest {
  imageBuffer: Buffer;
  mimeType: string;
  /** Optional — absent (or any absent sub-field) preserves today's fixed-default
   * behavior byte-for-byte (backward compatible; AC-18/AC-19). */
  overrides?: GlbGenerationOverrides;
}

export interface GlbGenerationResult {
  glbBuffer: Buffer;
}

/**
 * Application-layer port for the external 3D-asset generation service. The only
 * concrete implementation is `TrellisGradioClient` (Infrastructure layer, direct
 * single-shot call to the Hugging Face Space `microsoft/TRELLIS.2` via
 * `@gradio/client`) — Application code never imports `@gradio/client` directly
 * (targets AC-10/FR-11).
 */
export interface GlbGenerationService {
  generate(request: GlbGenerationRequest, timeoutMs: number): Promise<GlbGenerationResult>;
}
