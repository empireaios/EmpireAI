import { buildSupplierRankingEngineConfiguration } from "@empireai/pillow";
import type {
  SupplierRankingReport,
  SupplierRankingEngineState,
} from "@empireai/pillow";

function buildOfflineSupplierRankingEngineState(): SupplierRankingEngineState {
  const configuration = buildSupplierRankingEngineConfiguration();
  return {
    engineVersion: "PILLOW-SRE-001",
    missionId: "R2-08",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    rankings: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      rankingCount: 0,
      lastRankingAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      rankingFailures: 0,
      highPerformersDetected: 0,
      decliningPerformersDetected: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      rankingRuns: 0,
      suppliersRanked: 0,
      highPerformersDetected: 0,
      decliningPerformersDetected: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Supplier Ranking Engine snapshot when Pillow session is unavailable. */
export function collectSupplierRankingEngineSnapshot() {
  const engine = buildOfflineSupplierRankingEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      rankingCount: 0,
      lastRankingAt: null,
      lastDecision: null,
      highPerformersDetected: 0,
      decliningPerformersDetected: 0,
      topSupplierId: null,
      recentLogs: [],
    },
    latestReport: null as SupplierRankingReport | null,
    rankings: [],
  };
}
