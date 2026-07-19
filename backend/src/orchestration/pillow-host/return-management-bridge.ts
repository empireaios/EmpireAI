import { buildReturnManagementConfiguration } from "@empireai/pillow";
import type { ReturnManagementState, ReturnReport } from "@empireai/pillow";

function buildOfflineReturnManagementState(): ReturnManagementState {
  const configuration = buildReturnManagementConfiguration();
  return {
    engineVersion: "PILLOW-RM-001",
    missionId: "R2-13",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      returnCount: 0,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      returnFailures: 0,
      authorizedCount: 0,
      completedCount: 0,
      failedCount: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      returnRequestsCreated: 0,
      returnsAuthorized: 0,
      labelsGenerated: 0,
      returnsCompleted: 0,
      returnFailures: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Return Management snapshot when Pillow session is unavailable. */
export function collectReturnManagementSnapshot() {
  const engine = buildOfflineReturnManagementState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      returnCount: 0,
      lastOperationAt: null,
      lastDecision: null,
      authorizedCount: 0,
      completedCount: 0,
      failedCount: 0,
      recentLogs: [],
    },
    latestReport: null as ReturnReport | null,
    records: [],
  };
}
