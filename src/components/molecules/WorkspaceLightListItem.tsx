"use client";

import { useState, type KeyboardEvent } from "react";

import { Checkbox } from "@/components/atoms/Checkbox";
import { ColorInput } from "@/components/atoms/ColorInput";
import { IconButton } from "@/components/atoms/IconButton";
import { NumberInput } from "@/components/atoms/NumberInput";
import { TextInput } from "@/components/atoms/TextInput";
import { Vec3NumericInputGroup } from "@/components/molecules/Vec3NumericInputGroup";
import type { LightSource } from "@/components/shared/types/lightSource";
import type { Vec3Tuple } from "@/components/shared/types/workspaceObject";

export interface WorkspaceLightListItemProps {
  light: LightSource;
  isSelected: boolean;
  onUpdate: (id: string, patch: Partial<Omit<LightSource, "id" | "type">>) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReset: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M6 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h3a1 1 0 1 1 0 2h-1v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 1 1 0-2h3V4Zm2 1v-1h4v1H8Zm-1 3v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8H7Z" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M7 3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H7Zm0 2h6v8H7V5ZM4 7a1 1 0 0 0-1 1v8a2 2 0 0 0 2 2h6a1 1 0 1 0 0-2H5V8a1 1 0 0 0-1-1Z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M10 3a7 7 0 1 0 6.32 4H14.5a5 5 0 1 1-1.36-2.36L11 7h6V1l-2.06 2.06A6.98 6.98 0 0 0 10 3Z" />
    </svg>
  );
}

/**
 * One light row: read-only type badge, color/intensity/shadow toggle, and
 * position/target numeric editors, plus select/duplicate/reset/rename/remove
 * actions (FR-1, FR-6, FR-10, FR-13 — mirrors `WorkspaceObjectListItem.tsx`'s
 * per-row action precedent, `04-lld.md` §T-8). Purely presentational — driven
 * entirely by props, owner hook is `useLightingRig` via
 * `WorkspaceLightingPanel`.
 */
export function WorkspaceLightListItem({
  light,
  isSelected,
  onUpdate,
  onRemove,
  onSelect,
  onDuplicate,
  onReset,
  onRename,
}: WorkspaceLightListItemProps) {
  const showPosition = light.type === "point" || light.type === "spot";
  const showTarget = light.type === "spot" || light.type === "directional";
  const label = light.name ?? `${light.type} light`;
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(label);

  function commitRename(): void {
    const trimmed = draftName.trim();
    if (trimmed.length > 0) onRename(light.id, trimmed);
    setIsRenaming(false);
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      setDraftName(label);
      setIsRenaming(false);
    }
  }

  return (
    <li
      className={`flex flex-col gap-2 rounded-md border p-3 ${
        isSelected ? "border-zinc-900 dark:border-zinc-50" : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(light.id)}
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {light.type}
        </button>
        {isRenaming ? (
          <TextInput
            aria-label={`Rename ${label}`}
            autoFocus
            value={draftName}
            className="flex-1"
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
          />
        ) : (
          <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
        )}
        <div className="flex items-center gap-2">
          <ColorInput
            aria-label={`${light.type} light color`}
            value={light.color}
            onChange={(event) => onUpdate(light.id, { color: event.target.value })}
          />
          <NumberInput
            aria-label={`${light.type} light intensity`}
            value={light.intensity}
            step={0.1}
            className="w-20"
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (Number.isFinite(parsed)) onUpdate(light.id, { intensity: parsed });
            }}
          />
          <Checkbox
            label="Cast shadow"
            checked={light.castShadow}
            onChange={(event) => onUpdate(light.id, { castShadow: event.target.checked })}
          />
          <IconButton
            aria-label={isRenaming ? `Cancel rename of ${label}` : `Rename ${label}`}
            onClick={() => setIsRenaming((prev) => !prev)}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
              <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.878.507l-3 .857a.5.5 0 0 1-.618-.618l.857-3a2 2 0 0 1 .507-.878l8.504-8.196Z" />
            </svg>
          </IconButton>
          <IconButton aria-label={`Duplicate ${light.type} light`} onClick={() => onDuplicate(light.id)}>
            <DuplicateIcon />
          </IconButton>
          <IconButton aria-label={`Reset ${light.type} light transform`} onClick={() => onReset(light.id)}>
            <ResetIcon />
          </IconButton>
          <IconButton aria-label={`Remove ${light.type} light`} onClick={() => onRemove(light.id)}>
            <RemoveIcon />
          </IconButton>
        </div>
      </div>
      {showPosition ? (
        <Vec3NumericInputGroup
          legend="Position"
          value={light.position}
          onCommit={(next: Vec3Tuple) => onUpdate(light.id, { position: next })}
        />
      ) : null}
      {showTarget ? (
        <Vec3NumericInputGroup
          legend="Direction / target"
          value={light.target}
          onCommit={(next: Vec3Tuple) => onUpdate(light.id, { target: next })}
        />
      ) : null}
    </li>
  );
}
