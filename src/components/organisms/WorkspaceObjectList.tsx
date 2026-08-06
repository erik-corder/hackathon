"use client";

import { Button } from "@/components/atoms/Button";
import { WorkspaceObjectListItem } from "@/components/molecules/WorkspaceObjectListItem";
import type { WorkspaceObject } from "@/components/shared/types/workspaceObject";

export interface WorkspaceObjectListProps {
  objects: WorkspaceObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onClear: () => void;
  onSetVisible: (id: string, visible: boolean) => void;
  onSetWireframe: (id: string, wireframe: boolean) => void;
  onResetTransform: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

/**
 * Object list with per-object duplicate/remove/visibility/wireframe/reset/
 * rename actions and a single "Clear workspace" action (FR-7, FR-8, FR-10,
 * FR-13). Owner hook is `useWorkspaceObjects`/`useWorkspaceEditor` (`remove`,
 * `duplicate`, `clear`, `setVisible`, `setWireframe`, `resetTransform`,
 * `rename`), called by the page and passed down as callbacks.
 */
export function WorkspaceObjectList({
  objects,
  selectedId,
  onSelect,
  onRemove,
  onDuplicate,
  onClear,
  onSetVisible,
  onSetWireframe,
  onResetTransform,
  onRename,
}: WorkspaceObjectListProps) {
  return (
    <section aria-labelledby="workspace-object-list-heading" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 id="workspace-object-list-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Objects ({objects.length})
        </h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClear}
          disabled={objects.length === 0}
        >
          Clear workspace
        </Button>
      </div>
      {objects.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No objects imported yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {objects.map((object) => (
            <WorkspaceObjectListItem
              key={object.id}
              object={object}
              isSelected={object.id === selectedId}
              onSelect={onSelect}
              onRemove={onRemove}
              onDuplicate={onDuplicate}
              onSetVisible={onSetVisible}
              onSetWireframe={onSetWireframe}
              onResetTransform={onResetTransform}
              onRename={onRename}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
