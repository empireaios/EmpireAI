import { buildCrossBusinessKnowledgeEngineConfiguration } from "@empireai/pillow";
import type {
  CrossBusinessKnowledgeRunReport,
  CrossBusinessKnowledgeEngineState,
} from "@empireai/pillow";

function buildOfflineCrossBusinessKnowledgeEngineState(): CrossBusinessKnowledgeEngineState {
  const configuration = buildCrossBusinessKnowledgeEngineConfiguration();
  return {
    engineVersion: "PILLOW-CBK-001",
    missionId: "X2-04",
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
      totalKnowledgeRecords: 0,
      sharedKnowledgeRecords: 0,
      duplicateSignals: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      knowledgeCollected: 0,
      classifications: 0,
      sharesCompleted: 0,
      duplicatesDetected: 0,
      rankingsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Cross-Business Knowledge Engine snapshot when Pillow session is unavailable. */
export function collectCrossBusinessKnowledgeEngineSnapshot() {
  const engine = buildOfflineCrossBusinessKnowledgeEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalKnowledgeRecords: 0,
      sharedKnowledgeRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as CrossBusinessKnowledgeRunReport | null,
    knowledgeRecords: [],
  };
}
