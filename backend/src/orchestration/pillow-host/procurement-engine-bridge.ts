import { buildProcurementEngineConfiguration } from "@empireai/pillow";
import type { ProcurementReport, ProcurementEngineState } from "@empireai/pillow";

function buildOfflineProcurementEngineState(): ProcurementEngineState {
  const configuration = buildProcurementEngineConfiguration();
  return {
    engineVersion: "PILLOW-PCE-001",
    missionId: "R2-09",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    purchaseOrders: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      procurementCount: 0,
      lastProcurementAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      procurementFailures: 0,
      purchaseOrdersCreated: 0,
      approvalsPending: 0,
      invalidRequestsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      procurementRequests: 0,
      purchaseOrdersCreated: 0,
      approvalsGranted: 0,
      approvalsRejected: 0,
      supplierSelections: 0,
      procurementFailures: 0,
      invalidRequestsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Procurement Engine snapshot when Pillow session is unavailable. */
export function collectProcurementEngineSnapshot() {
  const engine = buildOfflineProcurementEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      procurementCount: 0,
      purchaseOrderCount: 0,
      lastProcurementAt: null,
      lastDecision: null,
      approvalsPending: 0,
      purchaseOrdersCreated: 0,
      recentLogs: [],
    },
    latestReport: null as ProcurementReport | null,
    records: [],
    purchaseOrders: [],
  };
}
