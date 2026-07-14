import { buildLayoutEvaluationConfiguration } from "@empireai/pillow";
import type { LayoutEvaluationReport, LayoutEvaluationState } from "@empireai/pillow";

function buildOfflineEvaluationState(): LayoutEvaluationState {
  const configuration = buildLayoutEvaluationConfiguration();
  return {
    engineVersion: "PILLOW-LEV-001",
    missionId: "T2-04",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestModel: null,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      evaluationEnabled: configuration.enabled,
      evaluationsCompleted: 0,
      lastEvaluationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalEvaluations: 0,
      successfulEvaluations: 0,
      failedEvaluations: 0,
      totalStrengthsIdentified: 0,
      totalWeaknessesIdentified: 0,
      totalRuleViolations: 0,
      averageEvaluationDurationMs: 0,
      peakEvaluationDurationMs: 0,
    },
  };
}

/** Fallback Layout Evaluation snapshot when Pillow session is unavailable. */
export function collectLayoutEvaluationSnapshot() {
  const engine = buildOfflineEvaluationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T2-04",
    live: false,
    engine,
    cockpit: {
      evaluationStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      overallStatus: null,
      strengthsCount: 0,
      weaknessesCount: 0,
      ruleViolationsCount: 0,
      confidenceScore: 0,
      totalEvaluations: 0,
      recentLogs: [],
    },
    latestReport: null as LayoutEvaluationReport | null,
  };
}
