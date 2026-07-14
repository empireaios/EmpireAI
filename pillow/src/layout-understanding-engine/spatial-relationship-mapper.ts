/** T1-04 — Spatial relationship mapping between components and regions. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { SpatialRelationship, StructuralRegion } from "./types.js";

function center(c: { x: number; y: number; width: number; height: number }) {
  return { cx: c.x + c.width / 2, cy: c.y + c.height / 2 };
}

export class SpatialRelationshipMapper {
  mapComponents(components: UiComponent[]): SpatialRelationship[] {
    const relationships: SpatialRelationship[] = [];

    for (let i = 0; i < components.length; i += 1) {
      for (let j = i + 1; j < components.length; j += 1) {
        const a = components[i]!;
        const b = components[j]!;
        const ac = center(a.bounds);
        const bc = center(b.bounds);

        const dx = bc.cx - ac.cx;
        const dy = bc.cy - ac.cy;
        const distance = Math.round(Math.sqrt(dx * dx + dy * dy));

        if (Math.abs(dy) > Math.abs(dx)) {
          relationships.push({
            fromId: a.componentId,
            toId: b.componentId,
            relation: dy > 0 ? "below" : "above",
            distance,
          });
        } else {
          relationships.push({
            fromId: a.componentId,
            toId: b.componentId,
            relation: dx > 0 ? "right_of" : "left_of",
            distance,
          });
        }

        if (
          a.bounds.x <= b.bounds.x &&
          a.bounds.y <= b.bounds.y &&
          a.bounds.x + a.bounds.width >= b.bounds.x + b.bounds.width &&
          a.bounds.y + a.bounds.height >= b.bounds.y + b.bounds.height
        ) {
          relationships.push({
            fromId: a.componentId,
            toId: b.componentId,
            relation: "contains",
            distance: 0,
          });
        }
      }
    }

    return relationships.slice(0, 200);
  }

  mapRegions(regions: StructuralRegion[]): SpatialRelationship[] {
    const relationships: SpatialRelationship[] = [];
    for (let i = 0; i < regions.length; i += 1) {
      for (let j = i + 1; j < regions.length; j += 1) {
        const a = regions[i]!;
        const b = regions[j]!;
        const ac = center(a.bounds);
        const bc = center(b.bounds);
        const dy = bc.cy - ac.cy;
        relationships.push({
          fromId: a.regionId,
          toId: b.regionId,
          relation: dy > 0 ? "below" : "above",
          distance: Math.round(Math.abs(dy)),
        });
      }
    }
    return relationships;
  }
}
