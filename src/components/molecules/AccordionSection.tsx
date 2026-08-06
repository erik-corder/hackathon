"use client";

import { useId, type ReactNode } from "react";

export interface AccordionSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Hand-rolled collapsible section (FR-3, OQ-1 — no new npm dependency): a
 * native `<button aria-expanded>` header and a conditionally-rendered
 * `role="region"` content block. Keyboard-operable by default (native
 * `<button>`), no ARIA reinvention beyond what's needed (NFR-6). Purely
 * presentational — owner hook is `useAccordionState`, passed in as
 * `expanded`/`onToggle` props (no state of its own).
 */
export function AccordionSection({ title, expanded, onToggle, children }: AccordionSectionProps) {
  const id = useId();
  const headerId = `${id}-header`;
  const contentId = `${id}-content`;

  return (
    <section className="flex flex-col gap-2 border-b border-zinc-800 pb-4 last:border-b-0 last:pb-0">
      <button
        id={headerId}
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left text-sm font-semibold text-zinc-50 transition-colors hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-50"
      >
        <span>{title}</span>
        <span aria-hidden="true" className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
          {">"}
        </span>
      </button>
      {expanded ? (
        <div id={contentId} role="region" aria-labelledby={headerId} className="flex flex-col gap-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
