/** T4-04 — Navigation redesign proposal generator. */

import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { type ProposalDraft, variantLabel } from "./proposal-generator-shared.js";

export class NavigationProposalGenerator {
  generate(requirements: InterpretedProposalRequirements, variantIndex: number): ProposalDraft {
    const label = variantLabel(variantIndex);
    return {
      category: "navigation_redesign",
      title: `${label} navigation clarity improvement`,
      summary: `${label} option to simplify navigation structure and wayfinding`,
      proposedUxChange:
        variantIndex === 0
          ? "Clarify active nav states and breadcrumb labels"
          : variantIndex === 1
            ? "Reorganize primary navigation groupings for faster task access"
            : "Introduce contextual navigation shortcuts for frequent workflows",
      expectedUxBenefit: "Reduced time-to-find and lower navigation confusion",
      scope: variantIndex === 2 ? "large" : "medium",
      riskNotes: variantIndex === 2 ? "Navigation changes affect muscle memory" : null,
      confidence: 0.68 + variantIndex * 0.07,
      variantIndex,
    };
  }
}
