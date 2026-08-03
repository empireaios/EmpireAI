import { buildScalingDecisionEngineConfiguration } from "@empireai/pillow";
import type {
  ScalingDecisionEngineState,
  SdeRunReport,
} from "@empireai/pillow";

function buildOfflineScalingDecisionEngineState(): ScalingDecisionEngineState {
  const configuration = buildScalingDecisionEngineConfiguration();
  return {
    engineVersion: "PILLOW-SDE-001",
    missionId: "X3-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalDecisionRecords: 0,
      scaleCount: 0,
      holdCount: 0,
      rejectCount: 0,
      averageConfidence: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      candidateEvaluations: 0,
      readinessAssessments: 0,
      riskAssessments: 0,
      decisionsProduced: 0,
      rankingsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Scaling Decision Engine snapshot when Pillow session is unavailable. */
export function collectScalingDecisionEngineSnapshot() {
  const engine = buildOfflineScalingDecisionEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalDecisionRecords: 0,
      scaleCount: 0,
      holdCount: 0,
      rejectCount: 0,
      averageConfidence: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as SdeRunReport | null,
    decisionRecords: [],
    recommendations: [],
  };
}
