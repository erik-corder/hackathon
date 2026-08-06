"use client";

import { useId, useState } from "react";

import { NumberInput } from "@/components/atoms/NumberInput";

export interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string | null;
}

/**
 * Labeled `<input type="number">` (used for decimationTarget/textureSize,
 * FR-14). Purely presentational — no owned business logic; the caller
 * (`GenerationSettingsPanel` via `useGenerationSettings`) owns the resolved
 * numeric value/error. Keeps its own local text buffer so the field reflects
 * exactly what the user is typing (including a transient empty string while
 * clearing/retyping) without the controlled `value` prop fighting the DOM;
 * the parent is only notified once the typed text parses to a valid integer.
 * Re-syncs the buffer during render (not via an effect) when `value` changes
 * externally (e.g. `SeedField`'s randomize action) — the React-recommended
 * "adjusting state when a prop changes" pattern.
 */
export function NumberField({ label, value, onChange, min, max, step, error }: NumberFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [text, setText] = useState(String(value));
  const [previousValue, setPreviousValue] = useState(value);

  if (value !== previousValue) {
    setPreviousValue(value);
    setText(String(value));
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <NumberInput
        id={id}
        value={text}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          const parsed = Number.parseInt(raw, 10);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
