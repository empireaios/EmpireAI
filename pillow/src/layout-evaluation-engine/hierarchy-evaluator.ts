/** T2-04 — Layout hierarchy evaluation. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type { LayoutFinding } from "./types.js";

export class HierarchyEvaluator {
  private readonly metadata = new EvaluationMetadataGenerator();

  evaluate(layout: LayoutModel | null): LayoutFinding[] {
    if (!layout) return [];

    const findings: LayoutFinding[] = [];
    const depth = this.maxDepth(layout.regionHierarchy);
    const stacking = layout.stackingOrder;

    if (depth >= 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("visual_hierarchy"),
        category: "visual_hierarchy",
        kind: "strength",
        description: `Visual hierarchy depth of ${depth} levels`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.75,
      });
    } else if (layout.regions.length > 1) {
      findings.push({
        findingId: this.metadata.buildFindingId("visual_hierarchy"),
        category: "visual_hierarchy",
        kind: "weakness",
        description: "Shallow visual hierarchy — limited nesting depth",
        severity: "warning",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.6,
      });
    }

    const overlays = stacking.filter((s) => s.layer === "overlay" || s.layer === "modal");
    if (overlays.length > 0) {
      findings.push({
        findingId: this.metadata.buildFindingId("modal_layout"),
        category: "modal_layout",
        kind: "strength",
        description: `${overlays.length} overlay/modal layer(s) in stacking order`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.7,
      });
    }

    return findings;
  }

  private maxDepth(hierarchy: { regionId: string; children: string[] }[]): number {
    if (hierarchy.length === 0) return 0;
    return 1 + Math.max(0, ...hierarchy.map((n) => n.children.length > 0 ? 1 : 0));
  }
}
