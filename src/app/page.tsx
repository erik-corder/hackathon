"use client";

import { useGenerationHistory } from "@/components/features/history/useGenerationHistory";
import { useGenerationSettings } from "@/components/features/settings/useGenerationSettings";
import { GenerationSettingsPanel } from "@/components/organisms/GenerationSettingsPanel";
import { GlbViewer } from "@/components/organisms/GlbViewer";
import { HistoryList } from "@/components/organisms/HistoryList";
import { UploadPanel } from "@/components/organisms/UploadPanel";
import { StudioLayout } from "@/components/templates/StudioLayout";

/**
 * Page-level composition. Calls `useGenerationHistory()` and
 * `useGenerationSettings()` once each here so their state is a single source
 * of truth shared across `GenerationSettingsPanel`/`UploadPanel` (settings +
 * post-submit refresh), `HistoryList` (list + selection), and `GlbViewer`
 * (selection → preview), per `04-lld.md` §5's invalidation note. Composes the
 * three-pane `StudioLayout` (FR-19/AC-23): left = settings + upload, viewer =
 * center, gallery = the unmodified `HistoryList`/`useGenerationHistory` pair,
 * repositioned per Assumption A-11.
 */
export default function Home() {
  const { jobs, selectedId, select, refresh } = useGenerationHistory();
  const settings = useGenerationSettings();

  return (
    <StudioLayout
      left={
        <>
          <GenerationSettingsPanel {...settings} />
          <UploadPanel settings={settings.values} onSubmitted={() => void refresh()} />
        </>
      }
      viewer={<GlbViewer jobId={selectedId} />}
      gallery={<HistoryList jobs={jobs} selectedId={selectedId} onSelect={select} />}
    />
  );
}
