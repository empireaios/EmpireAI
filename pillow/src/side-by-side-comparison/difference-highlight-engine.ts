/** T4-05 — Highlights visible differences across compared options. */

import type { CategoryComparisonResult } from "./comparison-engine-shared.js";
import type { ComparedOption, VisualDifferenceMarker } from "./types.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import type { SideBySideComparisonConfiguration } from "./configuration.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class DifferenceHighlightEngine {
  private readonly metadata = new ComparisonMetadataGenerator();

  highlight(input: {
    options: ComparedOption[];
    categoryResults: CategoryComparisonResult[];
    config: SideBySideComparisonConfiguration;
  }): { markers: VisualDifferenceMarker[]; summary: string } {
    if (!input.config.differenceHighlightRulesEnabled) {
      return { markers: [], summary: "Difference highlighting disabled" };
    }

    appendComparisonLog({
      event: "difference_highlighting",
      level: "info",
      details: `Highlighting differences across ${input.options.length} option(s)`,
    });

    const markers: VisualDifferenceMarker[] = [];
    for (const result of input.categoryResults) {
      markers.push(...result.markers);
    }

    if (input.options.length > 1 && markers.length === 0) {
      markers.push({
        markerId: this.metadata.buildMarkerId(),
        region: "general",
        differenceType: "option_variance",
        description: `${input.options.length} options differ in proposed UX changes`,
        severity: "low",
      });
    }

    const summaries = input.categoryResults.map((r) => r.differenceSummary).filter(Boolean);
    return {
      markers,
      summary: summaries.join("; ") || "Visual differences highlighted across compared options",
    };
  }
}
