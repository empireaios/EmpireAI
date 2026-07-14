import type { RecoveryIncident, AutonomousRecoveryAnalysis, AutonomousRecoveryMetrics } from "./types.js";

export function analyzeRecoveryEffectiveness(input: {
  incidents: RecoveryIncident[];
  metrics: AutonomousRecoveryMetrics;
}): AutonomousRecoveryAnalysis {
  const { incidents, metrics } = input;
  const failed = incidents.filter((i) => !i.recovered);
  const recurring = failed
    .map((i) => `${i.failure.signal}: ${i.failure.evidence.join("; ")}`)
    .slice(0, 5);

  return {
    recoverySuccessRate: [
      `Success rate: ${Math.round(metrics.successRate * 100)}%`,
      `${metrics.totalRecoveriesSucceeded}/${metrics.totalIncidents} incidents recovered`,
    ],
    recurringFailures: recurring,
    architectureWeaknesses: incidents
      .filter((i) => i.pipelineResult?.classification === "architecture")
      .map((i) => i.pipelineResult?.rootCause ?? i.failure.signal),
    engineeringWeaknesses: incidents
      .filter((i) => i.pipelineResult?.classification === "engineering")
      .map((i) => i.pipelineResult?.rootCause ?? i.failure.signal),
    repositoryWeaknesses: incidents
      .filter((i) => i.failure.signal === "repository_failure")
      .map((i) => i.failure.evidence.join("; ")),
    recommendations: [
      metrics.successRate < 0.7
        ? "Review recovery strategy selection — success rate below policy"
        : "Recovery effectiveness within constitutional policy",
      recurring.length > 0 ? "Investigate recurring failure patterns" : "No recurring failure patterns",
      "Pillow evaluates recovery success rate and architecture weaknesses continuously",
    ],
  };
}
