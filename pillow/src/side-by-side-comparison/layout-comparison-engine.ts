/** T4-05 — Layout comparison engine. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { compareProposalTexts, proposalsForCategory, type CategoryComparisonResult } from "./comparison-engine-shared.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class LayoutComparisonEngine {
  private readonly metadata = new ComparisonMetadataGenerator();

  compare(proposals: RedesignProposalRecord[], baseline?: RedesignProposalRecord | null): CategoryComparisonResult {
    appendComparisonLog({ event: "layout_comparison", level: "info", details: "Comparing layout options" });
    const layout = proposalsForCategory(proposals, ["layout_redesign", "dashboard_improvement"]);
    const markers = [];
    const base = baseline ?? layout[0];
    for (const p of layout.slice(1)) {
      markers.push(...compareProposalTexts(base?.proposedUxChange ?? "", p.proposedUxChange, "layout", this.metadata));
    }
    return {
      differenceSummary: `Compared ${layout.length} layout option(s) — spacing, grid, and region hierarchy differences highlighted`,
      markers,
      confidence: layout.length > 1 ? 0.78 : 0.55,
    };
  }
}
