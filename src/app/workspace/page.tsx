"use client";

import { useAccordionState } from "@/components/features/workspace/useAccordionState";
import { useSnapConfig } from "@/components/features/workspace/useSnapConfig";
import { useViewerSettings } from "@/components/features/workspace/useViewerSettings";
import { useWorkspaceEditor } from "@/components/features/workspace/useWorkspaceEditor";
import { AccordionSection } from "@/components/molecules/AccordionSection";
import { WorkspaceHistoryControls } from "@/components/molecules/WorkspaceHistoryControls";
import { WorkspaceExportControls } from "@/components/organisms/WorkspaceExportControls";
import { WorkspaceHistoryImportList } from "@/components/organisms/WorkspaceHistoryImportList";
import { WorkspaceImportPanel } from "@/components/organisms/WorkspaceImportPanel";
import { WorkspaceLightingPanel } from "@/components/organisms/WorkspaceLightingPanel";
import { WorkspaceMaterialPanel } from "@/components/organisms/WorkspaceMaterialPanel";
import { WorkspaceObjectList } from "@/components/organisms/WorkspaceObjectList";
import { WorkspaceShapePanel } from "@/components/organisms/WorkspaceShapePanel";
import { WorkspaceSnappingPanel } from "@/components/organisms/WorkspaceSnappingPanel";
import { WorkspaceTransformInputs } from "@/components/organisms/WorkspaceTransformInputs";
import { WorkspaceViewer } from "@/components/organisms/WorkspaceViewer";
import { WorkspaceViewerSettingsPanel } from "@/components/organisms/WorkspaceViewerSettingsPanel";
import { WorkspaceTemplate } from "@/components/templates/WorkspaceTemplate";

/**
 * Page-level composition for `/workspace` (FR-1). Calls `useWorkspaceEditor()`
 * once here so its state (objects, lights, selection, import errors,
 * undo/redo) is a single source of truth shared across the import panels,
 * viewer, object list, lighting panel, snapping panel, transform inputs, and
 * export controls, mirroring `src/app/page.tsx`'s page-owns-hooks pattern.
 * `useSnapConfig`, `useViewerSettings`, and `useAccordionState` are separate,
 * deliberately non-history tool/UI settings (`04-lld.md` T-5/T-6/T-7). The
 * sidebar's Objects/Lights/Shapes/Materials/Snapping/Export sections (FR-3)
 * are each wrapped in an `AccordionSection`, owned by `useAccordionState`
 * (A-3). Distinct from the existing `/` generation/history flow — no shared
 * state between the two beyond the navigation itself.
 */
export default function WorkspacePage() {
  const {
    objects,
    selectedId,
    importErrors,
    importFiles,
    importFromHistory,
    select,
    updateTransform,
    remove,
    duplicate,
    clear,
    dismissImportError,
    addPrimitive,
    updateMaterial,
    setVisible,
    setWireframe,
    resetTransform,
    rename,
    lights,
    addLight,
    updateLight,
    removeLight,
    selectedLightId,
    selectLight,
    duplicateLight,
    resetLight,
    renameLight,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useWorkspaceEditor();

  const {
    snapConfig,
    setTranslateEnabled,
    setRotateEnabled,
    setScaleEnabled,
    setTranslateStep,
    setRotateStep,
    setScaleStep,
  } = useSnapConfig();

  const viewerSettings = useViewerSettings();
  const { expanded, toggle } = useAccordionState();

  const selectedObject = objects.find((object) => object.id === selectedId) ?? null;

  return (
    <WorkspaceTemplate
      import={
        <>
          <WorkspaceImportPanel
            importErrors={importErrors}
            onFilesSelected={(files) => void importFiles(files)}
            onDismissError={dismissImportError}
          />
          <WorkspaceHistoryImportList onImport={importFromHistory} />
        </>
      }
      viewer={
        <WorkspaceViewer
          objects={objects}
          selectedId={selectedId}
          onSelect={select}
          onTransformChange={updateTransform}
          lights={lights}
          snapConfig={snapConfig}
          selectedLightId={selectedLightId}
          onSelectLight={selectLight}
          onLightTransformChange={(id, patch) => updateLight(id, patch)}
          viewerSettings={viewerSettings}
          historyControls={<WorkspaceHistoryControls canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />}
        />
      }
      objectPanel={
        <>
          <AccordionSection title="Objects" expanded={expanded.objects} onToggle={() => toggle("objects")}>
            <WorkspaceObjectList
              objects={objects}
              selectedId={selectedId}
              onSelect={select}
              onRemove={remove}
              onDuplicate={duplicate}
              onClear={clear}
              onSetVisible={setVisible}
              onSetWireframe={setWireframe}
              onResetTransform={resetTransform}
              onRename={rename}
            />
            <WorkspaceTransformInputs selectedObject={selectedObject} onCommitTransform={updateTransform} />
          </AccordionSection>
          <AccordionSection title="Lights" expanded={expanded.lights} onToggle={() => toggle("lights")}>
            <WorkspaceLightingPanel
              lights={lights}
              selectedLightId={selectedLightId}
              onAddLight={addLight}
              onUpdateLight={updateLight}
              onRemoveLight={removeLight}
              onSelectLight={selectLight}
              onDuplicateLight={duplicateLight}
              onResetLight={resetLight}
              onRenameLight={renameLight}
            />
          </AccordionSection>
          <AccordionSection title="Shapes" expanded={expanded.shapes} onToggle={() => toggle("shapes")}>
            <WorkspaceShapePanel onAddPrimitive={addPrimitive} />
          </AccordionSection>
          <AccordionSection title="Materials" expanded={expanded.materials} onToggle={() => toggle("materials")}>
            <WorkspaceMaterialPanel selectedObject={selectedObject} onUpdateMaterial={updateMaterial} />
          </AccordionSection>
          <AccordionSection title="Snapping" expanded={expanded.snapping} onToggle={() => toggle("snapping")}>
            <WorkspaceSnappingPanel
              snapConfig={snapConfig}
              onSetTranslateEnabled={setTranslateEnabled}
              onSetRotateEnabled={setRotateEnabled}
              onSetScaleEnabled={setScaleEnabled}
              onSetTranslateStep={setTranslateStep}
              onSetRotateStep={setRotateStep}
              onSetScaleStep={setScaleStep}
            />
            <WorkspaceViewerSettingsPanel
              viewerSettings={viewerSettings}
              onSetSceneWireframe={viewerSettings.setSceneWireframe}
              onSetBackground={viewerSettings.setBackground}
              onSetGridVisible={viewerSettings.setGridVisible}
              onSetGridCellSize={viewerSettings.setGridCellSize}
              onSetGridSectionSize={viewerSettings.setGridSectionSize}
            />
          </AccordionSection>
          <AccordionSection title="Export" expanded={expanded.export} onToggle={() => toggle("export")}>
            <WorkspaceExportControls objects={objects} selectedObject={selectedObject} />
          </AccordionSection>
        </>
      }
    />
  );
}
