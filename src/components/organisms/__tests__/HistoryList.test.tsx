import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HistoryList } from "@/components/organisms/HistoryList";
import type { GenerationJobView } from "@/components/shared/types/generationJob";

const jobs: GenerationJobView[] = [
  {
    id: "job-1",
    status: "complete",
    sourceImageName: "photo-a.png",
    glbAvailable: true,
    errorMessage: null,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "job-2",
    status: "processing",
    sourceImageName: "photo-b.png",
    glbAvailable: false,
    errorMessage: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("HistoryList", () => {
  it("shows an empty state when there are no jobs (AC-6)", () => {
    render(<HistoryList jobs={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText("No generations yet.")).toBeInTheDocument();
  });

  it("renders each job with an accessible name including its status and timestamp (AC-6, AC-15)", () => {
    render(<HistoryList jobs={jobs} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /photo-a\.png, complete/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /photo-b\.png, processing/ })).toBeInTheDocument();
  });

  it("marks the selected job with aria-current", () => {
    render(<HistoryList jobs={jobs} selectedId="job-1" onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /photo-a\.png/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /photo-b\.png/ })).not.toHaveAttribute("aria-current");
  });

  it("calls onSelect with the job id when an entry is activated via keyboard (AC-7, AC-15)", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<HistoryList jobs={jobs} selectedId={null} onSelect={onSelect} />);

    const entry = screen.getByRole("button", { name: /photo-a\.png/ });
    entry.focus();
    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith("job-1");
  });
});
