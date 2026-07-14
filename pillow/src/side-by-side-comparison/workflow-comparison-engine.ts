/** T4-05 — Workflow comparison engine. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import { proposalsForCategory, type CategoryComparisonResult } from "./comparison-engine-shared.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class WorkflowComparisonEngine {
  private readonly metadata = new ComparisonMetadataGenerator();

  compare(proposals: RedesignProposalRecord[]): CategoryComparisonResult {
    appendComparisonLog({ event: "layout_comparison", level: "info", details: "Comparing workflow options" });
    const items = proposalsForCategory(proposals, ["workflow_redesign"]);
    const markers =
      items.length > 0
        ? [
            {
              markerId: this.metadata.buildMarkerId(),
              region: "workflow",
              differenceType: "step_count",
              description: "Workflow step order and friction points differ across options",
              severity: "medium" as const,
            },
          ]
        : [];
    return {
      differenceSummary: `Compared ${items.length} workflow option(s)`,
      markers,
      confidence: items.length > 0 ? 0.7 : 0.4,
    };
  }
}
