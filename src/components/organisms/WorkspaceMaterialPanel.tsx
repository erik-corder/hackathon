"use client";

import { WorkspaceMaterialControls } from "@/components/molecules/WorkspaceMaterialControls";
import type { WorkspaceObject, WorkspaceObjectMaterial } from "@/components/shared/types/workspaceObject";

export interface WorkspaceMaterialPanelProps {
  selectedObject: WorkspaceObject | null;
  onUpdateMaterial: (id: string, patch: Partial<WorkspaceObjectMaterial>) => void;
}

/**
 * Material (base color + texture) controls for the currently selected object
 * (FR-5). Renders an empty-state message when nothing is selected, matching
 * `WorkspaceTransformInputs`'s existing `selectedObject: | null` precedent.
 * No owned logic.
 */
export function WorkspaceMaterialPanel({ selectedObject, onUpdateMaterial }: WorkspaceMaterialPanelProps) {
  return (
    <section aria-labelledby="workspace-material-heading" className="flex flex-col gap-2">
      <h2 id="workspace-material-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Materials
      </h2>
      {selectedObject ? (
        <WorkspaceMaterialControls object={selectedObject} onUpdateMaterial={onUpdateMaterial} />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Select an object to edit its material.</p>
      )}
    </section>
  );
}
