import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-300 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
  secondary:
    "bg-transparent text-zinc-900 border border-zinc-300 hover:bg-zinc-100 disabled:text-zinc-400 dark:text-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800",
  ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100 disabled:text-zinc-400 dark:text-zinc-50 dark:hover:bg-zinc-800",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
};

/**
 * Primitive button atom. Pure presentation only (no owned business logic, per
 * the Atomic Design guardrail) — a real `<button>` element so it is reachable
 * via Tab and operable via Enter/Space by default (AC-15/NFR-4).
 */
export function Button({ variant = "primary", size = "md", className = "", ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed dark:focus-visible:outline-zinc-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    />
  );
}
