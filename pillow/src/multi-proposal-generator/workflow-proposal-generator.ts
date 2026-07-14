/** T4-04 — Workflow redesign proposal generator. */

import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { type ProposalDraft, variantLabel } from "./proposal-generator-shared.js";

export class WorkflowProposalGenerator {
  generate(requirements: InterpretedProposalRequirements, variantIndex: number): ProposalDraft {
    const label = variantLabel(variantIndex);
    return {
      category: "workflow_redesign",
      title: `${label} workflow streamlining`,
      summary: `${label} option to reduce steps and friction in key workflows`,
      proposedUxChange:
        variantIndex === 0
          ? "Merge redundant confirmation steps"
          : variantIndex === 1
            ? "Reorder workflow steps to surface critical inputs earlier"
            : "Introduce progressive disclosure for advanced workflow options",
      expectedUxBenefit: "Faster task completion and fewer abandonment points",
      scope: variantIndex === 2 ? "large" : "medium",
      riskNotes: "Workflow changes require regression validation",
      confidence: 0.65 + variantIndex * 0.08,
      variantIndex,
    };
  }
}
