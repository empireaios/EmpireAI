import { buildGlobalMarketIntelligenceConfiguration } from "@empireai/pillow";
import type {
  GlobalMarketIntelligenceState,
  GmiRunReport,
} from "@empireai/pillow";

function buildOfflineGlobalMarketIntelligenceState(): GlobalMarketIntelligenceState {
  const configuration = buildGlobalMarketIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-GMI-001",
    missionId: "X4-09",
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
      totalMarketRecords: 0,
      emergingCount: 0,
      decliningCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      marketMonitors: 0,
      trendAnalyses: 0,
      demandMonitors: 0,
      competitorAnalyses: 0,
      productOpportunityOps: 0,
      regionalGrowthOps: 0,
      emergingDetections: 0,
      decliningDetections: 0,
      opportunityRankings: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Global Market Intelligence snapshot when Pillow session is unavailable. */
export function collectGlobalMarketIntelligenceSnapshot() {
  const engine = buildOfflineGlobalMarketIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalMarketRecords: 0,
      emergingCount: 0,
      decliningCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as GmiRunReport | null,
    marketRecords: [],
    recommendations: [],
  };
}
