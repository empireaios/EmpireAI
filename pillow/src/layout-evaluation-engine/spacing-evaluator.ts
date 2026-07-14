/** T2-04 — Layout spacing evaluation. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type { LayoutFinding } from "./types.js";

export class SpacingEvaluator {
  private readonly metadata = new EvaluationMetadataGenerator();

  evaluate(layout: LayoutModel | null): LayoutFinding[] {
    if (!layout) return [];

    const findings: LayoutFinding[] = [];
    const spatial = layout.spatialRelationships;

    if (spatial.length >= 3) {
      findings.push({
        findingId: this.metadata.buildFindingId("spacing"),
        category: "spacing",
        kind: "strength",
        description: `${spatial.length} spatial relationships define component spacing`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.7,
      });
    }

    const tightSpacing = spatial.filter(
      (s) => s.distance < 4 && (s.relation === "contains" || s.relation === "overlaps"),
    );
    if (tightSpacing.length > 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("spacing"),
        category: "spacing",
        kind: "weakness",
        description: `${tightSpacing.length} adjacent elements with tight spacing (<4px)`,
        severity: "warning",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.65,
      });
    }

    const groups = layout.groupingRelationships;
    if (groups.length > 0) {
      findings.push({
        findingId: this.metadata.buildFindingId("white_space"),
        category: "white_space",
        kind: "strength",
        description: `${groups.length} component group(s) with defined white space boundaries`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.7,
      });
    }

    return findings;
  }
}
