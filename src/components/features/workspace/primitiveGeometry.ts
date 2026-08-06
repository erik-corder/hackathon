import { BoxGeometry, BufferGeometry, ConeGeometry, CylinderGeometry, PlaneGeometry, SphereGeometry, TorusGeometry } from "three";

import type { PrimitiveShapeType } from "@/components/shared/types/workspaceObject";

/**
 * Shared pure geometry factory for FR-4's six primitive shapes, used by both
 * `WorkspaceViewer` (T-10) and `useWorkspaceExport` (T-12) so the viewer and
 * the exported `.glb` always agree on the same geometry (closes the R-2 risk
 * of divergent duplicated logic). Non-zero, non-degenerate default extents
 * for every shape (AC-6/AC-17's edge case).
 */
export function createPrimitiveGeometry(shape: PrimitiveShapeType): BufferGeometry {
  switch (shape) {
    case "cube":
      return new BoxGeometry(1, 1, 1);
    case "sphere":
      return new SphereGeometry(0.6, 32, 16);
    case "cylinder":
      return new CylinderGeometry(0.5, 0.5, 1, 32);
    case "plane":
      return new PlaneGeometry(1, 1);
    case "cone":
      return new ConeGeometry(0.5, 1, 32);
    case "torus":
      return new TorusGeometry(0.5, 0.2, 16, 32);
    default: {
      const exhaustiveCheck: never = shape;
      throw new Error(`Unknown primitive shape: ${String(exhaustiveCheck)}`);
    }
  }
}
