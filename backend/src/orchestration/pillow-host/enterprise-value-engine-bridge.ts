import { buildEnterpriseValueEngineConfiguration } from "@empireai/pillow";
import type {
  EnterpriseValueEngineState,
  EnterpriseValuationRunReport,
} from "@empireai/pillow";

function buildOfflineEnterpriseValueEngineState(): EnterpriseValueEngineState {
  const configuration = buildEnterpriseValueEngineConfiguration();
  return {
    engineVersion: "PILLOW-EVE-001",
    missionId: "X2-19",
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
      totalValuationRecords: 0,
      highConfidenceValuations: 0,
      averageConfidenceScore: 0,
      anomalyCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      enterpriseValueOps: 0,
      companyValuationOps: 0,
      portfolioValuationOps: 0,
      intrinsicEstimateOps: 0,
      marketEstimateOps: 0,
      valueGrowthOps: 0,
      historyTrackingOps: 0,
      anomalyDetectionOps: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Enterprise Value Engine snapshot when Pillow session is unavailable. */
export function collectEnterpriseValueEngineSnapshot() {
  const engine = buildOfflineEnterpriseValueEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-19",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalValuationRecords: 0,
      highConfidenceValuations: 0,
      averageConfidenceScore: 0,
      anomalyCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as EnterpriseValuationRunReport | null,
    valuationRecords: [],
  };
}
