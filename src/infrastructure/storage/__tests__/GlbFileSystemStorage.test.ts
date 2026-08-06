import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GlbFileSystemStorage } from "@/infrastructure/storage/GlbFileSystemStorage";

describe("GlbFileSystemStorage", () => {
  let storageRoot: string;
  let storage: GlbFileSystemStorage;

  beforeEach(() => {
    storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "image2glb-storage-test-"));
    storage = new GlbFileSystemStorage(storageRoot);
  });

  afterEach(() => {
    fs.rmSync(storageRoot, { recursive: true, force: true });
  });

  it("saves a GLB buffer under {jobId}.glb and reports its size (AC-4)", async () => {
    const buffer = Buffer.from("fake-glb-bytes");
    const { filePath, sizeBytes } = await storage.save("job-1", buffer);

    expect(filePath).toBe("job-1.glb");
    expect(sizeBytes).toBe(buffer.byteLength);
    expect(fs.existsSync(path.join(storageRoot, "job-1.glb"))).toBe(true);
  });

  it("reports exists() = true for a saved file and false for a missing one (LLD edge case #9)", async () => {
    await storage.save("job-1", Buffer.from("fake-glb-bytes"));

    expect(await storage.exists("job-1.glb")).toBe(true);
    expect(await storage.exists("job-missing.glb")).toBe(false);
  });

  it("readStream() streams back the exact bytes that were saved (AC-5, AC-8)", async () => {
    const original = Buffer.from("fake-glb-bytes-for-streaming");
    await storage.save("job-1", original);

    const stream = await storage.readStream("job-1.glb");
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    expect(Buffer.concat(chunks).equals(original)).toBe(true);
  });

  it("creates the storage root directory on first save if it does not yet exist", async () => {
    const nestedRoot = path.join(storageRoot, "nested", "glb-storage");
    const nestedStorage = new GlbFileSystemStorage(nestedRoot);

    await nestedStorage.save("job-1", Buffer.from("x"));

    expect(fs.existsSync(nestedRoot)).toBe(true);
  });
});
