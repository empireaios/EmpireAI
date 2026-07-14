/** T4-05 — Theme comparison engine. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import { proposalsForCategory, type CategoryComparisonResult } from "./comparison-engine-shared.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class ThemeComparisonEngine {
  private readonly metadata = new ComparisonMetadataGenerator();

  compare(proposals: RedesignProposalRecord[]): CategoryComparisonResult {
    appendComparisonLog({ event: "layout_comparison", level: "info", details: "Comparing theme options" });
    const items = proposalsForCategory(proposals, ["theme_redesign"]);
    const markers =
      items.length > 1
        ? [
            {
              markerId: this.metadata.buildMarkerId(),
              region: "theme",
              differenceType: "color_typography",
              description: "Color palette and typography scale differ between theme options",
              severity: "low" as const,
            },
          ]
        : [];
    return {
      differenceSummary: `Compared ${items.length} theme option(s)`,
      markers,
      confidence: items.length > 1 ? 0.74 : 0.48,
    };
  }
}
