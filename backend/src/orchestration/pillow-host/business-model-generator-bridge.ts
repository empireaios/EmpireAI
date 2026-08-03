import { buildBusinessModelGeneratorConfiguration } from "@empireai/pillow";
import type {
  BusinessModelGeneratorState,
  BusinessModelRunReport,
} from "@empireai/pillow";

function buildOfflineBusinessModelGeneratorState(): BusinessModelGeneratorState {
  const configuration = buildBusinessModelGeneratorConfiguration();
  return {
    engineVersion: "PILLOW-BMG-001",
    missionId: "X1-04",
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
      totalBusinessModelRecords: 0,
      averageBusinessModelScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      generationsRun: 0,
      revenueModelRuns: 0,
      segmentRuns: 0,
      scoringRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Business Model Generator snapshot when Pillow session is unavailable. */
export function collectBusinessModelGeneratorSnapshot() {
  const engine = buildOfflineBusinessModelGeneratorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalBusinessModelRecords: 0,
      averageBusinessModelScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as BusinessModelRunReport | null,
    businessModelRecords: [],
  };
}
