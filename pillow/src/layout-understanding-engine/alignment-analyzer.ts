/** T1-04 — Alignment analysis between components. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { AlignmentRelationship } from "./types.js";

export class AlignmentAnalyzer {
  analyze(components: UiComponent[], tolerance: number): AlignmentRelationship[] {
    const results: AlignmentRelationship[] = [];

    const leftGroups = new Map<number, string[]>();
    const topGroups = new Map<number, string[]>();

    for (const c of components) {
      const leftKey = Math.round(c.bounds.x / tolerance) * tolerance;
      const topKey = Math.round(c.bounds.y / tolerance) * tolerance;
      leftGroups.set(leftKey, [...(leftGroups.get(leftKey) ?? []), c.componentId]);
      topGroups.set(topKey, [...(topGroups.get(topKey) ?? []), c.componentId]);
    }

    for (const [, ids] of leftGroups) {
      if (ids.length >= 2) {
        results.push({
          componentIds: ids,
          alignment: "left",
          axis: "vertical",
          tolerance,
        });
      }
    }

    for (const [, ids] of topGroups) {
      if (ids.length >= 2) {
        results.push({
          componentIds: ids,
          alignment: "top",
          axis: "horizontal",
          tolerance,
        });
      }
    }

    return results;
  }
}
