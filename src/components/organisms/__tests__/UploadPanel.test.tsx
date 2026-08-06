import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UploadPanel } from "@/components/organisms/UploadPanel";
import * as generationJobsApi from "@/components/shared/api/generationJobsApi";
import type { GenerationSettingsValues } from "@/components/shared/types/generationJob";

const SETTINGS: GenerationSettingsValues = {
  resolution: "1024",
  seed: 42,
  decimationTarget: 300_000,
  textureSize: 2048,
};

describe("UploadPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a valid file with the current settings, shows its status, and notifies the caller (AC-1, AC-3, AC-17)", async () => {
    const job = {
      id: "job-1",
      status: "processing" as const,
      sourceImageName: "photo.png",
      glbAvailable: false,
      errorMessage: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      seedUsed: 42,
    };
    vi.spyOn(generationJobsApi, "submitGenerationJob").mockResolvedValue(job);
    const onSubmitted = vi.fn();

    const { container } = render(<UploadPanel settings={SETTINGS} onSubmitted={onSubmitted} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "photo.png", { type: "image/png" });

    await userEvent.upload(input, file);

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(job));
    expect(screen.getByText("photo.png")).toBeInTheDocument();
    expect(generationJobsApi.submitGenerationJob).toHaveBeenCalledWith(file, SETTINGS);
  });

  it("renders the seed actually used once a job has been submitted (FR-16/AC-20)", async () => {
    const job = {
      id: "job-1",
      status: "processing" as const,
      sourceImageName: "photo.png",
      glbAvailable: false,
      errorMessage: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      seedUsed: 12345,
    };
    vi.spyOn(generationJobsApi, "submitGenerationJob").mockResolvedValue(job);

    const { container } = render(<UploadPanel settings={SETTINGS} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "photo.png", { type: "image/png" });

    await userEvent.upload(input, file);

    expect(await screen.findByText("Seed used: 12345")).toBeInTheDocument();
  });

  it("shows a specific error and never calls the API for an unsupported file type (AC-2)", async () => {
    const submitSpy = vi.spyOn(generationJobsApi, "submitGenerationJob");
    const { container } = render(<UploadPanel settings={SETTINGS} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });

    // userEvent.upload enforces the input's `accept` filter (like a real OS file
    // picker would); fire the change event directly to simulate a file that
    // slips past client-side filtering, exercising the same client-side error
    // path the server would otherwise have to reject (AC-2/AC-12).
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);

    expect(
      await screen.findByText("Unsupported file type. Please upload a JPG, PNG, or WebP image."),
    ).toBeInTheDocument();
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it("exposes an accessible heading for the upload section", () => {
    render(<UploadPanel settings={SETTINGS} />);
    expect(screen.getByRole("heading", { name: "Upload an image" })).toBeInTheDocument();
  });
});
