import { buildMarketingAnalyticsDashboardConfiguration } from "@empireai/pillow";
import type {
  MarketingAnalyticsDashboardRunReport,
  MarketingAnalyticsDashboardState,
} from "@empireai/pillow";

function buildOfflineMarketingAnalyticsDashboardState(): MarketingAnalyticsDashboardState {
  const configuration = buildMarketingAnalyticsDashboardConfiguration();
  return {
    engineVersion: "PILLOW-MAD-001",
    missionId: "R5-10",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    latestSnapshot: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalRefreshes: 0,
      latestOverallScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      dashboardRefreshes: 0,
      kpiAggregations: 0,
      executiveSummariesGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Marketing Analytics Dashboard snapshot when Pillow session is unavailable. */
export function collectMarketingAnalyticsDashboardSnapshot() {
  const engine = buildOfflineMarketingAnalyticsDashboardState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-10",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      dashboardRefreshes: 0,
      latestOverallScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as MarketingAnalyticsDashboardRunReport | null,
    latestSnapshot: null,
  };
}
