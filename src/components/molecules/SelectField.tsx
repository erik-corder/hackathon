"use client";

import { useId } from "react";

import { Select, type SelectOption } from "@/components/atoms/Select";

export interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string | null;
}

/**
 * Labeled `<select>` (used for the resolution control, FR-14). Purely
 * presentational — no owned business logic; the caller (`GenerationSettingsPanel`
 * via `useGenerationSettings`) owns the value/error.
 */
export function SelectField({ label, value, options, onChange, error }: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        options={options}
        onChange={(event) => onChange(event.target.value)}
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
