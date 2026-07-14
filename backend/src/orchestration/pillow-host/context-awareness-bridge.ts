import { buildContextAwarenessConfiguration } from "@empireai/pillow";
import type { ContextAwarenessState, WorkflowContextModel } from "@empireai/pillow";

function buildOfflineContextAwarenessState(): ContextAwarenessState {
  const configuration = buildContextAwarenessConfiguration();
  return {
    engineVersion: "PILLOW-CAE-001",
    missionId: "T1-07",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    activeSession: null,
    latestContext: null,
    previousContext: null,
    health: {
      status: "standby",
      healthScore: 50,
      awarenessEnabled: configuration.enabled,
      isAware: false,
      lastSuccessfulContextAt: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      averageProcessingDurationMs: 0,
      contextsPerMinute: 0,
      backlogSize: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalContexts: 0,
      successfulContexts: 0,
      failedContexts: 0,
      contextChanges: 0,
      averageProcessingDurationMs: 0,
      peakProcessingDurationMs: 0,
      skippedUpdates: 0,
      uptimeMs: 0,
    },
  };
}

/** Fallback Context Awareness snapshot when Pillow session is unavailable. */
export function collectContextAwarenessSnapshot() {
  const engine = buildOfflineContextAwarenessState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T1-07",
    live: false,
    engine,
    cockpit: {
      awarenessStatus: engine.status,
      healthStatus: engine.health.status,
      contextsGenerated: 0,
      currentWorkflowName: null,
      currentUserTask: null,
      contextState: null,
      interactionMode: null,
      changeDetected: false,
      confidenceScore: 0,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestContext: null as WorkflowContextModel | null,
  };
}
