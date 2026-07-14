/** T4-05 — Visual consistency comparison engine. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import { proposalsForCategory, type CategoryComparisonResult } from "./comparison-engine-shared.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class ConsistencyComparisonEngine {
  private readonly metadata = new ComparisonMetadataGenerator();

  compare(proposals: RedesignProposalRecord[]): CategoryComparisonResult {
    appendComparisonLog({
      event: "layout_comparison",
      level: "info",
      details: "Comparing visual consistency improvement options",
    });
    const items = proposalsForCategory(proposals, ["visual_consistency_improvement"]);
    const markers =
      items.length > 0
        ? [
            {
              markerId: this.metadata.buildMarkerId(),
              region: "consistency",
              differenceType: "visual_alignment",
              description: "Spacing rhythm and component styling alignment differ across options",
              severity: "low" as const,
            },
          ]
        : [];
    return {
      differenceSummary: `Compared ${items.length} visual consistency option(s)`,
      markers,
      confidence: items.length > 0 ? 0.71 : 0.41,
    };
  }
}
