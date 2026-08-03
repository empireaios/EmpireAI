import { buildSharedSupplierIntelligenceConfiguration } from "@empireai/pillow";
import type {
  SharedSupplierIntelligenceState,
  SharedSupplierIntelligenceRunReport,
} from "@empireai/pillow";

function buildOfflineSharedSupplierIntelligenceState(): SharedSupplierIntelligenceState {
  const configuration = buildSharedSupplierIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-SSI-001",
    missionId: "X2-13",
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
      totalIntelligenceRecords: 0,
      sharedSuppliers: 0,
      highRiskSuppliers: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      consolidationsRun: 0,
      performanceAnalyses: 0,
      riskDetections: 0,
      duplicateDetections: 0,
      recommendationsGenerated: 0,
      shareOperations: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Shared Supplier Intelligence snapshot when Pillow session is unavailable. */
export function collectSharedSupplierIntelligenceSnapshot() {
  const engine = buildOfflineSharedSupplierIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalIntelligenceRecords: 0,
      sharedSuppliers: 0,
      highRiskSuppliers: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as SharedSupplierIntelligenceRunReport | null,
    intelligenceRecords: [],
  };
}
