// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "image2glb-generate-route-test-"));
const sqliteFilePath = path.join(tempRoot, "test.sqlite");
const glbStorageRoot = path.join(tempRoot, "glb-storage");

vi.mock("@/infrastructure/config/env", () => ({
  getServerConfig: () => ({
    hfSpaceId: "microsoft/TRELLIS.2",
    hfToken: undefined,
    trellisTimeoutMs: 5000,
    maxUploadBytes: 20 * 1024 * 1024,
    sqliteFilePath,
    glbStorageRoot,
  }),
}));

const generateMock = vi.fn();
vi.mock("@/infrastructure/ai/trellis/TrellisGradioClient", () => ({
  TrellisGradioClient: class {
    generate(...args: unknown[]) {
      return generateMock(...args);
    }
  },
}));

const { POST } = await import("@/app/api/generate/route");
const { GET: getJobRoute } = await import("@/app/api/jobs/[id]/route");
const { __resetDbForTests } = await import("@/infrastructure/db/sqlite/client");

async function waitForStatus(id: string, expected: "complete" | "failed", timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const response = await getJobRoute(new Request(`http://localhost/api/jobs/${id}`), {
      params: Promise.resolve({ id }),
    });
    const body = (await response.json()) as { status: string };
    if (body.status === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Job ${id} did not reach status "${expected}" within ${timeoutMs}ms`);
}

function buildUploadRequest(
  fileBytes: Uint8Array,
  fileName: string,
  mimeType: string,
  settings?: Record<string, string>,
): NextRequest {
  const formData = new FormData();
  formData.set("image", new File([fileBytes as BlobPart], fileName, { type: mimeType }));
  for (const [key, value] of Object.entries(settings ?? {})) {
    formData.set(key, value);
  }
  return new NextRequest("http://localhost/api/generate", { method: "POST", body: formData });
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    generateMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    __resetDbForTests();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it("accepts a valid image and responds 202 with status processing within the synchronous call (AC-1, AC-3)", async () => {
    generateMock.mockResolvedValue({ glbBuffer: Buffer.from("glb-bytes") });

    const request = buildUploadRequest(new Uint8Array([1, 2, 3, 4]), "photo.png", "image/png");
    const response = await POST(request);

    expect(response.status).toBe(202);
    const body = (await response.json()) as { id: string; status: string; sourceImageName: string };
    expect(body.status).toBe("processing");
    expect(body.sourceImageName).toBe("photo.png");

    await waitForStatus(body.id, "complete");
  });

  it("accepts a valid set of generation settings and echoes seedUsed in the response (AC-17, AC-20)", async () => {
    generateMock.mockResolvedValue({ glbBuffer: Buffer.from("glb-bytes") });

    const request = buildUploadRequest(new Uint8Array([1, 2, 3, 4]), "photo.png", "image/png", {
      resolution: "512",
      seed: "42",
      decimationTarget: "200000",
      textureSize: "1024",
    });
    const response = await POST(request);

    expect(response.status).toBe(202);
    const body = (await response.json()) as { id: string; seedUsed: number; status: string };
    expect(body.status).toBe("processing");
    expect(body.seedUsed).toBe(42);

    await waitForStatus(body.id, "complete");
  });

  it("threads user-supplied settings through to the generation service call (AC-17, AC-18, AC-19)", async () => {
    generateMock.mockResolvedValue({ glbBuffer: Buffer.from("glb-bytes") });

    const request = buildUploadRequest(new Uint8Array([1, 2, 3, 4]), "photo.png", "image/png", {
      resolution: "512",
      seed: "42",
      decimationTarget: "200000",
      textureSize: "1024",
    });
    const response = await POST(request);
    const body = (await response.json()) as { id: string };
    await waitForStatus(body.id, "complete");

    expect(generateMock).toHaveBeenCalledWith(
      {
        imageBuffer: expect.any(Buffer),
        mimeType: "image/png",
        overrides: { seed: 42, resolution: "512", decimationTarget: 200_000, textureSize: 1024 },
      },
      5000,
    );
  });

  it("assigns and returns a seedUsed value when seed is omitted (FR-16/AC-20)", async () => {
    generateMock.mockResolvedValue({ glbBuffer: Buffer.from("glb-bytes") });

    const request = buildUploadRequest(new Uint8Array([1, 2, 3, 4]), "photo.png", "image/png");
    const response = await POST(request);

    const body = (await response.json()) as { seedUsed: number; id: string };
    expect(Number.isInteger(body.seedUsed)).toBe(true);
    await waitForStatus(body.id, "complete");
  });

  it("rejects an invalid resolution before ever calling the generation service (AC-21, NFR-9)", async () => {
    const request = buildUploadRequest(new Uint8Array([1, 2, 3, 4]), "photo.png", "image/png", {
      resolution: "2048",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; message: string };
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.message).toBe("Invalid resolution. Must be 512, 1024, or 1536.");
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed seed before ever calling the generation service (AC-21, NFR-9)", async () => {
    const request = buildUploadRequest(new Uint8Array([1, 2, 3, 4]), "photo.png", "image/png", {
      seed: "not-a-number",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; message: string };
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range decimationTarget/textureSize before ever calling the generation service (AC-21, NFR-9)", async () => {
    const request = buildUploadRequest(new Uint8Array([1, 2, 3, 4]), "photo.png", "image/png", {
      decimationTarget: "999999999",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; message: string };
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("rejects an unsupported file type with 400 and never calls the generation service (AC-2, AC-12)", async () => {
    const request = buildUploadRequest(new Uint8Array([1, 2, 3]), "notes.txt", "text/plain");
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; message: string };
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("rejects an oversized file even when it bypasses client-side validation (AC-12, NFR-2)", async () => {
    const oversized = new Uint8Array(21 * 1024 * 1024); // > 20 MB default limit
    const request = buildUploadRequest(oversized, "huge.png", "image/png");
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; message: string };
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.message).toContain("too large");
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("rejects a request with no image field with 400 (LLD edge case #1)", async () => {
    const formData = new FormData();
    const request = new NextRequest("http://localhost/api/generate", { method: "POST", body: formData });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; message: string };
    expect(body.message).toBe("No image file was provided.");
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("marks the job failed when the generation service rejects, without an unhandled exception (AC-9)", async () => {
    generateMock.mockRejectedValue(new Error("Upstream error from TRELLIS.2"));

    const request = buildUploadRequest(new Uint8Array([1, 2, 3, 4]), "photo.png", "image/png");
    const response = await POST(request);
    expect(response.status).toBe(202);

    const body = (await response.json()) as { id: string };
    await waitForStatus(body.id, "failed");

    const jobResponse = await getJobRoute(new Request(`http://localhost/api/jobs/${body.id}`), {
      params: Promise.resolve({ id: body.id }),
    });
    const job = (await jobResponse.json()) as { status: string; errorMessage: string | null };
    expect(job.status).toBe("failed");
    expect(job.errorMessage).toBe("Upstream error from TRELLIS.2");
  });

  it("gives two back-to-back uploads independent job ids that both process (LLD edge case #8)", async () => {
    generateMock.mockResolvedValue({ glbBuffer: Buffer.from("glb-bytes") });

    const [responseA, responseB] = await Promise.all([
      POST(buildUploadRequest(new Uint8Array([1, 2]), "a.png", "image/png")),
      POST(buildUploadRequest(new Uint8Array([3, 4]), "b.png", "image/png")),
    ]);

    const bodyA = (await responseA.json()) as { id: string };
    const bodyB = (await responseB.json()) as { id: string };
    expect(bodyA.id).not.toBe(bodyB.id);

    await waitForStatus(bodyA.id, "complete");
    await waitForStatus(bodyB.id, "complete");
  });
});
