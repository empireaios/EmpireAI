import { buildAmazonInventorySyncConfiguration } from "@empireai/pillow";
import type {
  AmazonInventorySyncReport,
  AmazonInventorySyncState,
} from "@empireai/pillow";

function buildOfflineAmazonInventorySyncState(): AmazonInventorySyncState {
  const configuration = buildAmazonInventorySyncConfiguration();
  return {
    engineVersion: "PILLOW-AMZINV-001",
    missionId: "R1-05",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    inventory: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      inventoryCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      discrepancyCount: 0,
      lastSyncAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      syncFailures: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      syncRuns: 0,
      itemsFetched: 0,
      itemsSynced: 0,
      stockChangesDetected: 0,
      lowStockDetected: 0,
      outOfStockDetected: 0,
      discrepanciesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Amazon Inventory Sync snapshot when Pillow session is unavailable. */
export function collectAmazonInventorySyncSnapshot() {
  const engine = buildOfflineAmazonInventorySyncState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R1-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      inventoryCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      discrepancyCount: 0,
      lastSyncAt: null,
      lastDecision: null,
      stockChangesDetected: 0,
      recentLogs: [],
    },
    latestReport: null as AmazonInventorySyncReport | null,
    inventory: [],
  };
}
