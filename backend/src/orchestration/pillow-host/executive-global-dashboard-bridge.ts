import { buildExecutiveGlobalDashboardConfiguration } from "@empireai/pillow";
import type {
  ExecutiveGlobalDashboardState,
  EgdRunReport,
} from "@empireai/pillow";

function buildOfflineExecutiveGlobalDashboardState(): ExecutiveGlobalDashboardState {
  const configuration = buildExecutiveGlobalDashboardConfiguration();
  return {
    engineVersion: "PILLOW-EGD-001",
    missionId: "X4-10",
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
      totalSnapshots: 0,
      alertCount: 0,
      widgetCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      worldwideOpsDisplays: 0,
      countryExpansionDisplays: 0,
      regionalPerformanceDisplays: 0,
      marketOpportunityDisplays: 0,
      logisticsDisplays: 0,
      complianceDisplays: 0,
      taxationDisplays: 0,
      localizationDisplays: 0,
      alertDisplays: 0,
      recommendationDisplays: 0,
      refreshOps: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Executive Global Dashboard snapshot when Pillow session is unavailable. */
export function collectExecutiveGlobalDashboardSnapshot() {
  const engine = buildOfflineExecutiveGlobalDashboardState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-10",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalSnapshots: 0,
      alertCount: 0,
      widgetCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as EgdRunReport | null,
    snapshots: [],
    recommendations: [],
  };
}
