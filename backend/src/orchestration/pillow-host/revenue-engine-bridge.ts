import { buildRevenueEngineConfiguration } from "@empireai/pillow";
import type {
  RevenueEngineRunReport,
  RevenueEngineState,
} from "@empireai/pillow";

function buildOfflineRevenueEngineState(): RevenueEngineState {
  const configuration = buildRevenueEngineConfiguration();
  return {
    engineVersion: "PILLOW-RE-001",
    missionId: "R3-04",
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
      totalRevenueRecords: 0,
      grossRevenue: 0,
      netRevenue: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      revenueEventsRecorded: 0,
      paymentsRecorded: 0,
      marketplaceRevenueRecorded: 0,
      settlementsRecorded: 0,
      refundsRecorded: 0,
      aggregationsRun: 0,
      anomaliesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Revenue Engine snapshot when Pillow session is unavailable. */
export function collectRevenueEngineSnapshot() {
  const engine = buildOfflineRevenueEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalRevenueRecords: 0,
      grossRevenue: 0,
      netRevenue: 0,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as RevenueEngineRunReport | null,
    revenueRecords: [],
  };
}
