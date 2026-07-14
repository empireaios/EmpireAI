/** T4-04 — Visual consistency improvement proposal generator. */

import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { type ProposalDraft, variantLabel } from "./proposal-generator-shared.js";

export class ConsistencyProposalGenerator {
  generate(requirements: InterpretedProposalRequirements, variantIndex: number): ProposalDraft {
    const label = variantLabel(variantIndex);
    return {
      category: "visual_consistency_improvement",
      title: `${label} visual consistency pass`,
      summary: `${label} option to align spacing, typography, and component styling`,
      proposedUxChange:
        variantIndex === 0
          ? "Normalize padding and border-radius across cards and panels"
          : variantIndex === 1
            ? "Unify heading hierarchy and icon sizing"
            : "Apply design-system tokens to inconsistent legacy surfaces",
      expectedUxBenefit: "Cohesive interface feel and reduced cognitive load",
      scope: variantIndex === 2 ? "medium" : "small",
      riskNotes: null,
      confidence: 0.71 + variantIndex * 0.05,
      variantIndex,
    };
  }
}
