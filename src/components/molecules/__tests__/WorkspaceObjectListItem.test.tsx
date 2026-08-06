import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceObjectListItem } from "@/components/molecules/WorkspaceObjectListItem";
import type { WorkspaceObject } from "@/components/shared/types/workspaceObject";

const OBJECT: WorkspaceObject = {
  id: "1",
  source: { kind: "upload", fileName: "a.glb" },
  url: "blob:1",
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  },
  visible: true,
  wireframe: false,
};

function renderItem(overrides: Partial<Parameters<typeof WorkspaceObjectListItem>[0]> = {}) {
  return render(
    <WorkspaceObjectListItem
      object={OBJECT}
      isSelected={false}
      onSelect={vi.fn()}
      onRemove={vi.fn()}
      onDuplicate={vi.fn()}
      onSetVisible={vi.fn()}
      onSetWireframe={vi.fn()}
      onResetTransform={vi.fn()}
      onRename={vi.fn()}
      {...overrides}
    />,
  );
}

describe("WorkspaceObjectListItem", () => {
  it("renders a Duplicate button alongside Remove, wired to onDuplicate (AC-13)", async () => {
    const onDuplicate = vi.fn();
    const user = userEvent.setup();
    renderItem({ onDuplicate });

    const duplicateButton = screen.getByRole("button", { name: "Duplicate a.glb" });
    expect(duplicateButton).toBeInTheDocument();

    await user.click(duplicateButton);

    expect(onDuplicate).toHaveBeenCalledWith("1");
  });

  it("toggles visibility via onSetVisible (AC-13)", async () => {
    const onSetVisible = vi.fn();
    const user = userEvent.setup();
    renderItem({ onSetVisible });

    await user.click(screen.getByRole("button", { name: "Hide a.glb" }));

    expect(onSetVisible).toHaveBeenCalledWith("1", false);
  });

  it("toggles wireframe via onSetWireframe (AC-14)", async () => {
    const onSetWireframe = vi.fn();
    const user = userEvent.setup();
    renderItem({ onSetWireframe });

    await user.click(screen.getByRole("checkbox", { name: "Wireframe" }));

    expect(onSetWireframe).toHaveBeenCalledWith("1", true);
  });

  it("resets transform via onResetTransform (AC-16)", async () => {
    const onResetTransform = vi.fn();
    const user = userEvent.setup();
    renderItem({ onResetTransform });

    await user.click(screen.getByRole("button", { name: "Reset transform of a.glb" }));

    expect(onResetTransform).toHaveBeenCalledWith("1");
  });

  it("commits a rename on blur (AC-19)", async () => {
    const onRename = vi.fn();
    const user = userEvent.setup();
    renderItem({ onRename });

    await user.click(screen.getByRole("button", { name: "Rename a.glb" }));
    const input = screen.getByLabelText("Rename a.glb");
    await user.clear(input);
    await user.type(input, "My Object");
    await user.tab();

    expect(onRename).toHaveBeenCalledWith("1", "My Object");
  });
});
