import { buildMultiWarehouseSupportConfiguration } from "@empireai/pillow";
import type { MultiWarehouseSupportState, WarehouseNetworkReport } from "@empireai/pillow";

function buildOfflineMultiWarehouseSupportState(): MultiWarehouseSupportState {
  const configuration = buildMultiWarehouseSupportConfiguration();
  return {
    engineVersion: "PILLOW-MWS-001",
    missionId: "R2-15",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      warehouseCount: 0,
      lastNetworkSyncAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      networkFailures: 0,
      imbalancedCount: 0,
      capacityIssueCount: 0,
      transfersCompleted: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      registrationRuns: 0,
      warehousesRegistered: 0,
      selectionsPerformed: 0,
      transfersInitiated: 0,
      transfersCompleted: 0,
      fulfilmentRoutes: 0,
      imbalancedDetected: 0,
      capacityIssuesDetected: 0,
      networkFailures: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Multi-Warehouse Support snapshot when Pillow session is unavailable. */
export function collectMultiWarehouseSupportSnapshot() {
  const engine = buildOfflineMultiWarehouseSupportState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-15",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      warehouseCount: 0,
      lastNetworkSyncAt: null,
      lastDecision: null,
      imbalancedCount: 0,
      capacityIssueCount: 0,
      transfersCompleted: 0,
      recentLogs: [],
    },
    latestReport: null as WarehouseNetworkReport | null,
    records: [],
  };
}
