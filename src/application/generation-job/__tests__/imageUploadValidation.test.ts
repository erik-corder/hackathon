import { describe, expect, it } from "vitest";

import { ValidationError } from "@/application/generation-job/validation/errors";
import { validateUpload } from "@/application/generation-job/validation/imageUploadValidation";

describe("validateUpload", () => {
  it("accepts a valid JPEG within the size limit (AC-1)", () => {
    expect(validateUpload({ mimeType: "image/jpeg", sizeBytes: 1024 })).toBeNull();
  });

  it("accepts a valid PNG within the size limit (AC-1)", () => {
    expect(validateUpload({ mimeType: "image/png", sizeBytes: 1024 })).toBeNull();
  });

  it("accepts a valid WebP within the size limit (AC-1)", () => {
    expect(validateUpload({ mimeType: "image/webp", sizeBytes: 1024 })).toBeNull();
  });

  it("rejects an unsupported MIME type (AC-2)", () => {
    const error = validateUpload({ mimeType: "application/pdf", sizeBytes: 1024 });
    expect(error).toBeInstanceOf(ValidationError);
    expect(error?.message).toBe("Unsupported file type. Please upload a JPG, PNG, or WebP image.");
  });

  it("rejects an oversized file (AC-2)", () => {
    const error = validateUpload({ mimeType: "image/png", sizeBytes: 1024, maxUploadBytes: 1000 });
    expect(error).toBeInstanceOf(ValidationError);
    expect(error?.message).toContain("too large");
  });

  it("rejects a zero-byte file as 'no file provided' (LLD edge case #1)", () => {
    const error = validateUpload({ mimeType: "image/png", sizeBytes: 0 });
    expect(error).toBeInstanceOf(ValidationError);
    expect(error?.message).toBe("No image file was provided.");
  });

  it("rejects a forged MIME type even with a plausible extension-implying name (LLD edge case #2)", () => {
    // Validation is based purely on the declared/sniffed MIME type, never the filename.
    const error = validateUpload({ mimeType: "application/octet-stream", sizeBytes: 1024 });
    expect(error).toBeInstanceOf(ValidationError);
  });

  it("respects a custom maxUploadBytes override", () => {
    expect(validateUpload({ mimeType: "image/png", sizeBytes: 500, maxUploadBytes: 1000 })).toBeNull();
    expect(validateUpload({ mimeType: "image/png", sizeBytes: 1500, maxUploadBytes: 1000 })).toBeInstanceOf(
      ValidationError,
    );
  });
});
