/** T2-04 — Layout structure evaluation. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type { LayoutFinding } from "./types.js";

export class StructureEvaluator {
  private readonly metadata = new EvaluationMetadataGenerator();

  evaluate(layout: LayoutModel | null): LayoutFinding[] {
    if (!layout) {
      return [
        {
          findingId: this.metadata.buildFindingId("layout_hierarchy"),
          category: "layout_hierarchy",
          kind: "weakness",
          description: "No layout model available for structure evaluation",
          severity: "error",
          evidenceRef: "missing_layout",
          confidence: 1,
        },
      ];
    }

    const findings: LayoutFinding[] = [];
    const regionCount = layout.regions.length;

    if (regionCount >= 2) {
      findings.push({
        findingId: this.metadata.buildFindingId("layout_hierarchy"),
        category: "layout_hierarchy",
        kind: "strength",
        description: `Layout defines ${regionCount} structural regions`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: layout.metadata.confidenceScore,
      });
    } else {
      findings.push({
        findingId: this.metadata.buildFindingId("layout_hierarchy"),
        category: "layout_hierarchy",
        kind: "weakness",
        description: `Only ${regionCount} region(s) detected — limited structural hierarchy`,
        severity: "warning",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.7,
      });
    }

    if (layout.regionHierarchy.length > 0) {
      findings.push({
        findingId: this.metadata.buildFindingId("section_organization"),
        category: "section_organization",
        kind: "strength",
        description: `Region hierarchy contains ${layout.regionHierarchy.length} nodes`,
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.8,
      });
    }

    const hasHeader = layout.regions.some((r) => r.regionType === "header");
    const hasMain = layout.regions.some((r) => r.regionType === "main_content");
    if (hasHeader && hasMain) {
      findings.push({
        findingId: this.metadata.buildFindingId("screen_clarity"),
        category: "screen_clarity",
        kind: "strength",
        description: "Header and main content regions identified",
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.85,
      });
    }

    return findings;
  }
}
