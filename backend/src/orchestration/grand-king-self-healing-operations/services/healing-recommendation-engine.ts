/**
 * G7-08 — Healing recommendation engine.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { HealingRecommendation } from "../contracts/self-healing-types.js";
import {
  deriveHealingSignalFromRef,
  resolveHealingActionFromRecoveryStrategy,
  resolveSelfHealingDependencies,
} from "../registry/self-healing-registry-resolver.js";
import { detectHealthDegradation } from "./health-degradation-detector.js";
import { scoreRecoveryConfidence } from "./recovery-confidence-scorer.js";

export function generateHealingRecommendations(context: RegistryLoaderContext = {}): HealingRecommendation[] {
  const deps = resolveSelfHealingDependencies(context);
  const degradations = detectHealthDegradation(context);
  const recommendations: HealingRecommendation[] = [];

  for (const signal of degradations) {
    const healingAction = resolveHealingActionFromRecoveryStrategy(deps.recoveryStrategies, signal.domainId);
    const confidenceScore = scoreRecoveryConfidence({
      ruleReference: signal.ruleReference,
      healingAction,
      healthSeverity: signal.healthState === "critical" ? 3 : signal.healthState === "degraded" ? 2 : 1,
    });

    recommendations.push({
      recommendationId: randomUUID(),
      domainId: signal.domainId,
      healingAction,
      summary: `Recommend ${healingAction} for ${signal.domainId}: ${signal.summary}`,
      confidenceScore,
      ruleReference: signal.ruleReference,
    });
  }

  if (recommendations.length === 0 && deps.recoveryRows.length > 0) {
    const ref = deps.recoveryRows[0] ?? "recovery:default";
    recommendations.push({
      recommendationId: randomUUID(),
      domainId: "business_automation",
      healingAction: resolveHealingActionFromRecoveryStrategy(deps.recoveryStrategies, "business_automation"),
      summary: "Preventive healing recommendation from REG-AUTOMATION-RECOVERY",
      confidenceScore: scoreRecoveryConfidence({
        ruleReference: ref,
        healingAction: "retry",
        healthSeverity: 1,
      }),
      ruleReference: ref,
    });
  }

  return recommendations;
}

export function deriveHealingSignal(ref: string): number {
  return deriveHealingSignalFromRef(ref);
}
