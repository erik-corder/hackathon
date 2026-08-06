import { describe, expect, it, vi } from "vitest";

import { GenerationJob } from "@/domain/generation-job/GenerationJob";
import type { GenerationJobRepository } from "@/application/generation-job/ports/GenerationJobRepository";
import type { GlbFileStorage } from "@/application/generation-job/ports/GlbFileStorage";
import type { GlbGenerationService } from "@/application/generation-job/ports/GlbGenerationService";
import { ProcessGenerationJob } from "@/application/generation-job/use-cases/ProcessGenerationJob";

const JOB_ID = "job-1";
const now = new Date("2026-01-01T00:00:00.000Z");

function createProcessingJob(): GenerationJob {
  return GenerationJob.createProcessing({
    id: JOB_ID,
    sourceImageName: "photo.png",
    sourceImageMimeType: "image/png",
    sourceImageSizeBytes: 1024,
    now,
  });
}

function createRepositoryMock(initialJob: GenerationJob | null): GenerationJobRepository & {
  updated: GenerationJob[];
} {
  let stored = initialJob;
  const updated: GenerationJob[] = [];
  return {
    create: vi.fn(async (job: GenerationJob) => {
      stored = job;
    }),
    update: vi.fn(async (job: GenerationJob) => {
      stored = job;
      updated.push(job);
    }),
    findById: vi.fn(async () => stored),
    listAll: vi.fn(async () => (stored ? [stored] : [])),
    updated,
  };
}

describe("ProcessGenerationJob", () => {
  it("marks the job complete and stores the GLB on a successful generation (AC-4)", async () => {
    const repository = createRepositoryMock(createProcessingJob());
    const glbGenerationService: GlbGenerationService = {
      generate: vi.fn(async () => ({ glbBuffer: Buffer.from("glb-bytes") })),
    };
    const glbFileStorage: GlbFileStorage = {
      save: vi.fn(async () => ({ filePath: `${JOB_ID}.glb`, sizeBytes: 9 })),
      readStream: vi.fn(),
      exists: vi.fn(async () => true),
    };

    const useCase = new ProcessGenerationJob(repository, glbGenerationService, glbFileStorage, 5000);
    await useCase.execute(JOB_ID, Buffer.from("image-bytes"), "image/png");

    expect(glbGenerationService.generate).toHaveBeenCalledWith(
      { imageBuffer: Buffer.from("image-bytes"), mimeType: "image/png" },
      5000,
    );
    expect(glbFileStorage.save).toHaveBeenCalledWith(JOB_ID, Buffer.from("glb-bytes"));
    expect(repository.updated).toHaveLength(1);
    expect(repository.updated[0].status).toBe("complete");
    expect(repository.updated[0].toProps().glbFilePath).toBe(`${JOB_ID}.glb`);
    expect(repository.updated[0].toProps().glbSizeBytes).toBe(9);
  });

  it("threads overrides through to the generation service when supplied (AC-18, AC-19)", async () => {
    const repository = createRepositoryMock(createProcessingJob());
    const glbGenerationService: GlbGenerationService = {
      generate: vi.fn(async () => ({ glbBuffer: Buffer.from("glb-bytes") })),
    };
    const glbFileStorage: GlbFileStorage = {
      save: vi.fn(async () => ({ filePath: `${JOB_ID}.glb`, sizeBytes: 9 })),
      readStream: vi.fn(),
      exists: vi.fn(async () => true),
    };

    const useCase = new ProcessGenerationJob(repository, glbGenerationService, glbFileStorage, 5000);
    const overrides = { seed: 42, resolution: "512" as const, decimationTarget: 200_000, textureSize: 1024 };
    await useCase.execute(JOB_ID, Buffer.from("image-bytes"), "image/png", overrides);

    expect(glbGenerationService.generate).toHaveBeenCalledWith(
      { imageBuffer: Buffer.from("image-bytes"), mimeType: "image/png", overrides },
      5000,
    );
  });

  it("marks the job failed (never throws) when the generation service rejects (AC-9, AC-14)", async () => {
    const repository = createRepositoryMock(createProcessingJob());
    const glbGenerationService: GlbGenerationService = {
      generate: vi.fn(async () => {
        throw new Error("Generation timed out waiting for the TRELLIS.2 Space to respond.");
      }),
    };
    const glbFileStorage: GlbFileStorage = {
      save: vi.fn(),
      readStream: vi.fn(),
      exists: vi.fn(),
    };

    const useCase = new ProcessGenerationJob(repository, glbGenerationService, glbFileStorage, 5000);

    await expect(useCase.execute(JOB_ID, Buffer.from("image-bytes"), "image/png")).resolves.toBeUndefined();

    expect(glbFileStorage.save).not.toHaveBeenCalled();
    expect(repository.updated).toHaveLength(1);
    expect(repository.updated[0].status).toBe("failed");
    expect(repository.updated[0].toProps().errorMessage).toBe(
      "Generation timed out waiting for the TRELLIS.2 Space to respond.",
    );
  });

  it("does nothing if the job row no longer exists when generation completes", async () => {
    const repository = createRepositoryMock(null);
    const glbGenerationService: GlbGenerationService = {
      generate: vi.fn(async () => ({ glbBuffer: Buffer.from("glb-bytes") })),
    };
    const glbFileStorage: GlbFileStorage = {
      save: vi.fn(async () => ({ filePath: `${JOB_ID}.glb`, sizeBytes: 9 })),
      readStream: vi.fn(),
      exists: vi.fn(),
    };

    const useCase = new ProcessGenerationJob(repository, glbGenerationService, glbFileStorage, 5000);
    await expect(useCase.execute(JOB_ID, Buffer.from("image-bytes"), "image/png")).resolves.toBeUndefined();

    expect(repository.update).not.toHaveBeenCalled();
  });

  it("swallows an error thrown while persisting a failure, rather than rejecting (LLD §3)", async () => {
    const job = createProcessingJob();
    const repository: GenerationJobRepository = {
      create: vi.fn(),
      update: vi.fn(async () => {
        throw new Error("DB write failed");
      }),
      findById: vi.fn(async () => job),
      listAll: vi.fn(),
    };
    const glbGenerationService: GlbGenerationService = {
      generate: vi.fn(async () => {
        throw new Error("upstream failure");
      }),
    };
    const glbFileStorage: GlbFileStorage = { save: vi.fn(), readStream: vi.fn(), exists: vi.fn() };

    const useCase = new ProcessGenerationJob(repository, glbGenerationService, glbFileStorage, 5000);

    await expect(useCase.execute(JOB_ID, Buffer.from("image-bytes"), "image/png")).resolves.toBeUndefined();
  });
});
