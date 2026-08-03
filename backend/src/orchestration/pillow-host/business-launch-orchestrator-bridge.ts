import { buildBusinessLaunchOrchestratorConfiguration } from "@empireai/pillow";
import type {
  BusinessLaunchOrchestratorState,
  LaunchOrchestratorRunReport,
} from "@empireai/pillow";

function buildOfflineBusinessLaunchOrchestratorState(): BusinessLaunchOrchestratorState {
  const configuration = buildBusinessLaunchOrchestratorConfiguration();
  return {
    engineVersion: "PILLOW-BLO-001",
    missionId: "X1-11",
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
      totalLaunchRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      launchesOrchestrated: 0,
      workflowRuns: 0,
      dependencyRuns: 0,
      recoveryRuns: 0,
      reportRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Business Launch Orchestrator snapshot when Pillow session is unavailable. */
export function collectBusinessLaunchOrchestratorSnapshot() {
  const engine = buildOfflineBusinessLaunchOrchestratorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalLaunchRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { LaunchOrchestratorRunReport };
