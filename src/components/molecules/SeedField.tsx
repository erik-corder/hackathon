"use client";

import { useId, useState } from "react";

import { IconButton } from "@/components/atoms/IconButton";
import { NumberInput } from "@/components/atoms/NumberInput";

export interface SeedFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onRandomize: () => void;
  min?: number;
  max?: number;
  error?: string | null;
}

function DiceIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Zm3 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM7 13a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm-3-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Labeled seed input + "Randomize seed" action (FR-14/FR-16). Purely
 * presentational — no owned business logic; the caller
 * (`GenerationSettingsPanel` via `useGenerationSettings`) owns the value/error
 * and the randomize behavior itself. Keeps its own local text buffer (same
 * rationale as `NumberField`) so clearing/retyping the field behaves like a
 * normal text input rather than fighting the controlled `value` prop,
 * re-syncing it during render (not via an effect) whenever `value` changes
 * externally (e.g. the randomize action).
 */
export function SeedField({ label, value, onChange, onRandomize, min, max, error }: SeedFieldProps) {
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
      <div className="flex items-center gap-2">
        <NumberInput
          id={id}
          value={text}
          min={min}
          max={max}
          step={1}
          className="flex-1"
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            const parsed = Number.parseInt(raw, 10);
            if (!Number.isNaN(parsed)) onChange(parsed);
          }}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
        />
        <IconButton aria-label="Randomize seed" onClick={onRandomize}>
          <DiceIcon />
        </IconButton>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
