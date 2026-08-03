import { buildBusinessHealthRankingConfiguration } from "@empireai/pillow";
import type {
  BusinessHealthRunReport,
  BusinessHealthRankingState,
} from "@empireai/pillow";

function buildOfflineBusinessHealthRankingState(): BusinessHealthRankingState {
  const configuration = buildBusinessHealthRankingConfiguration();
  return {
    engineVersion: "PILLOW-BHR-001",
    missionId: "X2-09",
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
      totalHealthRecords: 0,
      decliningCount: 0,
      highPerformingCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      healthCalculations: 0,
      rankingRuns: 0,
      prioritiesGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Business Health Ranking snapshot when Pillow session is unavailable. */
export function collectBusinessHealthRankingSnapshot() {
  const engine = buildOfflineBusinessHealthRankingState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalHealthRecords: 0,
      decliningCount: 0,
      highPerformingCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as BusinessHealthRunReport | null,
    healthRecords: [],
  };
}
