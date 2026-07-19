import { buildCrmFoundationConfiguration } from "@empireai/pillow";
import type { CrmRunReport, CrmFoundationState } from "@empireai/pillow";

function buildOfflineCrmFoundationState(): CrmFoundationState {
  const configuration = buildCrmFoundationConfiguration();
  return {
    engineVersion: "PILLOW-CRM-001",
    missionId: "R4-02",
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
      totalCrmRecords: 0,
      activeCustomers: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      profilesCreated: 0,
      recordsUpdated: 0,
      searchesPerformed: 0,
      notesAdded: 0,
      tagsUpdated: 0,
      attributesUpdated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback CRM Foundation snapshot when Pillow session is unavailable. */
export function collectCrmFoundationSnapshot() {
  const engine = buildOfflineCrmFoundationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-02",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCrmRecords: 0,
      activeCustomers: 0,
      identityEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as CrmRunReport | null,
    crmRecords: [],
  };
}
