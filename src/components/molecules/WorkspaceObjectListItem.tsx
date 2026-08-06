"use client";

import { useState, type KeyboardEvent } from "react";

import { Checkbox } from "@/components/atoms/Checkbox";
import { IconButton } from "@/components/atoms/IconButton";
import { TextInput } from "@/components/atoms/TextInput";
import type { WorkspaceObject } from "@/components/shared/types/workspaceObject";

export interface WorkspaceObjectListItemProps {
  object: WorkspaceObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSetVisible: (id: string, visible: boolean) => void;
  onSetWireframe: (id: string, wireframe: boolean) => void;
  onResetTransform: (id: string) => void;
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

function VisibilityIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.86-1.86A10.7 10.7 0 0 0 19 10c-1.6-3.4-5-6-9-6-1.3 0-2.53.28-3.64.78L3.28 2.22ZM10 6a4 4 0 0 1 3.86 5.1l-5-5A4 4 0 0 1 10 6ZM6.14 8.9a4 4 0 0 0 4.96 4.96l-4.96-4.96ZM1 10c1.6 3.4 5 6 9 6 1.06 0 2.08-.18 3.03-.51l-1.6-1.6A4 4 0 0 1 6.1 8.6L2.4 4.9A11 11 0 0 0 1 10Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M10 4c-4 0-7.4 2.6-9 6 1.6 3.4 5 6 9 6s7.4-2.6 9-6c-1.6-3.4-5-6-9-6Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
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

/** One workspace object row: label + select/duplicate/remove actions (unchanged, NFR-7),
 * plus visibility/wireframe toggles, a reset-transform action, and an inline
 * rename control (FR-7, FR-8, FR-10, FR-13) — purely presentational, driven
 * by props (mirrors `HistoryListItem.tsx`). */
export function WorkspaceObjectListItem({
  object,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
  onSetVisible,
  onSetWireframe,
  onResetTransform,
  onRename,
}: WorkspaceObjectListItemProps) {
  const label = object.name ?? (object.source.kind === "primitive" ? object.source.shape : object.source.fileName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(label);

  function commitRename(): void {
    const trimmed = draftName.trim();
    if (trimmed.length > 0) onRename(object.id, trimmed);
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
    <li className="flex flex-col gap-1.5 rounded-md border border-transparent px-1 py-1 hover:border-zinc-200 dark:hover:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
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
          <button
            type="button"
            aria-current={isSelected ? "true" : undefined}
            onClick={() => onSelect(object.id)}
            onDoubleClick={() => setIsRenaming(true)}
            className={`flex-1 truncate rounded-md px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50 ${
              isSelected
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {label}
          </button>
        )}
        <IconButton
          aria-label={isRenaming ? `Cancel rename of ${label}` : `Rename ${label}`}
          onClick={() => setIsRenaming((prev) => !prev)}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
            <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.878.507l-3 .857a.5.5 0 0 1-.618-.618l.857-3a2 2 0 0 1 .507-.878l8.504-8.196Z" />
          </svg>
        </IconButton>
        <IconButton aria-label={`Duplicate ${label}`} onClick={() => onDuplicate(object.id)}>
          <DuplicateIcon />
        </IconButton>
        <IconButton
          aria-label={object.visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => onSetVisible(object.id, !object.visible)}
        >
          <VisibilityIcon hidden={!object.visible} />
        </IconButton>
        <IconButton aria-label={`Reset transform of ${label}`} onClick={() => onResetTransform(object.id)}>
          <ResetIcon />
        </IconButton>
        <IconButton aria-label={`Remove ${label}`} onClick={() => onRemove(object.id)}>
          <RemoveIcon />
        </IconButton>
      </div>
      <Checkbox
        label="Wireframe"
        checked={object.wireframe}
        onChange={(event) => onSetWireframe(object.id, event.target.checked)}
      />
    </li>
  );
}
