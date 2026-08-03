import { buildExecutiveScalingDashboardConfiguration } from "@empireai/pillow";
import type {
  ExecutiveScalingDashboardState,
  EsdRunReport,
} from "@empireai/pillow";

function buildOfflineExecutiveScalingDashboardState(): ExecutiveScalingDashboardState {
  const configuration = buildExecutiveScalingDashboardConfiguration();
  return {
    engineVersion: "PILLOW-ESD-001",
    missionId: "X3-09",
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
      totalDashboardSnapshots: 0,
      alertCount: 0,
      averageReadiness: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      refreshRuns: 0,
      widgetQueries: 0,
      alertsGenerated: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Executive Scaling Dashboard snapshot when Pillow session is unavailable. */
export function collectExecutiveScalingDashboardSnapshot() {
  const engine = buildOfflineExecutiveScalingDashboardState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalDashboardSnapshots: 0,
      alertCount: 0,
      averageReadiness: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as EsdRunReport | null,
    dashboardSnapshots: [],
    recommendations: [],
  };
}
