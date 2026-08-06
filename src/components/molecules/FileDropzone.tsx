"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";

export interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  accept: string;
  error?: string | null;
  disabled?: boolean;
}

/**
 * Drag/drop + click-to-browse image picker. Owns only local drag-over UI
 * state — validation and submission are the caller's (`useSubmitGeneration`)
 * responsibility; this molecule just surfaces the selected file and displays
 * whatever error message it is handed as a prop (`04-lld.md` Frontend
 * Component Tree).
 */
export function FileDropzone({ onFileSelected, accept, error, disabled = false }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFiles(files: FileList | null): void {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  function openFileBrowser(): void {
    if (!disabled) inputRef.current?.click();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFileBrowser();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    handleFiles(event.target.files);
    event.target.value = "";
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload an image"
        aria-disabled={disabled}
        onClick={openFileBrowser}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-50 ${
          disabled
            ? "cursor-not-allowed border-zinc-200 opacity-60 dark:border-zinc-800"
            : "cursor-pointer border-zinc-300 dark:border-zinc-700"
        } ${isDragOver && !disabled ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900" : ""}`}
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Drag and drop an image here, or click to browse.
        </p>
        <p className="text-xs text-zinc-400">JPG, PNG, or WebP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        onChange={handleInputChange}
      />
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
