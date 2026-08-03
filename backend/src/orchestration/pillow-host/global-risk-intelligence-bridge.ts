import { buildGlobalRiskIntelligenceConfiguration } from "@empireai/pillow";
import type {
  GlobalRiskIntelligenceState,
  RgoRunReport,
} from "@empireai/pillow";

function buildOfflineGlobalRiskIntelligenceState(): GlobalRiskIntelligenceState {
  const configuration = buildGlobalRiskIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-GRI-001",
    missionId: "X4-15",
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
      totalOptimizationRecords: 0,
      opportunityCount: 0,
      bottleneckCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      businessPerformanceMonitors: 0,
      revenueMonitors: 0,
      profitabilityMonitors: 0,
      customerGrowthMonitors: 0,
      efficiencyMonitors: 0,
      opportunityDetections: 0,
      bottleneckDetections: 0,
      priorityRankings: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Global Risk Intelligence snapshot when Pillow session is unavailable. */
export function collectGlobalRiskIntelligenceSnapshot() {
  const engine = buildOfflineGlobalRiskIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-15",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalOptimizationRecords: 0,
      opportunityCount: 0,
      bottleneckCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as RgoRunReport | null,
    riskRecords: [],
    recommendations: [],
  };
}
