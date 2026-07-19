import { buildWarehouseIntelligenceConfiguration } from "@empireai/pillow";
import type { WarehouseIntelligenceState, WarehouseReport } from "@empireai/pillow";

function buildOfflineWarehouseIntelligenceState(): WarehouseIntelligenceState {
  const configuration = buildWarehouseIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-WI-001",
    missionId: "R2-14",
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
      lastCoordinationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      warehouseFailures: 0,
      bottleneckCount: 0,
      shortageCount: 0,
      overstockCount: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      coordinationRuns: 0,
      warehousesCoordinated: 0,
      allocationsPerformed: 0,
      distributionsOptimized: 0,
      bottlenecksDetected: 0,
      shortagesDetected: 0,
      overstockDetected: 0,
      warehouseFailures: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Warehouse Intelligence snapshot when Pillow session is unavailable. */
export function collectWarehouseIntelligenceSnapshot() {
  const engine = buildOfflineWarehouseIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-14",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      warehouseCount: 0,
      lastCoordinationAt: null,
      lastDecision: null,
      bottleneckCount: 0,
      shortageCount: 0,
      overstockCount: 0,
      recentLogs: [],
    },
    latestReport: null as WarehouseReport | null,
    records: [],
  };
}
