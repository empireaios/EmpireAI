/** T4-04 — Component redesign proposal generator. */

import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { type ProposalDraft, variantLabel } from "./proposal-generator-shared.js";

export class ComponentProposalGenerator {
  generate(requirements: InterpretedProposalRequirements, variantIndex: number): ProposalDraft {
    const label = variantLabel(variantIndex);
    const target =
      requirements.targetComponentIds[0] ?? "primary interactive components";
    return {
      category: "component_redesign",
      title: `${label} component refresh for ${target}`,
      summary: `${label} option to refine component structure and interaction affordances`,
      proposedUxChange: `Redesign ${target} with improved labels, states, and touch targets`,
      expectedUxBenefit: "Higher usability and clearer affordances for key actions",
      scope: variantIndex === 2 ? "medium" : "small",
      riskNotes: null,
      confidence: 0.7 + variantIndex * 0.06,
      variantIndex,
    };
  }
}
