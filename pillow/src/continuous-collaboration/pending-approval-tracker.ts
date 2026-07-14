/** T4-09 — Tracks pending approval decisions. */

import type { ContinuousCollaborationEngineBundle } from "./types.js";
import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import { appendCollaborationLog } from "./collaboration-logging.js";

const PENDING_STATUSES = new Set([
  "pending",
  "presented",
  "deferred",
  "changes_requested",
  "reopened",
]);

export class PendingApprovalTracker {
  track(input: {
    engines: ContinuousCollaborationEngineBundle;
    config: ContinuousCollaborationConfiguration;
  }): string[] {
    if (!input.config.pendingApprovalRetentionRulesEnabled) return [];

    const pending: string[] = [];

    try {
      const state = input.engines.approvalWorkflow?.getState?.() ?? null;
      const presentation = state?.latestPresentation ?? null;
      const report = input.engines.approvalWorkflow?.getLatestReport?.() ?? null;
      const approval = report?.approval ?? null;

      if (presentation?.requiresApproval) {
        if (!approval || PENDING_STATUSES.has(approval.approvalStatus)) {
          if (approval?.approvalId) {
            pending.push(approval.approvalId);
          } else {
            pending.push(presentation.presentationId);
          }
        }
      } else if (approval && PENDING_STATUSES.has(approval.approvalStatus)) {
        pending.push(approval.approvalId);
      }
    } catch {
      appendCollaborationLog({
        event: "partial_collaboration_input",
        level: "warn",
        details: "Approval tracking unavailable",
      });
    }

    const limited = pending.slice(0, input.config.maxPendingApprovals);
    if (limited.length > 0) {
      appendCollaborationLog({
        event: "approval_tracking",
        level: "info",
        details: `Tracking ${limited.length} pending approval(s)`,
      });
    }
    return limited;
  }

  getApprovedDirection(engines: ContinuousCollaborationEngineBundle): string | null {
    try {
      const report = engines.approvalWorkflow?.getLatestReport?.() ?? null;
      if (report?.approval?.approvalDecision === "approve") {
        return report.approval.approvedActionScope ?? report.approval.approvalRationale;
      }
    } catch {
      /* ignore */
    }
    return null;
  }
}
