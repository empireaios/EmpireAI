import { buildMarketValidationEngineConfiguration } from "@empireai/pillow";
import type {
  MarketValidationEngineState,
  MarketValidationRunReport,
} from "@empireai/pillow";

function buildOfflineMarketValidationEngineState(): MarketValidationEngineState {
  const configuration = buildMarketValidationEngineConfiguration();
  return {
    engineVersion: "PILLOW-MVE-001",
    missionId: "X1-03",
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
      totalValidationRecords: 0,
      averageValidationConfidence: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      validationsRun: 0,
      demandAnalyses: 0,
      customerValidations: 0,
      competitiveValidations: 0,
      scoringRuns: 0,
      recommendationRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Market Validation Engine snapshot when Pillow session is unavailable. */
export function collectMarketValidationEngineSnapshot() {
  const engine = buildOfflineMarketValidationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalValidationRecords: 0,
      averageValidationConfidence: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as MarketValidationRunReport | null,
    validationRecords: [],
  };
}
