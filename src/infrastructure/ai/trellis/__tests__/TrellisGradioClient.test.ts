import { afterEach, describe, expect, it, vi } from "vitest";

import {
  QuotaExceededError,
  TimeoutError,
  UpstreamGenerationError,
} from "@/application/generation-job/validation/errors";

const connectMock = vi.fn();
const handleFileMock = vi.fn((file: unknown) => ({ __handled: file }));

vi.mock("@gradio/client", () => ({
  Client: { connect: connectMock },
  handle_file: handleFileMock,
}));

// Import after the mock is registered so TrellisGradioClient picks up the mocked module.
const { TrellisGradioClient, withTimeout } = await import("@/infrastructure/ai/trellis/TrellisGradioClient");

function createFakeClient(overrides: {
  predict: ReturnType<typeof vi.fn>;
  fetch?: ReturnType<typeof vi.fn>;
}) {
  return {
    config: { root: "https://microsoft-trellis-2.hf.space" },
    api_prefix: "/gradio_api",
    predict: overrides.predict,
    fetch:
      overrides.fetch ??
      vi.fn(async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => new TextEncoder().encode("glb-bytes").buffer,
      })),
  };
}

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with the promise's value if it settles before the timeout", async () => {
    const result = await withTimeout(Promise.resolve("done"), 1000, () => new TimeoutError("timed out"));
    expect(result).toBe("done");
  });

  it("rejects with the timeout error if the promise never settles in time (AC-14)", async () => {
    vi.useFakeTimers();
    const neverResolves = new Promise<never>(() => {});

    const race = withTimeout(neverResolves, 5000, () => new TimeoutError("timed out"));
    const assertion = expect(race).rejects.toBeInstanceOf(TimeoutError);

    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  });
});

describe("TrellisGradioClient.generate", () => {
  afterEach(() => {
    connectMock.mockReset();
    vi.useRealTimers();
  });

  it("calls /image_to_3d then /extract_glb on the same session and returns the GLB bytes (Risk R-5 verified shape)", async () => {
    const predict = vi
      .fn()
      .mockResolvedValueOnce({ data: ["<html>preview</html>"] }) // /image_to_3d
      .mockResolvedValueOnce({ data: [{ path: "/tmp/model.glb" }, { path: "/tmp/model.glb" }] }); // /extract_glb
    const fakeClient = createFakeClient({ predict });
    connectMock.mockResolvedValue(fakeClient);

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });
    const result = await client.generate(
      { imageBuffer: Buffer.from("image-bytes"), mimeType: "image/png" },
      10_000,
    );

    expect(connectMock).toHaveBeenCalledWith("microsoft/TRELLIS.2", { with_null_state: true });
    expect(predict).toHaveBeenNthCalledWith(1, "/image_to_3d", [
      expect.objectContaining({ __handled: expect.any(Blob) }),
      0,
      "1024",
      7.5,
      0.7,
      12,
      5,
      7.5,
      0.5,
      12,
      3,
      1,
      0,
      12,
      3,
    ]);
    expect(predict).toHaveBeenNthCalledWith(2, "/extract_glb", [null, 300_000, 2048]);
    expect(result.glbBuffer.toString()).toBe("glb-bytes");
  });

  it("substitutes exactly the 4 override positions, leaving the other 10 /image_to_3d params untouched (AC-18, AC-19)", async () => {
    const predict = vi
      .fn()
      .mockResolvedValueOnce({ data: ["<html>preview</html>"] }) // /image_to_3d
      .mockResolvedValueOnce({ data: [{ path: "/tmp/model.glb" }, { path: "/tmp/model.glb" }] }); // /extract_glb
    const fakeClient = createFakeClient({ predict });
    connectMock.mockResolvedValue(fakeClient);

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });
    await client.generate(
      {
        imageBuffer: Buffer.from("image-bytes"),
        mimeType: "image/png",
        overrides: { seed: 42, resolution: "512", decimationTarget: 150_000, textureSize: 1024 },
      },
      10_000,
    );

    expect(predict).toHaveBeenNthCalledWith(1, "/image_to_3d", [
      expect.objectContaining({ __handled: expect.any(Blob) }),
      42,
      "512",
      7.5,
      0.7,
      12,
      5,
      7.5,
      0.5,
      12,
      3,
      1,
      0,
      12,
      3,
    ]);
    expect(predict).toHaveBeenNthCalledWith(2, "/extract_glb", [null, 150_000, 1024]);
  });

  it("falls back to the server defaults for any override field left unspecified (D5)", async () => {
    const predict = vi
      .fn()
      .mockResolvedValueOnce({ data: ["<html>preview</html>"] })
      .mockResolvedValueOnce({ data: [{ path: "/tmp/model.glb" }] });
    connectMock.mockResolvedValue(createFakeClient({ predict }));

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });
    await client.generate(
      {
        imageBuffer: Buffer.from("image-bytes"),
        mimeType: "image/png",
        overrides: { seed: 7 },
      },
      10_000,
    );

    expect(predict).toHaveBeenNthCalledWith(1, "/image_to_3d", [
      expect.objectContaining({ __handled: expect.any(Blob) }),
      7,
      "1024",
      7.5,
      0.7,
      12,
      5,
      7.5,
      0.5,
      12,
      3,
      1,
      0,
      12,
      3,
    ]);
    expect(predict).toHaveBeenNthCalledWith(2, "/extract_glb", [null, 300_000, 2048]);
  });

  it("passes the HF token through to Client.connect when provided", async () => {
    const predict = vi
      .fn()
      .mockResolvedValueOnce({ data: ["<html>preview</html>"] })
      .mockResolvedValueOnce({ data: [{ url: "https://example.com/model.glb" }] });
    connectMock.mockResolvedValue(createFakeClient({ predict }));

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2", hfToken: "hf_test_token" });
    await client.generate({ imageBuffer: Buffer.from("x"), mimeType: "image/png" }, 10_000);

    expect(connectMock).toHaveBeenCalledWith("microsoft/TRELLIS.2", {
      token: "hf_test_token",
      with_null_state: true,
    });
  });

  it("throws UpstreamGenerationError when /extract_glb returns no usable file reference (LLD edge case #3)", async () => {
    const predict = vi
      .fn()
      .mockResolvedValueOnce({ data: ["<html>preview</html>"] })
      .mockResolvedValueOnce({ data: [] });
    connectMock.mockResolvedValue(createFakeClient({ predict }));

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });

    await expect(
      client.generate({ imageBuffer: Buffer.from("x"), mimeType: "image/png" }, 10_000),
    ).rejects.toBeInstanceOf(UpstreamGenerationError);
  });

  it("throws UpstreamGenerationError when downloading the GLB file fails", async () => {
    const predict = vi
      .fn()
      .mockResolvedValueOnce({ data: ["<html>preview</html>"] })
      .mockResolvedValueOnce({ data: [{ path: "/tmp/model.glb" }] });
    const fakeClient = createFakeClient({
      predict,
      fetch: vi.fn(async () => ({ ok: false, status: 500, arrayBuffer: async () => new ArrayBuffer(0) })),
    });
    connectMock.mockResolvedValue(fakeClient);

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });

    await expect(
      client.generate({ imageBuffer: Buffer.from("x"), mimeType: "image/png" }, 10_000),
    ).rejects.toBeInstanceOf(UpstreamGenerationError);
  });

  it("rejects with TimeoutError when the Space never responds within the configured timeout (AC-9, AC-14)", async () => {
    vi.useFakeTimers();
    connectMock.mockReturnValue(new Promise(() => {})); // Client.connect itself never resolves.

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });
    const generation = client.generate({ imageBuffer: Buffer.from("x"), mimeType: "image/png" }, 5000);
    const assertion = expect(generation).rejects.toBeInstanceOf(TimeoutError);

    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  });

  it("wraps an unexpected thrown error as UpstreamGenerationError rather than letting it propagate raw", async () => {
    connectMock.mockRejectedValue(new Error("network unreachable"));

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });

    await expect(
      client.generate({ imageBuffer: Buffer.from("x"), mimeType: "image/png" }, 10_000),
    ).rejects.toBeInstanceOf(UpstreamGenerationError);
  });

  it("classifies a synthetic HTTP 429-status error as QuotaExceededError (AC-24)", async () => {
    const statusError = Object.assign(new Error("Too Many Requests"), { status: 429 });
    connectMock.mockRejectedValue(statusError);

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });

    await expect(
      client.generate({ imageBuffer: Buffer.from("x"), mimeType: "image/png" }, 10_000),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  });

  it("classifies a quota-message-shaped error (no status) as QuotaExceededError (AC-24)", async () => {
    connectMock.mockRejectedValue(new Error("You have exceeded your GPU quota. Please try again later."));

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });

    const generation = client.generate({ imageBuffer: Buffer.from("x"), mimeType: "image/png" }, 10_000);
    await expect(generation).rejects.toBeInstanceOf(QuotaExceededError);
    await expect(generation).rejects.toThrow(/quota or rate limit/i);
  });

  it("does not misclassify a generic error as quota-related (D8)", async () => {
    connectMock.mockRejectedValue(new Error("network unreachable"));

    const client = new TrellisGradioClient({ spaceId: "microsoft/TRELLIS.2" });

    const generation = client.generate({ imageBuffer: Buffer.from("x"), mimeType: "image/png" }, 10_000);
    await expect(generation).rejects.toBeInstanceOf(UpstreamGenerationError);
    await expect(generation).rejects.not.toBeInstanceOf(QuotaExceededError);
  });
});
