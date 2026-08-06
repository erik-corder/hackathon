/**
 * Frontend-only view model for the Workspace tab (FR-7–FR-13). Distinct from
 * `generationJob.ts`'s types — a `WorkspaceObject` may originate from an
 * externally uploaded file, from an existing generation job's GLB, or from a
 * user-added primitive shape (FR-4/A-4), per `04-lld.md` §2.
 */
export type PrimitiveShapeType = "cube" | "sphere" | "cylinder" | "plane" | "cone" | "torus";

export type WorkspaceObjectSource =
  | { kind: "upload"; fileName: string }
  | { kind: "history"; jobId: string; fileName: string }
  | { kind: "primitive"; shape: PrimitiveShapeType };

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface Transform {
  position: Vec3Tuple;
  /** Euler angles in radians, matching three.js Object3D.rotation convention. */
  rotation: Vec3Tuple;
  scale: Vec3Tuple;
}

export interface WorkspaceObjectMaterial {
  /** CSS hex color, same convention as `LightSource.color` (FR-5/AC-9). */
  color: string;
  /** `data:` URL produced by `FileReader.readAsDataURL` (A-7/FR-5/AC-10). */
  textureDataUrl?: string;
}

export interface WorkspaceObject {
  /** Internally generated unique id (A-8) — never the file name. */
  id: string;
  /** Inline-editable display label (FR-13/AC-19) — cosmetic only (A-18). */
  name?: string;
  source: WorkspaceObjectSource;
  /** Object URL (upload), existing job GLB URL (history), or "" for a
   * primitive source — never dereferenced for primitives (branch-before-use). */
  url: string;
  transform: Transform;
  /** FR-7/AC-13 — hidden objects stay in state/list, only removed from the
   * rendered scene. Defaults to `true` for every newly created object. */
  visible: boolean;
  /** FR-8/AC-14 — presentational only (A-8), does not affect export. Defaults
   * to `false` for every newly created object. */
  wireframe: boolean;
  /** FR-5/AC-9–AC-11 — absent means "use the original GLTF material / default
   * primitive material". */
  material?: WorkspaceObjectMaterial;
}

export interface ImportErrorView {
  id: string;
  fileName: string;
  reason: string;
}

export const IDENTITY_TRANSFORM: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};
