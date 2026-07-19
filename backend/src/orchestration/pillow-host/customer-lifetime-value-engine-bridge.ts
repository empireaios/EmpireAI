import { buildCustomerLifetimeValueEngineConfiguration } from "@empireai/pillow";
import type {
  CustomerLifetimeValueEngineState,
  ClvRunReport,
} from "@empireai/pillow";

function buildOfflineCustomerLifetimeValueEngineState(): CustomerLifetimeValueEngineState {
  const configuration = buildCustomerLifetimeValueEngineConfiguration();
  return {
    engineVersion: "PILLOW-CLVE-001",
    missionId: "R4-15",
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
      totalClvRecords: 0,
      highValueCustomers: 0,
      decliningValueCustomers: 0,
      failedRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      clvCalculations: 0,
      revenueAnalyses: 0,
      profitabilityAnalyses: 0,
      retentionAnalyses: 0,
      purchaseFrequencyTracked: 0,
      averageOrderValueTracked: 0,
      predictionsGenerated: 0,
      highValueIdentified: 0,
      decliningValueIdentified: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback CLV snapshot when Pillow session is unavailable. */
export function collectCustomerLifetimeValueEngineSnapshot() {
  const engine = buildOfflineCustomerLifetimeValueEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-15",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalClvRecords: 0,
      highValueCustomers: 0,
      decliningValueCustomers: 0,
      identityEngineConnected: false,
      crmFoundationConnected: false,
      revenueEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as ClvRunReport | null,
    clvRecords: [],
    insights: [],
    failures: [],
  };
}
