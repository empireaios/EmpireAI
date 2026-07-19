import { buildAccountingExportEngineConfiguration } from "@empireai/pillow";
import type {
  AccountingExportRunReport,
  AccountingExportEngineState,
} from "@empireai/pillow";

function buildOfflineAccountingExportEngineState(): AccountingExportEngineState {
  const configuration = buildAccountingExportEngineConfiguration();
  return {
    engineVersion: "PILLOW-AEE-001",
    missionId: "R3-17",
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
      totalExportRecords: 0,
      lastExportFormat: null,
      lastExportStatus: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      exportsGenerated: 0,
      exportsValidated: 0,
      failuresDetected: 0,
      packagesCreated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Accounting Export Engine snapshot when Pillow session is unavailable. */
export function collectAccountingExportEngineSnapshot() {
  const engine = buildOfflineAccountingExportEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-17",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalExportRecords: 0,
      lastExportFormat: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as AccountingExportRunReport | null,
    exportRecords: [],
    packages: [],
  };
}
