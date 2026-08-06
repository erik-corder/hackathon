"use client";

import { useCallback, useState } from "react";

import type { GenerationSettingsValues } from "@/components/shared/types/generationJob";

const DEFAULT_RESOLUTION: GenerationSettingsValues["resolution"] = "1024";
const DEFAULT_DECIMATION_TARGET = 300_000;
const DEFAULT_TEXTURE_SIZE = 2048;

/** UX-only echo of the server's authoritative bounds (NFR-9) — the server's
 * `generationSettingsValidation.ts` remains the sole source of truth; these
 * mirror it only for immediate client-side feedback. Verified against the
 * live Space's `/config` output (see `07-change-log.md`). */
const RESOLUTION_OPTIONS: readonly GenerationSettingsValues["resolution"][] = ["512", "1024", "1536"];
const SEED_MIN = 0;
const SEED_MAX = 2_147_483_647;
const DECIMATION_TARGET_MIN = 100_000;
const DECIMATION_TARGET_MAX = 500_000;
const TEXTURE_SIZE_MIN = 1_024;
const TEXTURE_SIZE_MAX = 4_096;

function randomSeed(): number {
  return Math.floor(Math.random() * (SEED_MAX + 1));
}

export interface GenerationSettingsErrors {
  resolution?: string | null;
  seed?: string | null;
  decimationTarget?: string | null;
  textureSize?: string | null;
}

export interface UseGenerationSettingsResult {
  values: GenerationSettingsValues;
  errors: GenerationSettingsErrors;
  setResolution: (value: GenerationSettingsValues["resolution"]) => void;
  setSeed: (value: number) => void;
  randomizeSeed: () => void;
  setDecimationTarget: (value: number) => void;
  setTextureSize: (value: number) => void;
}

/**
 * Owns the generation-settings feature's state + client-echo validation (UX
 * only — the server's `generationSettingsValidation.ts` remains authoritative,
 * NFR-9) + the randomize-seed action (FR-16/A-10, `Math.random()`-based UX
 * convenience — distinct from the server's `crypto.randomInt` fallback used
 * only when a request omits `seed` entirely). Defaults mirror
 * `DEFAULT_TRELLIS_GENERATION_PARAMS` for continuity, without importing that
 * Infrastructure-layer constant from frontend code.
 * `GenerationSettingsPanel` (organism) only renders what this hook exposes —
 * no business logic in the organism body.
 */
export function useGenerationSettings(): UseGenerationSettingsResult {
  const [values, setValues] = useState<GenerationSettingsValues>(() => ({
    resolution: DEFAULT_RESOLUTION,
    seed: randomSeed(),
    decimationTarget: DEFAULT_DECIMATION_TARGET,
    textureSize: DEFAULT_TEXTURE_SIZE,
  }));

  const setResolution = useCallback((resolution: GenerationSettingsValues["resolution"]) => {
    setValues((prev) => ({ ...prev, resolution }));
  }, []);

  const setSeed = useCallback((seed: number) => {
    setValues((prev) => ({ ...prev, seed }));
  }, []);

  const randomizeSeed = useCallback(() => {
    setValues((prev) => ({ ...prev, seed: randomSeed() }));
  }, []);

  const setDecimationTarget = useCallback((decimationTarget: number) => {
    setValues((prev) => ({ ...prev, decimationTarget }));
  }, []);

  const setTextureSize = useCallback((textureSize: number) => {
    setValues((prev) => ({ ...prev, textureSize }));
  }, []);

  const errors: GenerationSettingsErrors = {
    resolution: RESOLUTION_OPTIONS.includes(values.resolution)
      ? null
      : "Invalid resolution. Must be 512, 1024, or 1536.",
    seed:
      values.seed >= SEED_MIN && values.seed <= SEED_MAX
        ? null
        : `Invalid seed. Must be a whole number between ${SEED_MIN} and ${SEED_MAX}.`,
    decimationTarget:
      values.decimationTarget >= DECIMATION_TARGET_MIN && values.decimationTarget <= DECIMATION_TARGET_MAX
        ? null
        : `Invalid decimation target. Must be a whole number between ${DECIMATION_TARGET_MIN} and ${DECIMATION_TARGET_MAX}.`,
    textureSize:
      values.textureSize >= TEXTURE_SIZE_MIN && values.textureSize <= TEXTURE_SIZE_MAX
        ? null
        : `Invalid texture size. Must be a whole number between ${TEXTURE_SIZE_MIN} and ${TEXTURE_SIZE_MAX}.`,
  };

  return { values, errors, setResolution, setSeed, randomizeSeed, setDecimationTarget, setTextureSize };
}
