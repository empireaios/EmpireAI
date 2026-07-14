/** T4-06 — Generates rationale for individual proposals. */

import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { ExplainDecisionsConfiguration } from "./configuration.js";
import { appendExplanationLog } from "./explanation-logging.js";

export class ProposalRationaleGenerator {
  generate(input: {
    proposals: RedesignProposalRecord[];
    config: ExplainDecisionsConfiguration;
    targetProposalId?: string | null;
  }): { rationale: string; benefitSummary: string } {
    appendExplanationLog({
      event: "proposal_rationale_generation",
      level: "info",
      details: "Generating proposal rationale",
    });

    const target =
      input.proposals.find((p) => p.proposalId === input.targetProposalId) ??
      input.proposals[0];
    if (!target) {
      return {
        rationale: "No proposal records available to explain",
        benefitSummary: "Benefits cannot be determined without proposal data",
      };
    }

    const detail = input.config.explanationDetailLevel;
    const rationaleParts = [
      `${target.proposalTitle}: ${target.proposalSummary}`,
      `Category ${target.proposalCategory} — ${target.proposedUxChange}`,
    ];
    if (detail !== "summary") {
      rationaleParts.push(
        `Linked to ${target.linkedUxFindingIds.length} UX finding(s) and ${target.linkedBuilderCapabilities.length} builder capability(ies)`,
      );
    }
    if (detail === "detailed" && target.riskNotes) {
      rationaleParts.push(`Risk notes: ${target.riskNotes}`);
    }

    return {
      rationale: rationaleParts.join(". "),
      benefitSummary: target.expectedUxBenefit || "Expected UX benefit not specified in proposal",
    };
  }
}
