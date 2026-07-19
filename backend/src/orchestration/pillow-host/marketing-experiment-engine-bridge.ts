import { buildMarketingExperimentEngineConfiguration } from "@empireai/pillow";
import type {
  MarketingExperimentEngineState,
  MarketingExperimentRunReport,
} from "@empireai/pillow";

function buildOfflineMarketingExperimentEngineState(): MarketingExperimentEngineState {
  const configuration = buildMarketingExperimentEngineConfiguration();
  return {
    engineVersion: "PILLOW-MEE-001",
    missionId: "R5-17",
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
      totalExperimentRecords: 0,
      runningExperiments: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      experimentsCreated: 0,
      significanceChecks: 0,
      winnersRecommended: 0,
      archivesRun: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Marketing Experiment Engine snapshot when Pillow session is unavailable. */
export function collectMarketingExperimentEngineSnapshot() {
  const engine = buildOfflineMarketingExperimentEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-17",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalExperimentRecords: 0,
      runningExperiments: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as MarketingExperimentRunReport | null,
    experimentRecords: [],
  };
}
