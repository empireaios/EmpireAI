import { buildExecutiveFinancialDashboardConfiguration } from "@empireai/pillow";
import type {
  ExecutiveDashboardRunReport,
  ExecutiveFinancialDashboardState,
} from "@empireai/pillow";

function buildOfflineExecutiveFinancialDashboardState(): ExecutiveFinancialDashboardState {
  const configuration = buildExecutiveFinancialDashboardConfiguration();
  return {
    engineVersion: "PILLOW-EFD-001",
    missionId: "R3-16",
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
      lastRefreshAt: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      refreshesPerformed: 0,
      summariesGenerated: 0,
      kpisAggregated: 0,
      widgetsServed: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Executive Financial Dashboard snapshot when Pillow session is unavailable. */
export function collectExecutiveFinancialDashboardSnapshot() {
  const engine = buildOfflineExecutiveFinancialDashboardState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-16",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalSnapshots: 0,
      lastRefreshAt: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as ExecutiveDashboardRunReport | null,
    snapshots: [],
  };
}
