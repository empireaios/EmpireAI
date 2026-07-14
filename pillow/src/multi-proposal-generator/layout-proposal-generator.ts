/** T4-04 — Layout redesign proposal generator. */

import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { type ProposalDraft, variantLabel } from "./proposal-generator-shared.js";

export class LayoutProposalGenerator {
  generate(requirements: InterpretedProposalRequirements, variantIndex: number): ProposalDraft {
    const label = variantLabel(variantIndex);
    const spacing = variantIndex === 0 ? "modest" : variantIndex === 1 ? "balanced" : "generous";
    return {
      category: "layout_redesign",
      title: `${label} layout spacing refresh`,
      summary: `${label} option to improve layout spacing and region alignment`,
      proposedUxChange: `Apply ${spacing} spacing adjustments across layout regions and improve visual hierarchy`,
      expectedUxBenefit: "Clearer content grouping and reduced visual clutter",
      scope: variantIndex === 2 ? "medium" : "small",
      riskNotes: variantIndex === 2 ? "May require responsive breakpoint review" : null,
      confidence: 0.72 + variantIndex * 0.05,
      variantIndex,
    };
  }
}
