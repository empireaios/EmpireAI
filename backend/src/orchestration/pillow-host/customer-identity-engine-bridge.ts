import { buildCustomerIdentityEngineConfiguration } from "@empireai/pillow";
import type {
  CustomerIdentityRunReport,
  CustomerIdentityEngineState,
} from "@empireai/pillow";

function buildOfflineCustomerIdentityEngineState(): CustomerIdentityEngineState {
  const configuration = buildCustomerIdentityEngineConfiguration();
  return {
    engineVersion: "PILLOW-CIE-001",
    missionId: "R4-01",
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
      totalCustomerRecords: 0,
      activeIdentities: 0,
      mergedIdentities: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      identitiesCreated: 0,
      identitiesLinked: 0,
      duplicatesDetected: 0,
      identitiesMerged: 0,
      identitiesResolved: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Customer Identity Engine snapshot when Pillow session is unavailable. */
export function collectCustomerIdentityEngineSnapshot() {
  const engine = buildOfflineCustomerIdentityEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCustomerRecords: 0,
      activeIdentities: 0,
      recentLogs: [],
    },
    latestReport: null as CustomerIdentityRunReport | null,
    customerRecords: [],
  };
}
