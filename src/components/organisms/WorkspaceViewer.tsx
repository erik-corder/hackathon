"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Environment, Grid, OrbitControls, TransformControls, useGLTF } from "@react-three/drei";
import { Box3, TextureLoader, Vector3 } from "three";
import type { DirectionalLight, Group, Object3D, PointLight, SpotLight } from "three";

import { createPrimitiveGeometry } from "@/components/features/workspace/primitiveGeometry";
import type { ViewerSettings } from "@/components/features/workspace/useViewerSettings";
import type { LightSource } from "@/components/shared/types/lightSource";
import type { SnapConfig } from "@/components/shared/types/snapConfig";
import type { Transform, Vec3Tuple, WorkspaceObject } from "@/components/shared/types/workspaceObject";

export interface WorkspaceViewerProps {
  objects: WorkspaceObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onTransformChange: (id: string, transform: Transform) => void;
  lights: LightSource[];
  snapConfig: SnapConfig;
  historyControls?: ReactNode;
  /** FR-1/AC-1/AC-2 — currently gizmo-selected light. */
  selectedLightId?: string | null;
  onSelectLight?: (id: string | null) => void;
  /** FR-1/AC-2 — dragging a light's gizmo commits position (and, for
   * spot/directional lights, target moved by the same delta, per OQ-2). */
  onLightTransformChange?: (id: string, patch: { position: Vec3Tuple; target?: Vec3Tuple }) => void;
  /** FR-8/FR-9/FR-12 viewer display preferences, owned by `useViewerSettings`. */
  viewerSettings?: ViewerSettings;
}

type GizmoMode = "translate" | "rotate" | "scale";

const DEFAULT_VIEWER_SETTINGS: ViewerSettings = {
  sceneWireframe: false,
  background: "clear-dark",
  gridVisible: true,
  gridCellSize: 1,
  gridSectionSize: 10,
};

const BACKGROUND_COLORS: Record<"clear-dark" | "clear-light", string> = {
  "clear-dark": "#09090b",
  "clear-light": "#f4f4f5",
};

interface SceneLightProps {
  light: LightSource;
  isSelected: boolean;
  onSelect?: () => void;
  registerRef: (id: string, group: Group | null) => void;
}

/** Renders one configured light (FR-1–FR-6): point/spot/directional, with
 * imperative `target` wiring for spot/directional per `04-lld.md` §10. A
 * wrapping `<group>` mirrors `light.position` so a light + its target share
 * one transformable node (T-9), matching `WorkspaceObjectMesh`'s
 * group-wrapping pattern. Not a separately exported component, matching
 * `WorkspaceObjectMesh`'s local precedent. */
function SceneLight({ light, isSelected, onSelect, registerRef }: SceneLightProps) {
  const lightRef = useRef<PointLight | SpotLight | DirectionalLight>(null);
  const targetRef = useRef<Object3D>(null);

  useEffect(() => {
    if (light.type === "point") return;
    const l = lightRef.current as SpotLight | DirectionalLight | null;
    if (l && targetRef.current) {
      l.target = targetRef.current;
      l.target.updateMatrixWorld?.();
    }
  }, [light.type, light.target.x, light.target.y, light.target.z]);

  const handleRef = useCallback(
    (node: Group | null) => registerRef(light.id, node),
    [light.id, registerRef],
  );

  const handleClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    onSelect?.();
  };

  return (
    <group ref={handleRef} position={[light.position.x, light.position.y, light.position.z]} onClick={handleClick}>
      {light.type === "point" ? (
        <pointLight
          ref={lightRef as never}
          color={light.color}
          intensity={light.intensity}
          castShadow={light.castShadow}
        />
      ) : light.type === "spot" ? (
        <>
          <spotLight
            ref={lightRef as never}
            color={light.color}
            intensity={light.intensity}
            castShadow={light.castShadow}
          />
          <object3D
            ref={targetRef}
            position={[light.target.x - light.position.x, light.target.y - light.position.y, light.target.z - light.position.z]}
          />
        </>
      ) : (
        <>
          <directionalLight
            ref={lightRef as never}
            color={light.color}
            intensity={light.intensity}
            castShadow={light.castShadow}
          />
          <object3D
            ref={targetRef}
            position={[light.target.x - light.position.x, light.target.y - light.position.y, light.target.z - light.position.z]}
          />
        </>
      )}
      {isSelected ? <mesh scale={0.15}><sphereGeometry args={[1, 8, 8]} /><meshBasicMaterial color="#facc15" wireframe /></mesh> : null}
    </group>
  );
}

interface WorkspaceObjectMeshProps {
  object: WorkspaceObject;
  sceneWireframe: boolean;
  onSelect: () => void;
  registerRef: (id: string, group: Group | null) => void;
}

interface ObjectGroupProps {
  object: WorkspaceObject;
  onSelect: () => void;
  registerRef: (id: string, group: Group | null) => void;
  children: ReactNode;
}

/** Shared wrapping `<group>` transform/ref/onClick logic (T-10), reused by
 * both the primitive and GLTF mesh branches so gizmo binding, selection, and
 * undo/redo behave identically regardless of `source.kind`. */
function ObjectGroup({ object, onSelect, registerRef, children }: ObjectGroupProps) {
  // Stable per-object ref callback (identity only changes if `object.id` or
  // `registerRef` change) — an inline arrow here would be a new function
  // every render, causing React to detach/reattach the ref (and thus
  // re-register) on every commit, which loops forever (`registerRef` calls
  // `setState`).
  const handleRef = useCallback((node: Group | null) => registerRef(object.id, node), [object.id, registerRef]);

  return (
    <group
      ref={handleRef}
      visible={object.visible}
      position={[object.transform.position.x, object.transform.position.y, object.transform.position.z]}
      rotation={[object.transform.rotation.x, object.transform.rotation.y, object.transform.rotation.z]}
      scale={[object.transform.scale.x, object.transform.scale.y, object.transform.scale.z]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {children}
    </group>
  );
}

interface MaterialOverrideProps {
  color?: string;
  textureDataUrl?: string;
  wireframe: boolean;
}

function useOverrideTexture(textureDataUrl?: string) {
  return useMemo(() => (textureDataUrl ? new TextureLoader().load(textureDataUrl) : null), [textureDataUrl]);
}

/** Renders one primitive shape (FR-4/FR-5): geometry from the shared
 * `createPrimitiveGeometry` factory (also used by `useWorkspaceExport`, T-12)
 * plus its base color/texture/wireframe (T-10). */
function WorkspacePrimitiveMesh({ object }: { object: WorkspaceObject; sceneWireframe: boolean }) {
  const geometry = useMemo(
    () => createPrimitiveGeometry(object.source.kind === "primitive" ? object.source.shape : "cube"),
    [object.source],
  );
  const texture = useOverrideTexture(object.material?.textureDataUrl);
  const materialProps: MaterialOverrideProps = {
    color: object.material?.color ?? "#cccccc",
    wireframe: object.wireframe,
    textureDataUrl: object.material?.textureDataUrl,
  };
  return (
    <mesh castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial color={materialProps.color} wireframe={materialProps.wireframe} map={texture ?? undefined} />
    </mesh>
  );
}

/** Renders one imported GLTF model, its transform driven from state
 * (`04-lld.md` §6) rather than the mesh's own local mutation, so
 * `remove`/`clear` stay in sync (unchanged from the pre-run behavior, NFR-7).
 * Base color/texture overrides (FR-5) are applied via an imperative
 * `useEffect` traversal guarded so it is a no-op against a bare test mock
 * (`typeof scene.traverse === "function"`), never mutating the cached scene
 * graph when no override is present. */
interface OverridableMaterial {
  color?: { set: (value: string) => void };
  map?: unknown;
  wireframe?: boolean;
}

function WorkspaceGltfMesh({ object, sceneWireframe }: { object: WorkspaceObject; sceneWireframe: boolean }) {
  const { scene } = useGLTF(object.url) as { scene: Object3D };
  const texture = useOverrideTexture(object.material?.textureDataUrl);
  const wireframe = object.wireframe || sceneWireframe;

  useEffect(() => {
    const traverse = (scene as unknown as { traverse?: (cb: (node: Object3D) => void) => void }).traverse;
    if (typeof traverse !== "function") return; // guards jsdom test mocks
    traverse.call(scene, (node: Object3D) => {
      const material = (node as unknown as { material?: OverridableMaterial }).material;
      if (!material) return;
      if (object.material?.color) material.color?.set(object.material.color);
      if (texture) material.map = texture;
      material.wireframe = wireframe;
    });
  }, [scene, object.material?.color, texture, wireframe]);

  return <primitive object={scene} castShadow receiveShadow />;
}

/** Renders one workspace object: either an imported GLTF model or (FR-4) one
 * of the six primitive shapes, sharing `ObjectGroup`'s wrapping `<group>`
 * transform/ref/onClick logic (T-10) so gizmo binding, selection, and
 * undo/redo are unaffected by the branch. Split into two child components so
 * `useGLTF` is only ever called for a real GLTF source, never for a
 * primitive's empty `url` (Rules of Hooks — each branch is a distinct mounted
 * component, not a conditional hook call within one component instance). Not
 * a separately exported component, matching `GlbViewer.tsx`'s local `Model`
 * precedent. */
function WorkspaceObjectMesh({ object, sceneWireframe, onSelect, registerRef }: WorkspaceObjectMeshProps) {
  const isPrimitive = object.source.kind === "primitive";
  return (
    <ObjectGroup object={object} onSelect={onSelect} registerRef={registerRef}>
      {isPrimitive ? (
        <WorkspacePrimitiveMesh object={object} sceneWireframe={sceneWireframe} />
      ) : (
        <WorkspaceGltfMesh object={object} sceneWireframe={sceneWireframe} />
      )}
    </ObjectGroup>
  );
}

/**
 * Shared multi-object 3D scene (FR-7, FR-8, FR-9): R3F Canvas + lighting +
 * reference grid + OrbitControls, one group per workspace object/light, and a
 * `TransformControls` gizmo bound to the selected object or light. Owner hook
 * is `useWorkspaceObjects`/`useLightingRig`/`useWorkspaceEditor` (`select`,
 * `selectLight`, `updateTransform`, `onLightTransformChange`), invoked by the
 * caller and passed down as props/callbacks per the hook-owns-logic
 * convention. Viewer settings (FR-8 scene-wide, FR-9, FR-12) are owned by
 * `useViewerSettings` and received here as props only.
 */
export function WorkspaceViewer({
  objects,
  selectedId,
  onSelect,
  onTransformChange,
  lights,
  snapConfig,
  historyControls,
  selectedLightId = null,
  onSelectLight,
  onLightTransformChange,
  viewerSettings = DEFAULT_VIEWER_SETTINGS,
}: WorkspaceViewerProps) {
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>("translate");
  const [isDraggingGizmo, setIsDraggingGizmo] = useState(false);
  // Groups are registered via a ref callback (runs after commit, not during
  // render) and stored in state so reading the selected group during render
  // is a plain state read rather than a ref access (react-hooks/refs). One
  // shared map for both objects and lights — they never collide because
  // `selectedId`/`selectedLightId` are mutually exclusive (T-5), so at most
  // one `TransformControls` binds at a time (R-1's required single path).
  const [groups, setGroups] = useState<Record<string, Group>>({});
  const orbitRef = useRef<ComponentRef<typeof OrbitControls>>(null);

  const registerRef = useCallback((id: string, group: Group | null): void => {
    setGroups((prev) => {
      if (group) {
        if (prev[id] === group) return prev;
        return { ...prev, [id]: group };
      }
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const isLightSelected = Boolean(selectedLightId);
  const activeSelectedId = isLightSelected ? selectedLightId : selectedId;
  const selectedGroup = activeSelectedId ? groups[activeSelectedId] ?? null : null;
  // FR-1: translate mode only while a light is selected — no rotate/scale
  // option is offered (out-of-scope item, AC-1).
  const effectiveGizmoMode: GizmoMode = isLightSelected ? "translate" : gizmoMode;

  function handleGizmoChange(): void {
    if (!selectedGroup) return;
    if (isLightSelected && selectedLightId) {
      const light = lights.find((candidate) => candidate.id === selectedLightId);
      if (!light) return;
      const nextPosition: Vec3Tuple = {
        x: selectedGroup.position.x,
        y: selectedGroup.position.y,
        z: selectedGroup.position.z,
      };
      const delta: Vec3Tuple = {
        x: nextPosition.x - light.position.x,
        y: nextPosition.y - light.position.y,
        z: nextPosition.z - light.position.z,
      };
      const nextTarget: Vec3Tuple = {
        x: light.target.x + delta.x,
        y: light.target.y + delta.y,
        z: light.target.z + delta.z,
      };
      onLightTransformChange?.(selectedLightId, { position: nextPosition, target: nextTarget });
      return;
    }
    if (!selectedId) return;
    onTransformChange(selectedId, {
      position: { x: selectedGroup.position.x, y: selectedGroup.position.y, z: selectedGroup.position.z },
      rotation: { x: selectedGroup.rotation.x, y: selectedGroup.rotation.y, z: selectedGroup.rotation.z },
      scale: { x: selectedGroup.scale.x, y: selectedGroup.scale.y, z: selectedGroup.scale.z },
    });
  }

  // FR-11/AC-17: recenters the orbit target on the selected group's bounding
  // box without moving the camera position, keeping the object in view.
  const focusSelected = useCallback(() => {
    const controls = orbitRef.current as unknown as { target?: Vector3; update?: () => void } | null;
    if (!selectedGroup || !controls?.target) return;
    const box = new Box3().setFromObject(selectedGroup);
    const center = box.getCenter(new Vector3());
    controls.target.copy(center);
    controls.update?.();
  }, [selectedGroup]);

  function handleSelectObject(id: string | null): void {
    onSelect(id);
  }

  function handleSelectLight(id: string | null): void {
    onSelectLight?.(id);
  }

  return (
    <section aria-labelledby="workspace-viewer-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="workspace-viewer-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Workspace scene
        </h2>
        <div className="flex items-center gap-2">
          {historyControls}
          {activeSelectedId ? (
            <button
              type="button"
              onClick={focusSelected}
              className="rounded-full px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Focus selected
            </button>
          ) : null}
          {selectedId && !isLightSelected ? (
            <div role="group" aria-label="Transform gizmo mode" className="flex items-center gap-1">
              {(["translate", "rotate", "scale"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={gizmoMode === mode}
                  onClick={() => setGizmoMode(mode)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    gizmoMode === mode
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div
        data-testid="workspace-canvas-area"
        className="aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Canvas camera={{ position: [4, 4, 4] }} shadows onPointerMissed={() => handleSelectObject(null)}>
          {viewerSettings.background === "clear-dark" || viewerSettings.background === "clear-light" ? (
            <color attach="background" args={[BACKGROUND_COLORS[viewerSettings.background]]} />
          ) : (
            <Environment preset={viewerSettings.background} background />
          )}
          {lights.length === 0 ? (
            // A-1: minimal built-in fallback so objects remain visible when
            // the light list is empty — not itself a user-editable light.
            <ambientLight intensity={0.4} />
          ) : (
            lights.map((light) => (
              <SceneLight
                key={light.id}
                light={light}
                isSelected={light.id === selectedLightId}
                onSelect={() => handleSelectLight(light.id)}
                registerRef={registerRef}
              />
            ))
          )}
          {viewerSettings.gridVisible ? (
            <Grid args={[viewerSettings.gridSectionSize, viewerSettings.gridSectionSize]} cellSize={viewerSettings.gridCellSize} sectionSize={viewerSettings.gridSectionSize} />
          ) : null}
          <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-0.001}>
            <planeGeometry args={[20, 20]} />
            <shadowMaterial opacity={0.25} />
          </mesh>
          {objects.map((object) => (
            <Suspense key={object.id} fallback={null}>
              <WorkspaceObjectMesh
                object={object}
                sceneWireframe={viewerSettings.sceneWireframe}
                onSelect={() => handleSelectObject(object.id)}
                registerRef={registerRef}
              />
            </Suspense>
          ))}
          {selectedGroup ? (
            <TransformControls
              object={selectedGroup}
              mode={effectiveGizmoMode}
              translationSnap={snapConfig.translate.enabled ? snapConfig.translate.step : null}
              rotationSnap={snapConfig.rotate.enabled ? snapConfig.rotate.step : null}
              scaleSnap={snapConfig.scale.enabled ? snapConfig.scale.step : null}
              onObjectChange={handleGizmoChange}
              onMouseDown={() => setIsDraggingGizmo(true)}
              onMouseUp={() => setIsDraggingGizmo(false)}
            />
          ) : null}
          <OrbitControls ref={orbitRef} makeDefault enabled={!isDraggingGizmo} />
        </Canvas>
      </div>
    </section>
  );
}
