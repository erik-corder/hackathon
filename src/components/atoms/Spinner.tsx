export interface SpinnerProps {
  /** Visually-hidden label announced to assistive tech (AC-15/NFR-4). */
  label?: string;
}

/** Loading indicator atom. Purely presentational. */
export function Spinner({ label = "Loading" }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
