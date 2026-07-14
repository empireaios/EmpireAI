/** T2-04 — Layout alignment evaluation. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type { LayoutFinding } from "./types.js";

export class AlignmentEvaluator {
  private readonly metadata = new EvaluationMetadataGenerator();

  evaluate(layout: LayoutModel | null): LayoutFinding[] {
    if (!layout) return [];

    const findings: LayoutFinding[] = [];
    const alignments = layout.alignmentRelationships;

    if (alignments.length >= 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("alignment"),
        category: "alignment",
        kind: "strength",
        description: `${alignments.length} alignment relationships detected`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.75,
      });
    } else if (alignments.length === 0 && layout.regions.length > 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("alignment"),
        category: "alignment",
        kind: "weakness",
        description: "Multiple regions without detected alignment relationships",
        severity: "warning",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.65,
      });
    }

    const looseAlignments = alignments.filter((a) => a.tolerance > 8);
    if (looseAlignments.length > 0) {
      findings.push({
        findingId: this.metadata.buildFindingId("alignment"),
        category: "alignment",
        kind: "weakness",
        description: `${looseAlignments.length} alignment group(s) exceed tolerance threshold`,
        severity: "warning",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.6,
      });
    }

    return findings;
  }
}
