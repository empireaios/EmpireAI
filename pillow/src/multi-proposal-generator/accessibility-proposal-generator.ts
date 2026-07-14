/** T4-04 — Accessibility improvement proposal generator. */

import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { type ProposalDraft, variantLabel } from "./proposal-generator-shared.js";

export class AccessibilityProposalGenerator {
  generate(requirements: InterpretedProposalRequirements, variantIndex: number): ProposalDraft {
    const label = variantLabel(variantIndex);
    return {
      category: "accessibility_improvement",
      title: `${label} accessibility enhancement`,
      summary: `${label} option to improve keyboard, contrast, and screen reader support`,
      proposedUxChange:
        variantIndex === 0
          ? "Increase contrast ratios on primary text and controls"
          : variantIndex === 1
            ? "Add visible focus rings and aria labels on interactive elements"
            : "Audit and remediate keyboard traps and landmark structure",
      expectedUxBenefit: "Broader inclusive access and compliance readiness",
      scope: variantIndex === 2 ? "medium" : "small",
      riskNotes: null,
      confidence: 0.76 + variantIndex * 0.05,
      variantIndex,
    };
  }
}
