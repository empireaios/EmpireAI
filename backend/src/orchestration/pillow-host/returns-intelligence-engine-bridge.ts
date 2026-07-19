import { buildReturnsIntelligenceEngineConfiguration } from "@empireai/pillow";
import type { ReturnsIntelligenceEngineState, ReturnsIntelligenceRunReport } from "@empireai/pillow";

function buildOfflineReturnsIntelligenceEngineState(): ReturnsIntelligenceEngineState {
  const configuration = buildReturnsIntelligenceEngineConfiguration();
  return {
    engineVersion: "PILLOW-RIE-001",
    missionId: "R4-13",
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
      totalReturnIntelligenceRecords: 0,
      highRiskReturns: 0,
      repeatPatternCustomers: 0,
      activeInsights: 0,
      failedRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      requestsReceived: 0,
      eligibilityEvaluations: 0,
      historyAnalyses: 0,
      abnormalDetected: 0,
      repeatPatternsDetected: 0,
      recommendationsGenerated: 0,
      lifecycleTracked: 0,
      communicationsCoordinated: 0,
      insightsGenerated: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Returns Intelligence snapshot when Pillow session is unavailable. */
export function collectReturnsIntelligenceEngineSnapshot() {
  const engine = buildOfflineReturnsIntelligenceEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalReturnIntelligenceRecords: 0,
      highRiskReturns: 0,
      activeInsights: 0,
      identityEngineConnected: false,
      crmFoundationConnected: false,
      timelineEngineConnected: false,
      returnManagementEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as ReturnsIntelligenceRunReport | null,
    returnIntelligenceRecords: [],
    insights: [],
    failures: [],
  };
}
