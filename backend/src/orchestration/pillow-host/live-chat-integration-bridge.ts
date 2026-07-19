import { buildLiveChatIntegrationConfiguration } from "@empireai/pillow";
import type { LiveChatRunReport, LiveChatIntegrationState } from "@empireai/pillow";

function buildOfflineLiveChatIntegrationState(): LiveChatIntegrationState {
  const configuration = buildLiveChatIntegrationConfiguration();
  return {
    engineVersion: "PILLOW-LCI-001",
    missionId: "R4-07",
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
      totalLiveChatRecords: 0,
      waitingSessions: 0,
      activeSessions: 0,
      failedSessions: 0,
      queuedMessages: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      sessionsCreated: 0,
      customerMessagesReceived: 0,
      supportResponsesSent: 0,
      conversationsManaged: 0,
      queueProcessed: 0,
      sessionsAssigned: 0,
      statusTracked: 0,
      responseTimesTracked: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
      averageResponseTimeMs: 0,
    },
  };
}

/** Fallback Live Chat Integration snapshot when Pillow session is unavailable. */
export function collectLiveChatIntegrationSnapshot() {
  const engine = buildOfflineLiveChatIntegrationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalLiveChatRecords: 0,
      waitingSessions: 0,
      activeSessions: 0,
      queuedMessages: 0,
      timelineEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as LiveChatRunReport | null,
    liveChatRecords: [],
    conversations: [],
    messages: [],
  };
}
