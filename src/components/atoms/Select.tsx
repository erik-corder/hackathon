import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

/**
 * Primitive `<select>` atom. Pure presentation only (no owned business logic,
 * per the Atomic Design guardrail) — a real `<select>` element so it is
 * reachable via Tab and operable via standard keyboard interaction by default
 * (AC-25/NFR-8).
 */
export function Select({ options, className = "", ...rest }: SelectProps) {
  return (
    <select
      className={`rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:outline-zinc-50 ${className}`}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
