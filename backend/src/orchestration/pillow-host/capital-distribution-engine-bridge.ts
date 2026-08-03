import { buildCapitalDistributionEngineConfiguration } from "@empireai/pillow";
import type {
  CapitalDistributionRunReport,
  CapitalDistributionEngineState,
} from "@empireai/pillow";

function buildOfflineCapitalDistributionEngineState(): CapitalDistributionEngineState {
  const configuration = buildCapitalDistributionEngineConfiguration();
  return {
    engineVersion: "PILLOW-CDE-001",
    missionId: "X2-05",
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
      totalAllocationRecords: 0,
      availablePoolUnits: 0,
      highRiskSignals: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      fundingEvaluations: 0,
      opportunityEvaluations: 0,
      allocationsProposed: 0,
      riskAnalyses: 0,
      rankingsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Capital Distribution Engine snapshot when Pillow session is unavailable. */
export function collectCapitalDistributionEngineSnapshot() {
  const engine = buildOfflineCapitalDistributionEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalAllocationRecords: 0,
      availablePoolUnits: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as CapitalDistributionRunReport | null,
    allocationRecords: [],
    poolRecords: [],
  };
}
