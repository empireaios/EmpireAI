/**
 * G7-06 — Optimization engine (orchestrates detection → recommendation).
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import type { OptimizationOpportunity, OptimizationRecommendation } from "../contracts/continuous-intelligence-types.js";
import {
  deriveSignalFromRuleRef,
  mapDomainToSubsystem,
  resolveOptimizationDependencies,
} from "../registry/continuous-intelligence-registry-resolver.js";
import { detectOptimizationAnomalies } from "./anomaly-detector.js";
import { enrichOpportunityWithOptimiser } from "./domain-optimisers.js";
import { detectOptimizationOpportunities } from "./opportunity-detector.js";
import { appendOptimizationRecommendation } from "./optimization-store.js";

function computePriority(signalStrength: number): OptimizationRecommendation["priority"] {
  if (signalStrength >= 0.85) return "critical";
  if (signalStrength >= 0.7) return "high";
  if (signalStrength >= 0.5) return "medium";
  return "low";
}

export function generateOptimizationRecommendations(
  context: RegistryLoaderContext = {},
): OptimizationRecommendation[] {
  const deps = resolveOptimizationDependencies(context);
  const opportunities = detectOptimizationOpportunities(context);
  const anomalies = detectOptimizationAnomalies(context);
  const recommendations: OptimizationRecommendation[] = [];
  const correlationId = randomUUID();
  const now = new Date().toISOString();

  for (const opportunity of opportunities) {
    const actions = enrichOpportunityWithOptimiser(opportunity, context);
    const signal = opportunity.signalStrength;
    const rec = buildRecommendation({
      opportunity,
      correlationId,
      now,
      deps,
      signal,
      recommendedAction: actions[0] ?? `Optimise ${opportunity.domainId}`,
      priority: computePriority(signal),
    });
    appendOptimizationRecommendation(rec);
    recommendations.push(rec);
  }

  for (const anomaly of anomalies) {
    const signal = deriveSignalFromRuleRef(anomaly.ruleReference) + 0.2;
    const rec = buildRecommendation({
      opportunity: {
        opportunityId: anomaly.anomalyId,
        domainId: anomaly.domainId,
        optimizationType: "risk_reduction",
        summary: anomaly.summary,
        ruleReference: anomaly.ruleReference,
        detectedAt: anomaly.detectedAt,
        signalStrength: signal,
      },
      correlationId,
      now,
      deps,
      signal,
      recommendedAction: `Mitigate anomaly: ${anomaly.summary}`,
      priority: anomaly.severity,
    });
    appendOptimizationRecommendation(rec);
    recommendations.push(rec);
  }

  return recommendations;
}

function buildRecommendation(input: {
  opportunity: OptimizationOpportunity;
  correlationId: string;
  now: string;
  deps: ReturnType<typeof resolveOptimizationDependencies>;
  signal: number;
  recommendedAction: string;
  priority: OptimizationRecommendation["priority"];
}): OptimizationRecommendation {
  const benefit = Math.round(input.signal * 1000) / 10;
  const risk = Math.round((1 - input.signal) * 100) / 10;
  const cost = Math.round(input.signal * 50) / 10;
  const revenueImpact = Math.round(input.signal * 200) / 10;

  return {
    optimizationId: randomUUID(),
    workspaceId: GRAND_KING_WORKSPACE_ID,
    targetSubsystem: mapDomainToSubsystem(input.opportunity.domainId),
    optimizationType: input.opportunity.optimizationType,
    domainId: input.opportunity.domainId,
    priority: input.priority,
    estimatedBenefit: benefit,
    estimatedRisk: risk,
    estimatedCost: cost,
    estimatedRevenueImpact: revenueImpact,
    recommendedAction: input.recommendedAction,
    approvalRequirement: input.deps.approvalChainRef ?? "REG-READINESS-POLICY",
    implementationStatus: "recommended",
    evidence: [{
      evidenceId: `ev-${input.opportunity.opportunityId}`,
      kind: "reference",
      summary: input.opportunity.summary,
      ref: input.opportunity.ruleReference,
    }],
    createdAt: input.now,
    updatedAt: input.now,
    correlationId: input.correlationId,
    governanceState: "pillow-recommended",
  };
}
