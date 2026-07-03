/**
 * G7-08 — Recovery confidence scorer.
 */

import type { HealingActionRecord, HealingRecommendation, RecoveryConfidenceSummary } from "../contracts/self-healing-types.js";
import { deriveHealingSignalFromRef } from "../registry/self-healing-registry-resolver.js";

export function scoreRecoveryConfidence(input: {
  ruleReference: string;
  healingAction: HealingRecommendation["healingAction"];
  healthSeverity: number;
}): number {
  const base = deriveHealingSignalFromRef(input.ruleReference) * 100;
  const actionBoost =
    input.healingAction === "rollback" ? -10 :
    input.healingAction === "retry" ? 5 :
    input.healingAction === "restart" ? 8 : 0;
  const severityPenalty = input.healthSeverity * 5;
  return Math.round(Math.min(100, Math.max(0, base + actionBoost - severityPenalty)) * 10) / 10;
}

export function computeRecoveryConfidenceSummary(records: HealingActionRecord[]): RecoveryConfidenceSummary {
  if (records.length === 0) {
    return { averageConfidence: 0, highConfidenceCount: 0, lowConfidenceCount: 0, computedAt: new Date().toISOString() };
  }
  const scores = records.map((r) => r.confidenceScore);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return {
    averageConfidence: Math.round(average * 10) / 10,
    highConfidenceCount: scores.filter((s) => s >= 70).length,
    lowConfidenceCount: scores.filter((s) => s < 50).length,
    computedAt: new Date().toISOString(),
  };
}
