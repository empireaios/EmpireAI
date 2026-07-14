/** T4-07 — Blocks unapproved UX changes from proceeding. */

import type { ApprovalWorkflowConfiguration } from "./configuration.js";
import type { ApprovalDecisionType, ApprovalStatus } from "./types.js";
import { appendApprovalLog } from "./approval-logging.js";

export class ApprovalGatekeeper {
  evaluate(input: {
    decision: ApprovalDecisionType;
    status: ApprovalStatus;
    config: ApprovalWorkflowConfiguration;
  }): { allowed: boolean; blocked: boolean; reason: string; approvedScope: string | null; blockedScope: string | null } {
    appendApprovalLog({
      event: "approval_gatekeeping",
      level: "info",
      details: `Gatekeeping decision: ${input.decision}`,
    });

    if (!input.config.blockedActionRulesEnabled) {
      return {
        allowed: input.status === "approved",
        blocked: input.status !== "approved",
        reason: "Gatekeeping rules disabled",
        approvedScope: null,
        blockedScope: null,
      };
    }

    switch (input.status) {
      case "approved":
        appendApprovalLog({
          event: "approval_status_change",
          level: "info",
          details: "Approved — implementation may proceed to certified builder",
        });
        return {
          allowed: true,
          blocked: false,
          reason: "Grand King approved — cleared for certified builder dispatch",
          approvedScope: "certified_builder_systems",
          blockedScope: null,
        };
      case "rejected":
        appendApprovalLog({ event: "blocked_action_events", level: "warn", details: "Rejected — blocked" });
        return {
          allowed: false,
          blocked: true,
          reason: "Grand King rejected — UX changes blocked",
          approvedScope: null,
          blockedScope: "all_implementation_actions",
        };
      case "deferred":
        return {
          allowed: false,
          blocked: true,
          reason: "Decision deferred — UX changes blocked pending review",
          approvedScope: null,
          blockedScope: "implementation_until_reopened",
        };
      case "changes_requested":
        return {
          allowed: false,
          blocked: true,
          reason: "Changes requested — UX changes blocked until revisions",
          approvedScope: null,
          blockedScope: "implementation_until_revised",
        };
      case "cancelled":
        return {
          allowed: false,
          blocked: true,
          reason: "Approval cancelled — no action permitted",
          approvedScope: null,
          blockedScope: "all_implementation_actions",
        };
      case "reopened":
        return {
          allowed: false,
          blocked: true,
          reason: "Reopened for review — awaiting new decision",
          approvedScope: null,
          blockedScope: "implementation_until_approved",
        };
      default:
        return {
          allowed: false,
          blocked: true,
          reason: "Pending approval — unapproved changes blocked",
          approvedScope: null,
          blockedScope: "all_implementation_actions",
        };
    }
  }
}
