import { describe, expect, it } from "vitest";

import { ValidationError } from "@/application/generation-job/validation/errors";
import {
  DECIMATION_TARGET_MAX,
  DECIMATION_TARGET_MIN,
  SEED_MAX,
  SEED_MIN,
  TEXTURE_SIZE_MAX,
  TEXTURE_SIZE_MIN,
  resolveSeed,
  validateGenerationSettings,
} from "@/application/generation-job/validation/generationSettingsValidation";

describe("validateGenerationSettings", () => {
  it("accepts a full valid set of settings (AC-17)", () => {
    const result = validateGenerationSettings({
      resolution: "1024",
      seed: "42",
      decimationTarget: "300000",
      textureSize: "2048",
    });

    expect(result).not.toBeInstanceOf(ValidationError);
    expect(result).toEqual({
      settings: { resolution: "1024", seed: 42, decimationTarget: 300_000, textureSize: 2048 },
    });
  });

  it("returns an empty (but not erroring) settings object when every field is omitted (D1)", () => {
    const result = validateGenerationSettings({});
    expect(result).toEqual({ settings: {} });
  });

  it.each(["512", "1024", "1536"] as const)("accepts resolution %s", (resolution) => {
    const result = validateGenerationSettings({ resolution });
    expect(result).toEqual({ settings: { resolution } });
  });

  it("rejects a resolution outside the allowed enum (D2/AC-21)", () => {
    const error = validateGenerationSettings({ resolution: "2048" });
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).message).toBe("Invalid resolution. Must be 512, 1024, or 1536.");
    expect((error as ValidationError).field).toBe("resolution");
  });

  it("accepts the exact seed boundary values", () => {
    expect(validateGenerationSettings({ seed: String(SEED_MIN) })).toEqual({ settings: { seed: SEED_MIN } });
    expect(validateGenerationSettings({ seed: String(SEED_MAX) })).toEqual({ settings: { seed: SEED_MAX } });
  });

  it("rejects a non-numeric seed (D3/AC-21)", () => {
    const error = validateGenerationSettings({ seed: "not-a-number" });
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).field).toBe("seed");
  });

  it("rejects a negative seed (D3/AC-21)", () => {
    const error = validateGenerationSettings({ seed: "-1" });
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).field).toBe("seed");
  });

  it("rejects a non-integer seed (D3/AC-21)", () => {
    const error = validateGenerationSettings({ seed: "1.5" });
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).field).toBe("seed");
  });

  it("rejects a seed above SEED_MAX (D3/AC-21)", () => {
    const error = validateGenerationSettings({ seed: String(SEED_MAX + 1) });
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).field).toBe("seed");
  });

  it("rejects a decimationTarget out of range (D4/AC-21)", () => {
    const tooLow = validateGenerationSettings({ decimationTarget: String(DECIMATION_TARGET_MIN - 1) });
    const tooHigh = validateGenerationSettings({ decimationTarget: String(DECIMATION_TARGET_MAX + 1) });
    expect(tooLow).toBeInstanceOf(ValidationError);
    expect((tooLow as ValidationError).field).toBe("decimationTarget");
    expect(tooHigh).toBeInstanceOf(ValidationError);
    expect((tooHigh as ValidationError).field).toBe("decimationTarget");
  });

  it("accepts the exact decimationTarget boundary values", () => {
    expect(validateGenerationSettings({ decimationTarget: String(DECIMATION_TARGET_MIN) })).toEqual({
      settings: { decimationTarget: DECIMATION_TARGET_MIN },
    });
    expect(validateGenerationSettings({ decimationTarget: String(DECIMATION_TARGET_MAX) })).toEqual({
      settings: { decimationTarget: DECIMATION_TARGET_MAX },
    });
  });

  it("rejects a textureSize out of range (D4/AC-21)", () => {
    const tooLow = validateGenerationSettings({ textureSize: String(TEXTURE_SIZE_MIN - 1) });
    const tooHigh = validateGenerationSettings({ textureSize: String(TEXTURE_SIZE_MAX + 1) });
    expect(tooLow).toBeInstanceOf(ValidationError);
    expect((tooLow as ValidationError).field).toBe("textureSize");
    expect(tooHigh).toBeInstanceOf(ValidationError);
    expect((tooHigh as ValidationError).field).toBe("textureSize");
  });

  it("accepts the exact textureSize boundary values", () => {
    expect(validateGenerationSettings({ textureSize: String(TEXTURE_SIZE_MIN) })).toEqual({
      settings: { textureSize: TEXTURE_SIZE_MIN },
    });
    expect(validateGenerationSettings({ textureSize: String(TEXTURE_SIZE_MAX) })).toEqual({
      settings: { textureSize: TEXTURE_SIZE_MAX },
    });
  });

  it("validates seed omitted while other 3 fields are present and valid (D5)", () => {
    const result = validateGenerationSettings({
      resolution: "512",
      decimationTarget: "200000",
      textureSize: "1024",
    });
    expect(result).toEqual({
      settings: { resolution: "512", decimationTarget: 200_000, textureSize: 1024 },
    });
  });
});

describe("resolveSeed", () => {
  it("returns the supplied seed verbatim when defined", () => {
    expect(resolveSeed(12345)).toBe(12345);
    expect(resolveSeed(0)).toBe(0);
  });

  it("assigns a fresh, in-range integer seed when omitted (FR-16/AC-20)", () => {
    const assigned = resolveSeed(undefined);
    expect(Number.isInteger(assigned)).toBe(true);
    expect(assigned).toBeGreaterThanOrEqual(SEED_MIN);
    expect(assigned).toBeLessThanOrEqual(SEED_MAX);
  });

  it("assigns a different seed across repeated calls with overwhelming probability", () => {
    const seeds = new Set(Array.from({ length: 20 }, () => resolveSeed(undefined)));
    expect(seeds.size).toBeGreaterThan(1);
  });
});
