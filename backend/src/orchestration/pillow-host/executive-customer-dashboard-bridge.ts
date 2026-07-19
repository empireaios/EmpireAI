import { buildExecutiveCustomerDashboardConfiguration } from "@empireai/pillow";
import type {
  ExecutiveCustomerDashboardState,
  ExecutiveCustomerDashboardRunReport,
} from "@empireai/pillow";

function buildOfflineExecutiveCustomerDashboardState(): ExecutiveCustomerDashboardState {
  const configuration = buildExecutiveCustomerDashboardConfiguration();
  return {
    engineVersion: "PILLOW-ECD-001",
    missionId: "R4-18",
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
      failedSnapshots: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      refreshesPerformed: 0,
      displaysPerformed: 0,
      summariesGenerated: 0,
      kpisAggregated: 0,
      widgetsServed: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Executive Customer Dashboard snapshot when Pillow session is unavailable. */
export function collectExecutiveCustomerDashboardSnapshot() {
  const engine = buildOfflineExecutiveCustomerDashboardState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-18",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalSnapshots: 0,
      lastRefreshAt: null,
      identityEngineConnected: false,
      timelineEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as ExecutiveCustomerDashboardRunReport | null,
    snapshots: [],
    widgets: [],
    failures: [],
  };
}
