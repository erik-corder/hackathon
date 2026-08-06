"use client";

import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Select } from "@/components/atoms/Select";
import { WorkspaceLightListItem } from "@/components/molecules/WorkspaceLightListItem";
import type { LightSource, LightType } from "@/components/shared/types/lightSource";

export interface WorkspaceLightingPanelProps {
  lights: LightSource[];
  selectedLightId: string | null;
  onAddLight: (type: LightType) => void;
  onUpdateLight: (id: string, patch: Partial<Omit<LightSource, "id" | "type">>) => void;
  onRemoveLight: (id: string) => void;
  onSelectLight: (id: string) => void;
  onDuplicateLight: (id: string) => void;
  onResetLight: (id: string) => void;
  onRenameLight: (id: string, name: string) => void;
}

const LIGHT_TYPE_OPTIONS: { value: LightType; label: string }[] = [
  { value: "point", label: "Point" },
  { value: "spot", label: "Spot" },
  { value: "directional", label: "Directional" },
];

/**
 * "Add light" control plus the list of configured lights (FR-1, FR-2, FR-6,
 * FR-10, FR-13). Owner hook is `useLightingRig` (via `useWorkspaceEditor`),
 * invoked by the page and passed down as props/callbacks per the
 * hook-owns-logic convention — no logic lives inside this organism.
 */
export function WorkspaceLightingPanel({
  lights,
  selectedLightId,
  onAddLight,
  onUpdateLight,
  onRemoveLight,
  onSelectLight,
  onDuplicateLight,
  onResetLight,
  onRenameLight,
}: WorkspaceLightingPanelProps) {
  const [selectedType, setSelectedType] = useState<LightType>("point");

  return (
    <section aria-labelledby="workspace-lighting-heading" className="flex flex-col gap-2">
      <h2 id="workspace-lighting-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Lighting ({lights.length})
      </h2>
      <div className="flex items-center gap-2">
        <Select
          aria-label="New light type"
          options={LIGHT_TYPE_OPTIONS}
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value as LightType)}
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => onAddLight(selectedType)}>
          Add light
        </Button>
      </div>
      {lights.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No lights added yet — the scene uses a minimal fallback light.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lights.map((light) => (
            <WorkspaceLightListItem
              key={light.id}
              light={light}
              isSelected={light.id === selectedLightId}
              onUpdate={onUpdateLight}
              onRemove={onRemoveLight}
              onSelect={onSelectLight}
              onDuplicate={onDuplicateLight}
              onReset={onResetLight}
              onRename={onRenameLight}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
