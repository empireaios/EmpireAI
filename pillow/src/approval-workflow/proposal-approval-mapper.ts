/** T4-07 — Maps T4-04 proposals to approval context. */

import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { RedesignProposalRecord } from "../multi-proposal-generator/types.js";
import type { ApprovalPresentationInput } from "./types.js";
import { appendApprovalLog } from "./approval-logging.js";

export class ProposalApprovalMapper {
  load(input: {
    presentationInput: ApprovalPresentationInput;
    multiProposalGenerator: MultiProposalGeneratorEngine | null;
  }): {
    proposals: RedesignProposalRecord[];
    targetScreenId: string | null;
    targetRouteOrViewId: string | null;
  } {
    appendApprovalLog({
      event: "approval_workflow_start",
      level: "info",
      details: "Loading proposals for approval",
    });

    let proposals: RedesignProposalRecord[] = [];
    if (input.multiProposalGenerator) {
      try {
        const report = input.multiProposalGenerator.getLatestReport?.() ?? null;
        proposals = report?.proposals ?? [];
      } catch {
        appendApprovalLog({
          event: "partial_approval_input",
          level: "warn",
          details: "Multi-proposal generator data unavailable",
        });
      }
    }

    if (input.presentationInput.proposalIds?.length) {
      const ids = new Set(input.presentationInput.proposalIds);
      proposals = proposals.filter((p) => ids.has(p.proposalId));
    }

    if (proposals.length === 0) {
      throw new Error("No proposal records available for approval");
    }

    return {
      proposals: proposals.slice(0, 8),
      targetScreenId: proposals[0]?.targetScreenId ?? null,
      targetRouteOrViewId: proposals[0]?.targetRouteOrViewId ?? null,
    };
  }
}
