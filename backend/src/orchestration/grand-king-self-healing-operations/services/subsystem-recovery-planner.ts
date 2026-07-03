/**
 * G7-08 — Subsystem recovery planner.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { HealingActionRecord } from "../contracts/self-healing-types.js";
import type { HealingRecommendation } from "../contracts/self-healing-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { REG_AUTOMATION_RECOVERY } from "../../../registry/types/registry-ids.js";
import {
  mapDomainToSubsystem,
  resolveSelfHealingDependencies,
} from "../registry/self-healing-registry-resolver.js";
import { evaluateDependencyHealth } from "./dependency-health-evaluator.js";

export function planSubsystemRecovery(
  recommendation: HealingRecommendation,
  context: RegistryLoaderContext = {},
): HealingActionRecord {
  const deps = resolveSelfHealingDependencies(context);
  const dependency = evaluateDependencyHealth(recommendation.domainId, context);
  const now = new Date().toISOString();
  const requiresApproval = recommendation.confidenceScore < 60 || recommendation.healingAction === "rollback";

  return {
    healingId: randomUUID(),
    workspaceId: GRAND_KING_WORKSPACE_ID,
    targetSubsystem: mapDomainToSubsystem(recommendation.domainId),
    domainId: recommendation.domainId,
    failureReference: `failure:${recommendation.domainId}:${recommendation.ruleReference}`,
    recoveryReference: deps.recoveryRows[0] ?? REG_AUTOMATION_RECOVERY,
    healingAction: recommendation.healingAction,
    confidenceScore: recommendation.confidenceScore,
    approvalRequirement: requiresApproval ? deps.approvalChainRef : "none",
    executionStatus: requiresApproval ? "approval_pending" : "recommended",
    result: dependency.healthy ? "planned" : "blocked_pending_dependencies",
    rollbackReference: `rollback:pending:${recommendation.recommendationId}`,
    evidence: [{
      evidenceId: `ev-${recommendation.recommendationId}`,
      kind: "reference",
      summary: recommendation.summary,
      ref: recommendation.ruleReference,
    }],
    createdAt: now,
    updatedAt: now,
    correlationId: randomUUID(),
    governanceState: requiresApproval ? "pillow-approval-pending" : "pillow-recommended",
  };
}
