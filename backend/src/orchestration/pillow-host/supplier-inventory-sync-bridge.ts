import { buildSupplierInventorySyncConfiguration } from "@empireai/pillow";
import type {
  SupplierInventorySyncReport,
  SupplierInventorySyncState,
} from "@empireai/pillow";

function buildOfflineSupplierInventorySyncState(): SupplierInventorySyncState {
  const configuration = buildSupplierInventorySyncConfiguration();
  return {
    engineVersion: "PILLOW-SIS-001",
    missionId: "R2-06",
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
      lastSynchronizationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      synchronizationFailures: 0,
      stockIncreasesDetected: 0,
      stockDecreasesDetected: 0,
      outOfStockDetected: 0,
      discontinuedDetected: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      synchronizationRuns: 0,
      recordsSynchronized: 0,
      stockIncreasesDetected: 0,
      stockDecreasesDetected: 0,
      outOfStockDetected: 0,
      discontinuedDetected: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Supplier Inventory Sync snapshot when Pillow session is unavailable. */
export function collectSupplierInventorySyncSnapshot() {
  const engine = buildOfflineSupplierInventorySyncState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      inventoryCount: 0,
      lastSynchronizationAt: null,
      lastDecision: null,
      stockIncreasesDetected: 0,
      stockDecreasesDetected: 0,
      outOfStockDetected: 0,
      discontinuedDetected: 0,
      recentLogs: [],
    },
    latestReport: null as SupplierInventorySyncReport | null,
    inventory: [],
  };
}
