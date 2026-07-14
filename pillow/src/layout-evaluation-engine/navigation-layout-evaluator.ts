/** T2-04 — Navigation layout evaluation. */

import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type { LayoutFinding } from "./types.js";

export class NavigationLayoutEvaluator {
  private readonly metadata = new EvaluationMetadataGenerator();

  evaluate(layout: LayoutModel | null, navigation: NavigationGraph | null): LayoutFinding[] {
    const findings: LayoutFinding[] = [];

    if (!navigation) {
      if (layout && layout.regions.some((r) => r.regionType === "top_navigation")) {
        findings.push({
          findingId: this.metadata.buildFindingId("navigation_structure"),
          category: "navigation_structure",
          kind: "weakness",
          description: "Navigation region detected but no navigation graph available",
          severity: "warning",
          evidenceRef: layout.metadata.layoutId,
          confidence: 0.6,
        });
      }
      return findings;
    }

    const navNodes = navigation.nodes.filter((n) => n.kind === "nav_item");
    if (navNodes.length >= 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("navigation_structure"),
        category: "navigation_structure",
        kind: "strength",
        description: `${navNodes.length} navigation nodes mapped`,
        severity: "info",
        evidenceRef: navigation.metadata.graphId,
        confidence: navigation.metadata.confidenceScore,
      });
    }

    const navRegion = layout?.regions.find((r) => r.regionType === "top_navigation");
    if (navRegion && navNodes.length === 0) {
      findings.push({
        findingId: this.metadata.buildFindingId("navigation_structure"),
        category: "navigation_structure",
        kind: "weakness",
        description: "Navigation region present without mapped navigation nodes",
        severity: "warning",
        evidenceRef: navRegion.regionId,
        confidence: 0.65,
      });
    }

    const drawers = navigation.nodes.filter((n) => n.kind === "drawer");
    if (drawers.length > 0) {
      findings.push({
        findingId: this.metadata.buildFindingId("drawer_layout"),
        category: "drawer_layout",
        kind: "strength",
        description: `${drawers.length} drawer navigation element(s) identified`,
        severity: "info",
        evidenceRef: navigation.metadata.graphId,
        confidence: 0.7,
      });
    }

    return findings;
  }
}
