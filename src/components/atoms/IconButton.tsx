import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — an icon-only control has no visible text, so it must always have an accessible name (AC-15/NFR-4). */
  "aria-label": string;
  children: ReactNode;
}

/**
 * Icon-only button atom. `aria-label` is a required prop (not optional) so it
 * is impossible to render an icon button without an accessible name.
 */
export function IconButton({ className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
