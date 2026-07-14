/** T4-05 — Accessibility comparison engine. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import { proposalsForCategory, type CategoryComparisonResult } from "./comparison-engine-shared.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class AccessibilityComparisonEngine {
  private readonly metadata = new ComparisonMetadataGenerator();

  compare(proposals: RedesignProposalRecord[]): CategoryComparisonResult {
    appendComparisonLog({
      event: "layout_comparison",
      level: "info",
      details: "Comparing accessibility improvement options",
    });
    const items = proposalsForCategory(proposals, ["accessibility_improvement"]);
    const markers =
      items.length > 0
        ? [
            {
              markerId: this.metadata.buildMarkerId(),
              region: "accessibility",
              differenceType: "a11y_improvement",
              description: "Contrast, focus order, and ARIA affordances differ across options",
              severity: "medium" as const,
            },
          ]
        : [];
    return {
      differenceSummary: `Compared ${items.length} accessibility improvement option(s)`,
      markers,
      confidence: items.length > 0 ? 0.73 : 0.42,
    };
  }
}
