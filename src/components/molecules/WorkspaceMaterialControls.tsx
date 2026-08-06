"use client";

import { useState, type ChangeEvent } from "react";

import { ColorInput } from "@/components/atoms/ColorInput";
import { FileInput } from "@/components/atoms/FileInput";
import type { WorkspaceObject, WorkspaceObjectMaterial } from "@/components/shared/types/workspaceObject";

export interface WorkspaceMaterialControlsProps {
  object: WorkspaceObject;
  onUpdateMaterial: (id: string, patch: Partial<WorkspaceObjectMaterial>) => void;
}

/**
 * Base color + texture-upload controls for the selected object (FR-5).
 * Purely presentational — owner hook is `useWorkspaceObjects.updateMaterial`
 * via `useWorkspaceEditor`, invoked here only through the `onUpdateMaterial`
 * callback prop. Texture file validation (A-7) and the `FileReader`
 * data-URL conversion happen here, matching `04-lld.md` §4's "hand-rolled,
 * no Zod schema" validation rule for a single scalar file-type check.
 */
export function WorkspaceMaterialControls({ object, onUpdateMaterial }: WorkspaceMaterialControlsProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  function handleColorChange(event: ChangeEvent<HTMLInputElement>): void {
    onUpdateMaterial(object.id, { color: event.target.value });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError(`${file.name} is not an image file.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileError(null);
      onUpdateMaterial(object.id, { textureDataUrl: reader.result as string });
    };
    reader.onerror = () => {
      setFileError(`${file.name} could not be read.`);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <ColorInput
          aria-label="Object base color"
          value={object.material?.color ?? "#ffffff"}
          onChange={handleColorChange}
        />
        <FileInput aria-label="Upload texture image" accept="image/*" onChange={handleFileChange} />
      </div>
      {fileError ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {fileError}
        </p>
      ) : null}
    </div>
  );
}
