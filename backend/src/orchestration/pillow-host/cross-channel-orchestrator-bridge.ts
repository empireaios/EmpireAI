import { buildCrossChannelOrchestratorConfiguration } from "@empireai/pillow";
import type {
  CrossChannelOrchestratorState,
  CrossChannelOrchestrationRunReport,
} from "@empireai/pillow";

function buildOfflineCrossChannelOrchestratorState(): CrossChannelOrchestratorState {
  const configuration = buildCrossChannelOrchestratorConfiguration();
  return {
    engineVersion: "PILLOW-CCO-001",
    missionId: "R5-18",
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
      totalOrchestrationRecords: 0,
      conflictedOrchestrations: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      coordinationsRun: 0,
      synchronizationsRun: 0,
      conflictsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Cross-Channel Orchestrator snapshot when Pillow session is unavailable. */
export function collectCrossChannelOrchestratorSnapshot() {
  const engine = buildOfflineCrossChannelOrchestratorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-18",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalOrchestrationRecords: 0,
      conflictedOrchestrations: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as CrossChannelOrchestrationRunReport | null,
    orchestrationRecords: [],
  };
}
