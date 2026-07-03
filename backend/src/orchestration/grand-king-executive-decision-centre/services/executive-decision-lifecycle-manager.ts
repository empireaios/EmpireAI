/**
 * G7-04 — Executive decision lifecycle manager.
 */

import type { ExecutiveDecision, ExecutiveDecisionStatus } from "../contracts/executive-decision-types.js";
import { isValidExecutiveDecisionTransition } from "../contracts/executive-decision-types.js";

export function transitionExecutiveDecisionStatus(
  decision: ExecutiveDecision,
  targetStatus: ExecutiveDecisionStatus,
  governanceState: string,
  executedAction?: string,
): { ok: true; decision: ExecutiveDecision } | { ok: false; reason: string } {
  if (!isValidExecutiveDecisionTransition(decision.status, targetStatus)) {
    return {
      ok: false,
      reason: `Invalid executive decision transition from ${decision.status} to ${targetStatus}`,
    };
  }

  const now = new Date().toISOString();
  return {
    ok: true,
    decision: {
      ...decision,
      status: targetStatus,
      governanceState,
      executedAction: executedAction ?? decision.executedAction,
      completedAt:
        targetStatus === "completed" || targetStatus === "rejected" || targetStatus === "cancelled"
          ? now
          : decision.completedAt,
    },
  };
}
