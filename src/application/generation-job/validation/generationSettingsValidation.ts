import { randomInt } from "node:crypto";

import { ValidationError } from "./errors";

/** The only resolution values the TRELLIS.2 `/image_to_3d` Radio control accepts (FR-14). */
export const RESOLUTION_OPTIONS = ["512", "1024", "1536"] as const;
export type TrellisResolution = (typeof RESOLUTION_OPTIONS)[number];

/**
 * Bounds verified directly against the live `microsoft/TRELLIS.2` Space's own
 * `/config` output on 2026-08-06 (component `props` for the Seed/Decimation
 * Target/Texture Size sliders — see `07-change-log.md` for the exact recorded
 * values). This supersedes `02-plan.md` §3's placeholder figures for
 * `decimationTarget`/`textureSize`; `seed`'s placeholder figures matched the
 * live Space exactly and needed no change.
 */
export const SEED_MIN = 0;
export const SEED_MAX = 2_147_483_647;
export const DECIMATION_TARGET_MIN = 100_000;
export const DECIMATION_TARGET_MAX = 500_000;
export const TEXTURE_SIZE_MIN = 1_024;
export const TEXTURE_SIZE_MAX = 4_096;

/** Raw (unparsed) values as they arrive from multipart form fields — all optional. */
export interface RawGenerationSettings {
  resolution?: string;
  seed?: string;
  decimationTarget?: string;
  textureSize?: string;
}

/** Parsed + validated result — every field optional (an absent/omitted field simply isn't
 * included; the caller/adapter defaults it). `seed` here is the *user-supplied* value only —
 * final seed resolution (assignment when omitted) is a separate step, see `resolveSeed` below. */
export interface ParsedGenerationSettings {
  resolution?: TrellisResolution;
  seed?: number;
  decimationTarget?: number;
  textureSize?: number;
}

function isResolution(value: string): value is TrellisResolution {
  return (RESOLUTION_OPTIONS as readonly string[]).includes(value);
}

/** Parses a raw string as a base-10 integer, rejecting anything with a decimal
 * point, exponent, leading/trailing garbage, or out-of-range value. */
function parseIntegerInRange(raw: string, min: number, max: number): number | null {
  if (!/^-?\d+$/.test(raw.trim())) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

/**
 * Validates each *present* field of the four user-supplied generation settings
 * (FR-17); absent fields are simply omitted from the result (not an error —
 * FR-14/FR-15 treat these as optional overrides at the API-contract level, see
 * `03-hld.md` §4 "Alternatives Considered"). Returns a `ValidationError` on the
 * *first* invalid field found, with a field-specific, actionable message.
 *
 * Runs inside `SubmitGenerationJob.execute`, before any persistence or
 * TRELLIS.2 call — this is the sole, authoritative validation point regardless
 * of caller (NFR-9/AC-21).
 */
export function validateGenerationSettings(
  input: RawGenerationSettings,
): { settings: ParsedGenerationSettings } | ValidationError {
  const settings: ParsedGenerationSettings = {};

  if (input.resolution !== undefined) {
    if (!isResolution(input.resolution)) {
      return new ValidationError("Invalid resolution. Must be 512, 1024, or 1536.", "resolution");
    }
    settings.resolution = input.resolution;
  }

  if (input.seed !== undefined) {
    const seed = parseIntegerInRange(input.seed, SEED_MIN, SEED_MAX);
    if (seed === null) {
      return new ValidationError(
        `Invalid seed. Must be a whole number between ${SEED_MIN} and ${SEED_MAX}.`,
        "seed",
      );
    }
    settings.seed = seed;
  }

  if (input.decimationTarget !== undefined) {
    const decimationTarget = parseIntegerInRange(
      input.decimationTarget,
      DECIMATION_TARGET_MIN,
      DECIMATION_TARGET_MAX,
    );
    if (decimationTarget === null) {
      return new ValidationError(
        `Invalid decimation target. Must be a whole number between ${DECIMATION_TARGET_MIN} and ${DECIMATION_TARGET_MAX}.`,
        "decimationTarget",
      );
    }
    settings.decimationTarget = decimationTarget;
  }

  if (input.textureSize !== undefined) {
    const textureSize = parseIntegerInRange(input.textureSize, TEXTURE_SIZE_MIN, TEXTURE_SIZE_MAX);
    if (textureSize === null) {
      return new ValidationError(
        `Invalid texture size. Must be a whole number between ${TEXTURE_SIZE_MIN} and ${TEXTURE_SIZE_MAX}.`,
        "textureSize",
      );
    }
    settings.textureSize = textureSize;
  }

  return { settings };
}

/**
 * Returns `suppliedSeed` verbatim if defined; otherwise assigns a fresh integer
 * via `node:crypto`'s `randomInt` in `[SEED_MIN, SEED_MAX]` inclusive (FR-16/
 * AC-20). `randomInt`'s upper bound is exclusive, hence `SEED_MAX + 1`.
 */
export function resolveSeed(suppliedSeed: number | undefined): number {
  if (suppliedSeed !== undefined) return suppliedSeed;
  return randomInt(SEED_MIN, SEED_MAX + 1);
}
