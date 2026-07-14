/** T4-04 — Theme redesign proposal generator. */

import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { type ProposalDraft, variantLabel } from "./proposal-generator-shared.js";

export class ThemeProposalGenerator {
  generate(requirements: InterpretedProposalRequirements, variantIndex: number): ProposalDraft {
    const label = variantLabel(variantIndex);
    const pref = requirements.designPreferenceSummary?.slice(0, 80) ?? "brand-aligned palette";
    return {
      category: "theme_redesign",
      title: `${label} theme refinement`,
      summary: `${label} option aligning theme tokens with ${pref}`,
      proposedUxChange:
        variantIndex === 0
          ? "Tune color contrast and typography scale"
          : variantIndex === 1
            ? "Refresh semantic color tokens for surfaces and accents"
            : "Apply cohesive theme system across cards, forms, and navigation",
      expectedUxBenefit: "Improved visual polish and brand consistency",
      scope: variantIndex === 2 ? "medium" : "small",
      riskNotes: null,
      confidence: 0.74 + variantIndex * 0.04,
      variantIndex,
    };
  }
}
