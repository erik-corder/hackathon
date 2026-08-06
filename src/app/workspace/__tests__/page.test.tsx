import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// `@react-three/fiber`'s <Canvas> requires WebGL, unavailable in jsdom —
// mocked as a passthrough, matching `GlbViewer.test.tsx`'s existing strategy.
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  Grid: () => null,
  Environment: () => null,
  useGLTF: () => ({ scene: {} }),
  TransformControls: () => null,
}));

const generationJobsApi = await import("@/components/shared/api/generationJobsApi");
const { default: WorkspacePage } = await import("@/app/workspace/page");

describe("/workspace page", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("composes the workspace organisms without throwing, with an empty workspace by default (AC-1, AC-2)", async () => {
    vi.spyOn(generationJobsApi, "listJobs").mockResolvedValue([]);

    render(<WorkspacePage />);

    expect(screen.getByRole("heading", { name: "Import GLB files" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Workspace scene" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Objects (0)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export workspace" })).toBeDisabled();
    // New panels for this run (lighting rig, snapping, undo/redo) compose
    // into the existing objectPanel/viewer slots without a layout change.
    expect(screen.getByRole("heading", { name: "Lighting (0)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Snapping" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  });

  it("presents the sidebar as six independently collapsible accordion sections (AC-4)", async () => {
    vi.spyOn(generationJobsApi, "listJobs").mockResolvedValue([]);
    render(<WorkspacePage />);

    for (const title of ["Objects", "Lights", "Shapes", "Materials", "Snapping", "Export"]) {
      const header = screen.getByRole("button", { name: title });
      expect(header).toHaveAttribute("aria-expanded", "true");
    }
  });

  it("collapses and re-expands a section independently of the others, surviving an unrelated action (AC-4, AC-5)", async () => {
    vi.spyOn(generationJobsApi, "listJobs").mockResolvedValue([]);
    const user = userEvent.setup();
    render(<WorkspacePage />);

    const shapesHeader = screen.getByRole("button", { name: "Shapes" });
    await user.click(shapesHeader);
    expect(shapesHeader).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Objects" })).toHaveAttribute("aria-expanded", "true");

    // Unrelated action, performed in a still-expanded section, must not
    // reset the Shapes section's now-collapsed state.
    await user.click(screen.getByRole("button", { name: "Add light" }));

    expect(shapesHeader).toHaveAttribute("aria-expanded", "false");
  });

  it("adding a primitive shape selects it and shows it in the Objects list (AC-6)", async () => {
    vi.spyOn(generationJobsApi, "listJobs").mockResolvedValue([]);
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await user.click(screen.getByRole("button", { name: "Add Cube" }));

    expect(screen.getByRole("heading", { name: "Objects (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cube" })).toHaveAttribute("aria-current", "true");
  });
});
