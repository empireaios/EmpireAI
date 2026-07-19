import { buildAutonomousMarketingEngineConfiguration } from "@empireai/pillow";
import type {
  AutonomousMarketingEngineState,
  AutonomousMarketingRunReport,
} from "@empireai/pillow";

function buildOfflineAutonomousMarketingEngineState(): AutonomousMarketingEngineState {
  const configuration = buildAutonomousMarketingEngineConfiguration();
  return {
    engineVersion: "PILLOW-AME-001",
    missionId: "R5-19",
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
      totalAutonomousRecords: 0,
      pendingApprovals: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      recommendationsGenerated: 0,
      optimizationsRun: 0,
      approvedExecutions: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Autonomous Marketing Engine snapshot when Pillow session is unavailable. */
export function collectAutonomousMarketingEngineSnapshot() {
  const engine = buildOfflineAutonomousMarketingEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-19",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalAutonomousRecords: 0,
      pendingApprovals: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as AutonomousMarketingRunReport | null,
    autonomousMarketingRecords: [],
  };
}
