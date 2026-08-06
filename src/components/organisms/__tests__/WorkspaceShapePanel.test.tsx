import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceShapePanel } from "@/components/organisms/WorkspaceShapePanel";

describe("WorkspaceShapePanel", () => {
  it("renders a button for each of the six primitive shapes (AC-6)", () => {
    render(<WorkspaceShapePanel onAddPrimitive={vi.fn()} />);

    for (const label of ["Add Cube", "Add Sphere", "Add Cylinder", "Add Plane", "Add Cone", "Add Torus"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("calls onAddPrimitive with the clicked shape (AC-6)", async () => {
    const onAddPrimitive = vi.fn();
    const user = userEvent.setup();
    render(<WorkspaceShapePanel onAddPrimitive={onAddPrimitive} />);

    await user.click(screen.getByRole("button", { name: "Add Torus" }));

    expect(onAddPrimitive).toHaveBeenCalledWith("torus");
  });
});
