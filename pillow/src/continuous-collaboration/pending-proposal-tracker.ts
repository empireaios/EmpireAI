/** T4-09 — Tracks pending UX proposals awaiting review. */

import type { ContinuousCollaborationEngineBundle } from "./types.js";
import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import { appendCollaborationLog } from "./collaboration-logging.js";

const PENDING_APPROVAL_STATUSES = new Set([
  "pending",
  "presented",
  "deferred",
  "changes_requested",
  "reopened",
]);

export class PendingProposalTracker {
  track(input: {
    engines: ContinuousCollaborationEngineBundle;
    config: ContinuousCollaborationConfiguration;
    approvedProposalIds: string[];
  }): string[] {
    if (!input.config.pendingProposalRetentionRulesEnabled) return [];

    const pending: string[] = [];

    try {
      const report = input.engines.multiProposalGenerator?.getLatestReport?.() ?? null;
      const proposals = report?.proposals ?? [];
      for (const proposal of proposals) {
        if (!input.approvedProposalIds.includes(proposal.proposalId)) {
          pending.push(proposal.proposalId);
        }
      }
    } catch {
      appendCollaborationLog({
        event: "partial_collaboration_input",
        level: "warn",
        details: "Proposal tracking unavailable",
      });
    }

    const limited = pending.slice(0, input.config.maxPendingProposals);
    if (limited.length > 0) {
      appendCollaborationLog({
        event: "proposal_tracking",
        level: "info",
        details: `Tracking ${limited.length} pending proposal(s)`,
      });
    }
    return limited;
  }

  getApprovedProposalIds(engines: ContinuousCollaborationEngineBundle): string[] {
    try {
      const approval = engines.approvalWorkflow?.getLatestReport?.() ?? null;
      if (
        approval?.approval &&
        !PENDING_APPROVAL_STATUSES.has(approval.approval.approvalStatus)
      ) {
        return approval.approval.sourceProposalIds;
      }
    } catch {
      /* ignore */
    }
    return [];
  }
}
