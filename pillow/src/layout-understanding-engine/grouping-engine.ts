/** T1-04 — Component grouping by spatial proximity. */

import type { UiComponent } from "../component-recognition-engine/types.js";
import type { GroupingRelationship } from "./types.js";

export class GroupingEngine {
  group(components: UiComponent[], threshold: number): GroupingRelationship[] {
    const groups: GroupingRelationship[] = [];
    const used = new Set<string>();

    const sorted = [...components].sort((a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x);

    for (const seed of sorted) {
      if (used.has(seed.componentId)) continue;
      const cluster = [seed];
      used.add(seed.componentId);

      for (const other of sorted) {
        if (used.has(other.componentId)) continue;
        const sameRow = Math.abs(other.bounds.y - seed.bounds.y) <= threshold;
        const sameCol = Math.abs(other.bounds.x - seed.bounds.x) <= threshold;
        if (sameRow || sameCol) {
          cluster.push(other);
          used.add(other.componentId);
        }
      }

      if (cluster.length < 2) continue;

      const xs = cluster.map((c) => c.bounds.x);
      const ys = cluster.map((c) => c.bounds.y);
      const rights = cluster.map((c) => c.bounds.x + c.bounds.width);
      const bottoms = cluster.map((c) => c.bounds.y + c.bounds.height);
      const x = Math.min(...xs);
      const y = Math.min(...ys);

      const widthSpread = Math.max(...rights) - Math.min(...xs);
      const heightSpread = Math.max(...bottoms) - Math.min(...ys);
      const groupType = widthSpread > heightSpread * 2 ? "row" : heightSpread > widthSpread * 2 ? "column" : "cluster";

      groups.push({
        groupId: `group-${groups.length}`,
        componentIds: cluster.map((c) => c.componentId),
        groupType,
        bounds: { x, y, width: Math.max(...rights) - x, height: Math.max(...bottoms) - y },
      });
    }

    return groups;
  }
}
