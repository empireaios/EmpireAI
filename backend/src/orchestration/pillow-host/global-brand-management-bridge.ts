import { buildGlobalBrandManagementConfiguration } from "@empireai/pillow";
import type {
  GlobalBrandManagementState,
  GbmRunReport,
} from "@empireai/pillow";

function buildOfflineGlobalBrandManagementState(): GlobalBrandManagementState {
  const configuration = buildGlobalBrandManagementConfiguration();
  return {
    engineVersion: "PILLOW-GBM-001",
    missionId: "X4-11",
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
      totalBrandRecords: 0,
      inconsistencyCount: 0,
      reputationRiskCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      identityOps: 0,
      regionalAdaptationOps: 0,
      consistencyOps: 0,
      performanceMonitors: 0,
      reputationMonitors: 0,
      complianceMonitors: 0,
      inconsistencyDetections: 0,
      reputationRiskDetections: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Global Brand Management snapshot when Pillow session is unavailable. */
export function collectGlobalBrandManagementSnapshot() {
  const engine = buildOfflineGlobalBrandManagementState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalBrandRecords: 0,
      inconsistencyCount: 0,
      reputationRiskCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as GbmRunReport | null,
    brandRecords: [],
    recommendations: [],
  };
}
