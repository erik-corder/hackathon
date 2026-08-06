"use client";

import { Button } from "@/components/atoms/Button";
import type { PrimitiveShapeType } from "@/components/shared/types/workspaceObject";

export interface WorkspaceShapePanelProps {
  onAddPrimitive: (shape: PrimitiveShapeType) => void;
}

const SHAPE_OPTIONS: { value: PrimitiveShapeType; label: string }[] = [
  { value: "cube", label: "Cube" },
  { value: "sphere", label: "Sphere" },
  { value: "cylinder", label: "Cylinder" },
  { value: "plane", label: "Plane" },
  { value: "cone", label: "Cone" },
  { value: "torus", label: "Torus" },
];

/**
 * "Add shape" controls (FR-4): six buttons, one per primitive shape. No
 * owned logic — driven entirely by props, owner hook is
 * `useWorkspaceObjects.addPrimitive` via `useWorkspaceEditor`.
 */
export function WorkspaceShapePanel({ onAddPrimitive }: WorkspaceShapePanelProps) {
  return (
    <section aria-labelledby="workspace-shapes-heading" className="flex flex-col gap-2">
      <h2 id="workspace-shapes-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Shapes
      </h2>
      <div className="flex flex-wrap gap-2">
        {SHAPE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onAddPrimitive(option.value)}
          >
            Add {option.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
