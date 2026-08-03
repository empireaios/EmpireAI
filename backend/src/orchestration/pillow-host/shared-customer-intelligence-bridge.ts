import { buildSharedCustomerIntelligenceConfiguration } from "@empireai/pillow";
import type {
  SharedCustomerIntelligenceState,
  SharedCustomerIntelligenceRunReport,
} from "@empireai/pillow";

function buildOfflineSharedCustomerIntelligenceState(): SharedCustomerIntelligenceState {
  const configuration = buildSharedCustomerIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-SCI-001",
    missionId: "X2-12",
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
      crossCompanyRelationships: 0,
      highRiskCustomers: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      consolidationsRun: 0,
      identityResolutions: 0,
      behaviourAnalyses: 0,
      insightsGenerated: 0,
      crossSellDetections: 0,
      riskDetections: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Shared Customer Intelligence snapshot when Pillow session is unavailable. */
export function collectSharedCustomerIntelligenceSnapshot() {
  const engine = buildOfflineSharedCustomerIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalIntelligenceRecords: 0,
      crossCompanyRelationships: 0,
      highRiskCustomers: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as SharedCustomerIntelligenceRunReport | null,
    intelligenceRecords: [],
  };
}
