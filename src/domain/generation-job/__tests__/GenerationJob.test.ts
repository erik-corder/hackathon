import { describe, expect, it } from "vitest";

import { DomainError } from "@/domain/generation-job/DomainError";
import { GenerationJob } from "@/domain/generation-job/GenerationJob";

describe("GenerationJob", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("creates a new job in the processing status with null GLB/error fields", () => {
    const job = GenerationJob.createProcessing({
      id: "job-1",
      sourceImageName: "photo.png",
      sourceImageMimeType: "image/png",
      sourceImageSizeBytes: 1024,
      now,
    });

    const props = job.toProps();
    expect(props.status).toBe("processing");
    expect(props.glbFilePath).toBeNull();
    expect(props.glbSizeBytes).toBeNull();
    expect(props.errorMessage).toBeNull();
    expect(props.createdAt).toEqual(now);
    expect(props.updatedAt).toEqual(now);
  });

  it("markComplete transitions a processing job to complete with GLB details", () => {
    const job = GenerationJob.createProcessing({
      id: "job-1",
      sourceImageName: "photo.png",
      sourceImageMimeType: "image/png",
      sourceImageSizeBytes: 1024,
      now,
    });

    const completedAt = new Date("2026-01-01T00:05:00.000Z");
    const completed = job.markComplete("job-1.glb", 2048, completedAt);

    expect(completed.status).toBe("complete");
    const props = completed.toProps();
    expect(props.glbFilePath).toBe("job-1.glb");
    expect(props.glbSizeBytes).toBe(2048);
    expect(props.errorMessage).toBeNull();
    expect(props.updatedAt).toEqual(completedAt);
  });

  it("markFailed transitions a processing job to failed with an error message", () => {
    const job = GenerationJob.createProcessing({
      id: "job-1",
      sourceImageName: "photo.png",
      sourceImageMimeType: "image/png",
      sourceImageSizeBytes: 1024,
      now,
    });

    const failedAt = new Date("2026-01-01T00:05:00.000Z");
    const failed = job.markFailed("Upstream service timed out.", failedAt);

    expect(failed.status).toBe("failed");
    const props = failed.toProps();
    expect(props.errorMessage).toBe("Upstream service timed out.");
    expect(props.glbFilePath).toBeNull();
    expect(props.updatedAt).toEqual(failedAt);
  });

  it("markComplete throws a DomainError when the job is already terminal (complete)", () => {
    const job = GenerationJob.createProcessing({
      id: "job-1",
      sourceImageName: "photo.png",
      sourceImageMimeType: "image/png",
      sourceImageSizeBytes: 1024,
      now,
    }).markComplete("job-1.glb", 2048, now);

    expect(() => job.markComplete("job-1-again.glb", 4096, now)).toThrow(DomainError);
  });

  it("markFailed throws a DomainError when the job is already terminal (failed)", () => {
    const job = GenerationJob.createProcessing({
      id: "job-1",
      sourceImageName: "photo.png",
      sourceImageMimeType: "image/png",
      sourceImageSizeBytes: 1024,
      now,
    }).markFailed("first failure", now);

    expect(() => job.markFailed("second failure", now)).toThrow(DomainError);
  });

  it("does not mutate the original instance on state transitions (immutability)", () => {
    const job = GenerationJob.createProcessing({
      id: "job-1",
      sourceImageName: "photo.png",
      sourceImageMimeType: "image/png",
      sourceImageSizeBytes: 1024,
      now,
    });

    const completed = job.markComplete("job-1.glb", 2048, now);

    expect(job.status).toBe("processing");
    expect(completed.status).toBe("complete");
  });
});
