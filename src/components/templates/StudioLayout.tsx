import type { ReactNode } from "react";

export interface StudioLayoutProps {
  /** Upload + generation-settings panel (left region, FR-19). */
  left: ReactNode;
  /** 3D viewer (center region, FR-19). */
  viewer: ReactNode;
  /** Recent-generations gallery/history panel (right region, FR-19). */
  gallery: ReactNode;
}

/**
 * Three-pane layout: upload+settings (left), 3D viewer (center),
 * recent-generations gallery (right) — FR-19/AC-23. Pure layout composition,
 * no owned logic — receives organisms as children/slots (`04-lld.md` Frontend
 * Component Tree). The `dark` class forces the dark-workspace styling
 * (matching the request's written description, since no reference image was
 * provided — spec Assumption A-7) unconditionally, rather than only when the
 * visitor's OS is set to a dark color scheme, reusing every existing
 * component's `dark:` utility classes rather than duplicating dark styling.
 */
export function StudioLayout({ left, viewer, gallery }: StudioLayoutProps) {
  return (
    <div className="dark flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-50 md:flex-row">
      <aside
        aria-label="Upload and generation settings"
        className="flex w-full flex-col gap-8 border-b border-zinc-800 p-6 md:w-80 md:flex-shrink-0 md:overflow-y-auto md:border-b-0 md:border-r"
      >
        {left}
      </aside>
      <main aria-label="3D viewer" className="min-w-0 flex-1 p-6">
        {viewer}
      </main>
      <aside
        aria-label="Recent generations gallery"
        className="flex w-full flex-col gap-4 border-t border-zinc-800 p-6 md:w-80 md:flex-shrink-0 md:overflow-y-auto md:border-t-0 md:border-l"
      >
        {gallery}
      </aside>
    </div>
  );
}
