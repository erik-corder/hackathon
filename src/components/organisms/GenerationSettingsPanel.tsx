"use client";

import type { UseGenerationSettingsResult } from "@/components/features/settings/useGenerationSettings";
import { NumberField } from "@/components/molecules/NumberField";
import { SeedField } from "@/components/molecules/SeedField";
import { SelectField } from "@/components/molecules/SelectField";
import type { GenerationSettingsValues } from "@/components/shared/types/generationJob";

export type GenerationSettingsPanelProps = UseGenerationSettingsResult;

const RESOLUTION_SELECT_OPTIONS = [
  { value: "512", label: "512" },
  { value: "1024", label: "1024" },
  { value: "1536", label: "1536" },
];

/** Bounds mirrored from `useGenerationSettings`'s own client-echo constants —
 * see that hook for the authoritative note on where these come from. */
const SEED_MIN = 0;
const SEED_MAX = 2_147_483_647;
const DECIMATION_TARGET_MIN = 100_000;
const DECIMATION_TARGET_MAX = 500_000;
const DECIMATION_TARGET_STEP = 10_000;
const TEXTURE_SIZE_MIN = 1_024;
const TEXTURE_SIZE_MAX = 4_096;
const TEXTURE_SIZE_STEP = 1_024;

/**
 * Generation-settings controls: resolution, seed (+ randomize), decimation
 * target, texture size (FR-14). Owned by `useGenerationSettings` (feature
 * hook) — this organism only renders what that hook exposes; no owned
 * business logic (AC-17, AC-25/NFR-8).
 */
export function GenerationSettingsPanel({
  values,
  errors,
  setResolution,
  setSeed,
  randomizeSeed,
  setDecimationTarget,
  setTextureSize,
}: GenerationSettingsPanelProps) {
  return (
    <section aria-labelledby="generation-settings-heading" className="flex flex-col gap-3">
      <h2 id="generation-settings-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Generation settings
      </h2>
      <SelectField
        label="Resolution"
        value={values.resolution}
        options={RESOLUTION_SELECT_OPTIONS}
        onChange={(value) => setResolution(value as GenerationSettingsValues["resolution"])}
        error={errors.resolution}
      />
      <SeedField
        label="Seed"
        value={values.seed}
        onChange={setSeed}
        onRandomize={randomizeSeed}
        min={SEED_MIN}
        max={SEED_MAX}
        error={errors.seed}
      />
      <NumberField
        label="Decimation target"
        value={values.decimationTarget}
        onChange={setDecimationTarget}
        min={DECIMATION_TARGET_MIN}
        max={DECIMATION_TARGET_MAX}
        step={DECIMATION_TARGET_STEP}
        error={errors.decimationTarget}
      />
      <NumberField
        label="Texture size"
        value={values.textureSize}
        onChange={setTextureSize}
        min={TEXTURE_SIZE_MIN}
        max={TEXTURE_SIZE_MAX}
        step={TEXTURE_SIZE_STEP}
        error={errors.textureSize}
      />
    </section>
  );
}
