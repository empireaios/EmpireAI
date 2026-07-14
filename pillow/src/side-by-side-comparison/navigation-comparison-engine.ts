/** T4-05 — Navigation comparison engine. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import { proposalsForCategory, type CategoryComparisonResult } from "./comparison-engine-shared.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class NavigationComparisonEngine {
  private readonly metadata = new ComparisonMetadataGenerator();

  compare(proposals: RedesignProposalRecord[]): CategoryComparisonResult {
    appendComparisonLog({ event: "layout_comparison", level: "info", details: "Comparing navigation options" });
    const items = proposalsForCategory(proposals, ["navigation_redesign"]);
    const markers =
      items.length > 1
        ? [
            {
              markerId: this.metadata.buildMarkerId(),
              region: "navigation",
              differenceType: "nav_structure",
              description: "Navigation grouping and wayfinding differ between options",
              severity: "medium" as const,
            },
          ]
        : [];
    return {
      differenceSummary: `Compared ${items.length} navigation option(s)`,
      markers,
      confidence: items.length > 0 ? 0.72 : 0.45,
    };
  }
}
