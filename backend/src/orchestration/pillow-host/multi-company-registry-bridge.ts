import { buildMultiCompanyRegistryConfiguration } from "@empireai/pillow";
import type {
  MultiCompanyRegistryRunReport,
  MultiCompanyRegistryState,
} from "@empireai/pillow";

function buildOfflineMultiCompanyRegistryState(): MultiCompanyRegistryState {
  const configuration = buildMultiCompanyRegistryConfiguration();
  return {
    engineVersion: "PILLOW-MCR-001",
    missionId: "X2-02",
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
      totalCompanyRecords: 0,
      activeCompanies: 0,
      duplicateSignals: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      companiesRegistered: 0,
      profileUpdates: 0,
      classifications: 0,
      lifecycleTransitions: 0,
      duplicatesDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Multi-Company Registry snapshot when Pillow session is unavailable. */
export function collectMultiCompanyRegistrySnapshot() {
  const engine = buildOfflineMultiCompanyRegistryState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-02",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCompanyRecords: 0,
      activeCompanies: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as MultiCompanyRegistryRunReport | null,
    companyRecords: [],
  };
}
