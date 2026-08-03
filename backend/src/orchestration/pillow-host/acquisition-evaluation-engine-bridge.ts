import { buildAcquisitionEvaluationEngineConfiguration } from "@empireai/pillow";
import type {
  AcquisitionEvaluationEngineState,
  AcquisitionEvaluationRunReport,
} from "@empireai/pillow";

function buildOfflineAcquisitionEvaluationEngineState(): AcquisitionEvaluationEngineState {
  const configuration = buildAcquisitionEvaluationEngineConfiguration();
  return {
    engineVersion: "PILLOW-AEE-001",
    missionId: "X2-15",
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
      totalAcquisitionRecords: 0,
      pursueRecommendations: 0,
      averageStrategicFit: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      candidatesDiscovered: 0,
      opportunitiesEvaluated: 0,
      strategicEvaluations: 0,
      financialEvaluations: 0,
      operationalEvaluations: 0,
      riskEvaluations: 0,
      valueEstimations: 0,
      rankingsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Acquisition Evaluation Engine snapshot when Pillow session is unavailable. */
export function collectAcquisitionEvaluationEngineSnapshot() {
  const engine = buildOfflineAcquisitionEvaluationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-15",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalAcquisitionRecords: 0,
      pursueRecommendations: 0,
      averageStrategicFit: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as AcquisitionEvaluationRunReport | null,
    acquisitionRecords: [],
  };
}
