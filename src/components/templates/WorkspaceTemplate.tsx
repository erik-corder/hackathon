import type { ReactNode } from "react";

export interface WorkspaceTemplateProps {
  /** Import panel(s) — external file import + generation-history import (left region). */
  import: ReactNode;
  /** Shared 3D scene (center region). */
  viewer: ReactNode;
  /** Object list + export controls (right region). */
  objectPanel: ReactNode;
}

/**
 * Pure layout composition for `/workspace`, mirroring `StudioLayout.tsx`'s
 * slot-composition pattern (import region, viewer region, object-list/export
 * region) — no owned logic (`04-lld.md` §1).
 */
export function WorkspaceTemplate({ import: importSlot, viewer, objectPanel }: WorkspaceTemplateProps) {
  return (
    <div className="dark flex h-full w-full flex-col bg-zinc-950 text-zinc-50 md:flex-row">
      <aside
        aria-label="Import GLB models"
        className="flex w-full flex-col gap-8 border-b border-zinc-800 p-6 md:w-auto md:h-full md:flex-shrink-0 md:overflow-y-auto md:border-b-0 md:border-r"
      >
        {importSlot}
      </aside>
      <main aria-label="Workspace 3D viewer" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6">
        {viewer}
      </main>
      <aside
        aria-label="Workspace objects and export"
        className="flex w-full flex-col gap-4 border-t border-zinc-800 p-6 md:w-80 md:h-full md:flex-shrink-0 md:overflow-y-auto md:border-t-0 md:border-l"
      >
        {objectPanel}
      </aside>
    </div>
  );
}
