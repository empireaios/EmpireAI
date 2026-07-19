import { buildLogisticsOptimizationConfiguration } from "@empireai/pillow";
import type { LogisticsOptimizationState, LogisticsReport } from "@empireai/pillow";

function buildOfflineLogisticsOptimizationState(): LogisticsOptimizationState {
  const configuration = buildLogisticsOptimizationConfiguration();
  return {
    engineVersion: "PILLOW-LO-001",
    missionId: "R2-17",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      logisticsRecordCount: 0,
      lastOptimizeAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      optimizationFailures: 0,
      bottlenecksDetected: 0,
      inefficientRoutesDetected: 0,
      recommendationsGenerated: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      optimizeRuns: 0,
      ordersOptimized: 0,
      routesAnalyzed: 0,
      carriersSelected: 0,
      warehousesOptimized: 0,
      costsReduced: 0,
      deliveryTimesOptimized: 0,
      bottlenecksDetected: 0,
      inefficientRoutesDetected: 0,
      recommendationsGenerated: 0,
      optimizationFailures: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Logistics Optimization snapshot when Pillow session is unavailable. */
export function collectLogisticsOptimizationSnapshot() {
  const engine = buildOfflineLogisticsOptimizationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-17",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      logisticsRecordCount: 0,
      lastOptimizeAt: null,
      lastDecision: null,
      bottlenecksDetected: 0,
      recommendationsGenerated: 0,
      costsReduced: 0,
      recentLogs: [],
    },
    latestReport: null as LogisticsReport | null,
    records: [],
  };
}
