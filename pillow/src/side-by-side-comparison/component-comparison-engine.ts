/** T4-05 — Component comparison engine. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { compareProposalTexts, proposalsForCategory, type CategoryComparisonResult } from "./comparison-engine-shared.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class ComponentComparisonEngine {
  private readonly metadata = new ComparisonMetadataGenerator();

  compare(proposals: RedesignProposalRecord[]): CategoryComparisonResult {
    appendComparisonLog({ event: "layout_comparison", level: "info", details: "Comparing component options" });
    const items = proposalsForCategory(proposals, [
      "component_redesign",
      "form_improvement",
      "table_improvement",
      "card_improvement",
      "modal_improvement",
      "drawer_improvement",
    ]);
    const markers = [];
    const base = items[0];
    if (base) {
      for (let i = 1; i < items.length; i++) {
        const next = items[i];
        if (!next) continue;
        markers.push(
          ...compareProposalTexts(base.proposedUxChange, next.proposedUxChange, "component", this.metadata),
        );
      }
    }
    return {
      differenceSummary: `Compared ${items.length} component option(s) — structure, states, and affordance differences`,
      markers,
      confidence: items.length > 1 ? 0.76 : 0.52,
    };
  }
}
