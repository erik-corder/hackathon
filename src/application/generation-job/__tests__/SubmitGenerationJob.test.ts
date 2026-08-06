import { describe, expect, it, vi } from "vitest";

import type { GenerationJob } from "@/domain/generation-job/GenerationJob";
import type { GenerationJobRepository } from "@/application/generation-job/ports/GenerationJobRepository";
import type { ProcessGenerationJob } from "@/application/generation-job/use-cases/ProcessGenerationJob";
import { SubmitGenerationJob } from "@/application/generation-job/use-cases/SubmitGenerationJob";
import { ValidationError } from "@/application/generation-job/validation/errors";
import { SEED_MAX, SEED_MIN } from "@/application/generation-job/validation/generationSettingsValidation";

function createRepositoryMock(): GenerationJobRepository {
  return {
    create: vi.fn(async () => {}),
    update: vi.fn(async () => {}),
    findById: vi.fn(async () => null),
    listAll: vi.fn(async () => []),
  };
}

function createProcessGenerationJobMock(): ProcessGenerationJob {
  return {
    execute: vi.fn(async () => {}),
  } as unknown as ProcessGenerationJob;
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

describe("SubmitGenerationJob", () => {
  it("rejects an invalid upload before touching the repository or the generation service (AC-2, AC-12)", async () => {
    const repository = createRepositoryMock();
    const processGenerationJob = createProcessGenerationJobMock();
    const useCase = new SubmitGenerationJob(repository, processGenerationJob, MAX_UPLOAD_BYTES);

    await expect(
      useCase.execute({
        imageBuffer: Buffer.from("not an image"),
        fileName: "notes.txt",
        mimeType: "text/plain",
        sizeBytes: 12,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(repository.create).not.toHaveBeenCalled();
    expect(processGenerationJob.execute).not.toHaveBeenCalled();
  });

  it("persists a processing job, returns immediately, and kicks off processing detached (AC-1, AC-3, AC-4)", async () => {
    const repository = createRepositoryMock();
    const processGenerationJob = createProcessGenerationJobMock();
    const useCase = new SubmitGenerationJob(repository, processGenerationJob, MAX_UPLOAD_BYTES);

    const imageBuffer = Buffer.from("fake-image-bytes");
    const dto = await useCase.execute({
      imageBuffer,
      fileName: "photo.png",
      mimeType: "image/png",
      sizeBytes: imageBuffer.byteLength,
    });

    expect(dto.status).toBe("processing");
    expect(dto.sourceImageName).toBe("photo.png");
    expect(dto.glbAvailable).toBe(false);
    expect(repository.create).toHaveBeenCalledTimes(1);

    const createdJob = (repository.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as GenerationJob;
    expect(createdJob.status).toBe("processing");
    expect(createdJob.id).toBe(dto.id);

    // Fire-and-forget: execute() is called, but SubmitGenerationJob does not await it.
    // Seed is always resolved (freshly assigned here, since none was supplied) and
    // threaded through as an override (FR-16/AC-20).
    expect(processGenerationJob.execute).toHaveBeenCalledWith(
      dto.id,
      imageBuffer,
      "image/png",
      expect.objectContaining({ seed: expect.any(Number) }),
    );
  });

  it("rejects an invalid generation setting before touching the repository or the generation service (AC-21/NFR-9)", async () => {
    const repository = createRepositoryMock();
    const processGenerationJob = createProcessGenerationJobMock();
    const useCase = new SubmitGenerationJob(repository, processGenerationJob, MAX_UPLOAD_BYTES);

    const imageBuffer = Buffer.from("fake-image-bytes");
    await expect(
      useCase.execute({
        imageBuffer,
        fileName: "photo.png",
        mimeType: "image/png",
        sizeBytes: imageBuffer.byteLength,
        rawSettings: { resolution: "2048" },
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(repository.create).not.toHaveBeenCalled();
    expect(processGenerationJob.execute).not.toHaveBeenCalled();
  });

  it("returns seedUsed verbatim when a seed is supplied, and passes it + the other overrides through (AC-17, AC-18, AC-19, AC-20)", async () => {
    const repository = createRepositoryMock();
    const processGenerationJob = createProcessGenerationJobMock();
    const useCase = new SubmitGenerationJob(repository, processGenerationJob, MAX_UPLOAD_BYTES);

    const imageBuffer = Buffer.from("fake-image-bytes");
    const dto = await useCase.execute({
      imageBuffer,
      fileName: "photo.png",
      mimeType: "image/png",
      sizeBytes: imageBuffer.byteLength,
      rawSettings: { resolution: "512", seed: "42", decimationTarget: "200000", textureSize: "2048" },
    });

    expect(dto.seedUsed).toBe(42);
    expect(processGenerationJob.execute).toHaveBeenCalledWith(dto.id, imageBuffer, "image/png", {
      seed: 42,
      resolution: "512",
      decimationTarget: 200_000,
      textureSize: 2048,
    });
  });

  it("assigns an in-range seed and echoes it back when the seed is omitted (FR-16/AC-20)", async () => {
    const repository = createRepositoryMock();
    const processGenerationJob = createProcessGenerationJobMock();
    const useCase = new SubmitGenerationJob(repository, processGenerationJob, MAX_UPLOAD_BYTES);

    const imageBuffer = Buffer.from("fake-image-bytes");
    const dto = await useCase.execute({
      imageBuffer,
      fileName: "photo.png",
      mimeType: "image/png",
      sizeBytes: imageBuffer.byteLength,
    });

    expect(Number.isInteger(dto.seedUsed)).toBe(true);
    expect(dto.seedUsed).toBeGreaterThanOrEqual(SEED_MIN);
    expect(dto.seedUsed).toBeLessThanOrEqual(SEED_MAX);
    expect(processGenerationJob.execute).toHaveBeenCalledWith(dto.id, imageBuffer, "image/png", {
      seed: dto.seedUsed,
    });
  });
});
