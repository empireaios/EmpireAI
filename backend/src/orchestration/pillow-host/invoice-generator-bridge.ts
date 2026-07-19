import { buildInvoiceGeneratorConfiguration } from "@empireai/pillow";
import type {
  InvoiceGeneratorRunReport,
  InvoiceGeneratorState,
} from "@empireai/pillow";

function buildOfflineInvoiceGeneratorState(): InvoiceGeneratorState {
  const configuration = buildInvoiceGeneratorConfiguration();
  return {
    engineVersion: "PILLOW-IG-001",
    missionId: "R3-09",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    generatorRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      generatorEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalInvoiceRecords: 0,
      aggregateInvoiceAmount: 0,
      lastInvoiceStatus: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      customerInvoicesCreated: 0,
      supplierInvoicesCreated: 0,
      lifecycleUpdates: 0,
      inconsistenciesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Invoice Generator snapshot when Pillow session is unavailable. */
export function collectInvoiceGeneratorSnapshot() {
  const engine = buildOfflineInvoiceGeneratorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalInvoiceRecords: 0,
      aggregateInvoiceAmount: 0,
      lastInvoiceStatus: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as InvoiceGeneratorRunReport | null,
    invoiceRecords: [],
  };
}
