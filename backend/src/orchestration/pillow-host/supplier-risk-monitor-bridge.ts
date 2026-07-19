import { buildSupplierRiskMonitorConfiguration } from "@empireai/pillow";
import type { SupplierRiskMonitorState, SupplierRiskReport } from "@empireai/pillow";

function buildOfflineSupplierRiskMonitorState(): SupplierRiskMonitorState {
  const configuration = buildSupplierRiskMonitorConfiguration();
  return {
    engineVersion: "PILLOW-SRM-001",
    missionId: "R2-16",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      supplierCount: 0,
      lastMonitorAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      monitoringFailures: 0,
      highRiskCount: 0,
      disruptionCount: 0,
      alertsGenerated: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitorRuns: 0,
      suppliersMonitored: 0,
      riskScoresCalculated: 0,
      alertsGenerated: 0,
      disruptionsDetected: 0,
      abnormalBehaviourDetected: 0,
      monitoringFailures: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Supplier Risk Monitor snapshot when Pillow session is unavailable. */
export function collectSupplierRiskMonitorSnapshot() {
  const engine = buildOfflineSupplierRiskMonitorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-16",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      supplierCount: 0,
      lastMonitorAt: null,
      lastDecision: null,
      highRiskCount: 0,
      disruptionCount: 0,
      alertsGenerated: 0,
      recentLogs: [],
    },
    latestReport: null as SupplierRiskReport | null,
    records: [],
  };
}
