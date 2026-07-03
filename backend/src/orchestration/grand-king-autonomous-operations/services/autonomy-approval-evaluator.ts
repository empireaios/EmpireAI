/**
 * G7-07 — Autonomy approval evaluator.
 */

import type { AutonomyLevel } from "../../../registry/types/autonomous-operations-registry-types.js";
import type { AutonomousOperation } from "../contracts/autonomous-operations-types.js";
import { resolveAutonomousOperationDependencies } from "../registry/autonomous-operations-registry-resolver.js";

export type ApprovalEvaluation = {
  requiresApproval: boolean;
  approvalPolicy: string;
  reason: string;
};

export function evaluateAutonomyApproval(operation: Pick<AutonomousOperation, "autonomyLevel" | "riskScore">): ApprovalEvaluation {
  const deps = resolveAutonomousOperationDependencies();
  const approvalPolicy = deps.approvalChainRef ?? "REG-READINESS-POLICY";

  if (operation.autonomyLevel === "manual_only" || operation.autonomyLevel === "recommendation_only") {
    return { requiresApproval: true, approvalPolicy, reason: "Autonomy level requires manual approval" };
  }
  if (operation.autonomyLevel === "approval_required") {
    return { requiresApproval: true, approvalPolicy, reason: "Policy mandates approval before execution" };
  }
  if (operation.autonomyLevel === "emergency_stop") {
    return { requiresApproval: true, approvalPolicy, reason: "Emergency stop active — all operations require approval" };
  }
  if (operation.riskScore >= 70) {
    return { requiresApproval: true, approvalPolicy, reason: "Risk score exceeds registry-derived threshold" };
  }
  if (operation.autonomyLevel === "semi_autonomous" && operation.riskScore >= 50) {
    return { requiresApproval: true, approvalPolicy, reason: "Semi-autonomous high-risk operation requires approval" };
  }

  return { requiresApproval: false, approvalPolicy, reason: "Autonomy policy permits autonomous execution" };
}

export function resolveInitialExecutionStatus(
  autonomyLevel: AutonomyLevel,
  requiresApproval: boolean,
): AutonomousOperation["executionStatus"] {
  if (autonomyLevel === "emergency_stop") return "blocked";
  if (requiresApproval) return "approval_pending";
  if (autonomyLevel === "fully_autonomous" || autonomyLevel === "semi_autonomous") return "scheduled";
  return "waiting";
}
