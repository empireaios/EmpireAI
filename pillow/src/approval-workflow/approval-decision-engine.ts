/** T4-07 — Processes Grand King approval decisions. */

import type { ApprovalWorkflowConfiguration } from "./configuration.js";
import type { ApprovalDecisionType, ApprovalStatus } from "./types.js";
import { appendApprovalLog } from "./approval-logging.js";

export class ApprovalDecisionEngine {
  resolveStatus(decision: ApprovalDecisionType): ApprovalStatus {
    appendApprovalLog({
      event: "approval_decision_creation",
      level: "info",
      details: `Processing decision: ${decision}`,
    });

    switch (decision) {
      case "approve":
        return "approved";
      case "reject":
        return "rejected";
      case "defer":
        return "deferred";
      case "request_changes":
        return "changes_requested";
      case "cancel":
        return "cancelled";
      case "reopen":
        return "reopened";
      default:
        return "pending";
    }
  }

  validateDecision(
    decision: ApprovalDecisionType,
    config: ApprovalWorkflowConfiguration,
    context: {
      hasComparison: boolean;
      hasExplanation: boolean;
      requestedChanges?: string;
    },
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.supportedApprovalDecisions.includes(decision)) {
      errors.push(`Unsupported approval decision: ${decision}`);
    }

    if (config.requireComparisonBeforeApproval && !context.hasComparison && decision === "approve") {
      errors.push("Comparison required before approval");
    }
    if (
      config.requireExplanationBeforeApproval &&
      !context.hasExplanation &&
      decision === "approve"
    ) {
      errors.push("Explanation required before approval");
    }
    if (decision === "request_changes" && !context.requestedChanges?.trim()) {
      errors.push("Requested changes required for request_changes decision");
    }

    return { valid: errors.length === 0, errors };
  }
}
