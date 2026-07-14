/** T2-04 — Visual balance evaluation. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import { EvaluationMetadataGenerator } from "./evaluation-metadata-generator.js";
import type { LayoutFinding } from "./types.js";

export class VisualBalanceEvaluator {
  private readonly metadata = new EvaluationMetadataGenerator();

  evaluate(layout: LayoutModel | null): LayoutFinding[] {
    if (!layout || layout.regions.length === 0) return [];

    const findings: LayoutFinding[] = [];
    const areas = layout.regions.map((r) => r.bounds.width * r.bounds.height);
    const total = areas.reduce((a, b) => a + b, 0);
    const avg = total / areas.length;
    const variance =
      areas.reduce((sum, a) => sum + (a - avg) ** 2, 0) / Math.max(areas.length, 1);
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;

    if (cv < 1.2) {
      findings.push({
        findingId: this.metadata.buildFindingId("visual_balance"),
        category: "visual_balance",
        kind: "strength",
        description: "Region sizes are proportionally balanced",
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.7,
      });
    } else {
      findings.push({
        findingId: this.metadata.buildFindingId("visual_balance"),
        category: "visual_balance",
        kind: "weakness",
        description: "Uneven region size distribution may affect visual balance",
        severity: "warning",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.65,
      });
    }

    const viewport = layout.metadata.viewport;
    const usedWidth = Math.max(...layout.regions.map((r) => r.bounds.x + r.bounds.width));
    const widthUtilization = viewport.width > 0 ? usedWidth / viewport.width : 0;
    if (widthUtilization > 0.85) {
      findings.push({
        findingId: this.metadata.buildFindingId("screen_clarity"),
        category: "screen_clarity",
        kind: "weakness",
        description: "High horizontal space utilization may reduce clarity",
        severity: "info",
        evidenceRef: layout.metadata.layoutId,
        confidence: 0.55,
      });
    }

    return findings;
  }
}
