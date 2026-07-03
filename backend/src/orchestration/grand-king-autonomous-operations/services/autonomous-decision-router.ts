/**
 * G7-07 — Autonomous decision router.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { AutonomousDomainId } from "../../../registry/types/autonomous-operations-registry-types.js";
import { listOptimizationRecommendations } from "../../grand-king-continuous-intelligence-optimization/services/grand-king-continuous-intelligence-optimization-service.js";
import { listCommerceOperations } from "../../grand-king-commerce-operations/services/grand-king-commerce-operations-service.js";
import { listAutomationOperations } from "../../grand-king-business-automation-operations/services/grand-king-business-automation-operations-service.js";
import type { AutonomousRecommendation } from "../contracts/autonomous-operations-types.js";
import { mapDomainToTargetModule } from "../registry/autonomous-operations-registry-resolver.js";
import { evaluateAutonomyPolicy } from "./autonomy-policy-evaluator.js";
import { randomUUID } from "node:crypto";

export function routeAutonomousDecisions(context: RegistryLoaderContext = {}): AutonomousRecommendation[] {
  const recommendations: AutonomousRecommendation[] = [];

  for (const domainId of [
    "commerce",
    "automation",
    "workflow_scheduling",
    "optimization",
    "financial_reconciliation",
    "health_monitoring",
  ] as AutonomousDomainId[]) {
    const policy = evaluateAutonomyPolicy(domainId, context);
    if (!policy.eligible) continue;

    const action = resolveRecommendedAction(domainId, context);
    recommendations.push({
      recommendationId: randomUUID(),
      domainId,
      summary: `Autonomous action routed to ${mapDomainToTargetModule(domainId)}`,
      recommendedAction: action,
      autonomyLevel: policy.autonomyLevel,
      ruleReference: policy.riskThresholdRef,
    });
  }

  return recommendations;
}

function resolveRecommendedAction(domainId: AutonomousDomainId, context: RegistryLoaderContext): string {
  try {
    if (domainId === "commerce") {
      const ops = listCommerceOperations();
      const running = ops.filter((o) => o.status === "running").length;
      return running > 0 ? "Continue commerce channel synchronisation" : "Initiate commerce readiness sync";
    }
    if (domainId === "automation" || domainId === "workflow_scheduling") {
      const ops = listAutomationOperations();
      return `Process ${ops.length} automation workflow signals`;
    }
    if (domainId === "optimization") {
      const recs = listOptimizationRecommendations();
      return recs[0]?.recommendedAction ?? "Apply next optimization recommendation";
    }
  } catch {
    return `Execute ${domainId} autonomous operation`;
  }
  return `Execute ${domainId} autonomous operation`;
}

export function resolveTargetModule(domainId: AutonomousDomainId): string {
  return mapDomainToTargetModule(domainId);
}
