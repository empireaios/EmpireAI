import { buildRollbackManagerConfiguration } from "@empireai/pillow";
import type { RollbackManagerState, RollbackRunReport } from "@empireai/pillow";

function buildOfflineRollbackState(): RollbackManagerState {
  const configuration = buildRollbackManagerConfiguration();
  return {
    engineVersion: "PILLOW-RM-001",
    missionId: "T3-08",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      rollbackEnabled: configuration.enabled,
      rollbacksCompleted: 0,
      restorePointsActive: 0,
      lastRollbackAt: null,
      lastRollbackDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalRollbacks: 0,
      successfulRollbacks: 0,
      failedRollbacks: 0,
      restorePointsCreated: 0,
      verifiedRollbacks: 0,
      averageRollbackDurationMs: 0,
      peakRollbackDurationMs: 0,
    },
  };
}

/** Fallback Rollback Manager snapshot when Pillow session is unavailable. */
export function collectRollbackManagerSnapshot() {
  const engine = buildOfflineRollbackState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T3-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      rollbacksCount: 0,
      restorePointsCount: 0,
      verifiedCount: 0,
      confidenceScore: 0,
      totalRollbacks: 0,
      recentLogs: [],
    },
    latestReport: null as RollbackRunReport | null,
  };
}
