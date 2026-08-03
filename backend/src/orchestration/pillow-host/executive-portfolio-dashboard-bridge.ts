import { buildExecutivePortfolioDashboardConfiguration } from "@empireai/pillow";
import type {
  ExecutivePortfolioDashboardRunReport,
  ExecutivePortfolioDashboardState,
} from "@empireai/pillow";

function buildOfflineExecutivePortfolioDashboardState(): ExecutivePortfolioDashboardState {
  const configuration = buildExecutivePortfolioDashboardConfiguration();
  return {
    engineVersion: "PILLOW-EPD-001",
    missionId: "X2-06",
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
      alertsGenerated: 0,
      recommendationsGenerated: 0,
      drillDowns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Executive Portfolio Dashboard snapshot when Pillow session is unavailable. */
export function collectExecutivePortfolioDashboardSnapshot() {
  const engine = buildOfflineExecutivePortfolioDashboardState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      companiesTracked: 0,
      overallKpiScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as ExecutivePortfolioDashboardRunReport | null,
    latestSnapshot: null,
  };
}
